import "server-only";
import { APICallError, generateText, Output } from "ai";
import { z } from "zod";
import type { Exercise } from "@/exercises/types";
import { compileWith, loadBabel } from "@/lib/compile";
import { applyTextEdits, diffCode, lineEditsToTextEdits, type LineEdit } from "@/lib/fix";
import type { ReviewRequest, ReviewResponse } from "./types";

export const DEFAULT_REVIEW_MODEL = "anthropic/claude-sonnet-5.5";

/** Share of the user's existing lines a fix may rewrite or delete. */
const MAX_REWRITTEN_RATIO = 0.4;
/** Tiny files need some slack: rewriting 3 lines is always fine. */
const MIN_REWRITE_ALLOWANCE = 3;
const MAX_ADDED_LINES = 60;

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

const reviewSchema = z.object({
  good: z
    .array(z.string())
    .describe("1-4 short, specific things the code does well. Refer to the user's own names."),
  issues: z
    .array(
      z.object({
        requirementId: z
          .string()
          .nullable()
          .describe("The id of the unmet requirement this issue belongs to, or null for general issues."),
        text: z.string().describe("What is missing or wrong, and why. One or two sentences."),
      }),
    )
    .describe("Problems that keep requirements from being met. Empty if everything passes."),
  bestPractices: z
    .array(z.string())
    .describe("0-4 React best-practice notes (hooks rules, keys, effects, state shape, accessibility). Be concrete."),
  edits: z
    .array(
      z.object({
        startLine: z.number().int().describe("First line to replace (1-based, inclusive)."),
        endLine: z
          .number()
          .int()
          .describe("Last line to replace (inclusive). Use startLine - 1 to insert before startLine without replacing."),
        replacement: z.string().describe("The new text for those lines, without line numbers."),
        reason: z.string().describe("Why this change is needed, in one short sentence."),
      }),
    )
    .describe("The smallest set of line edits that makes the code meet the requirements. Empty if nothing needs to change."),
});

type RawReview = z.infer<typeof reviewSchema>;

const INSTRUCTIONS = `You are a senior React engineer reviewing a candidate's solution to a React interview exercise.

Give feedback the way a helpful interviewer would: specific, kind and short. Refer to the candidate's own variable and component names.

Rules for the suggested fix (the "edits" field):
- Make the MINIMAL change that satisfies the failing requirements. Fix only what is broken or missing.
- Keep the candidate's names, structure, formatting style and approach. Do not rename things, reorder code, or rewrite working parts.
- Never paste the reference solution. It is given only so you understand the intended behavior; the candidate's approach may differ and still be correct.
- Each edit replaces whole lines (startLine..endLine, 1-based, inclusive) of the ORIGINAL code. Edits must not overlap.
- If all requirements pass, return no edits (or only tiny best-practice edits).
- The result must be valid JSX that still has a default export.

Automated checks already decided the verdict; don't contradict their pass/fail results.`;

function numbered(code: string): string {
  const lines = code.split("\n");
  const width = String(lines.length).length;
  return lines.map((line, i) => `${String(i + 1).padStart(width, " ")} | ${line}`).join("\n");
}

function buildPrompt(exercise: Exercise, request: ReviewRequest): string {
  const requirements = exercise.requirements.map((r) => `- [${r.id}] ${r.text}`).join("\n");
  const checks = request.checks
    .map((c) => `- ${c.passed ? "PASS" : "FAIL"} [${c.requirementId}] ${c.label}${!c.passed && c.message ? ` — ${c.message}` : ""}`)
    .join("\n");
  const notes = request.notes.length > 0 ? request.notes.map((n) => `- ${n}`).join("\n") : "(none)";

  return `# Exercise: ${exercise.title} (${exercise.difficulty})

${exercise.description}

## Requirements
${requirements}

## Automated check results (verdict: ${request.verdict})
${checks}

## Static analysis notes
${notes}

## Candidate's code (line numbers are not part of the code)
\`\`\`jsx
${numbered(request.code)}
\`\`\`

## Reference solution (context only, do NOT copy it into the fix)
\`\`\`jsx
${exercise.referenceSolution}
\`\`\``;
}

/** Returns why the fix is unacceptable, or null if it's fine. */
async function validateEdits(code: string, edits: LineEdit[]): Promise<string | null> {
  if (edits.length === 0) return null;
  const { code: fixed } = applyTextEdits(code, lineEditsToTextEdits(code, edits));
  if (fixed === code) return null;

  const diff = diffCode(code, fixed);
  const removed = diff.filter((line) => line.type === "remove").length;
  const added = diff.filter((line) => line.type === "add").length;
  const original = Math.max(1, code.split("\n").length);
  const allowed = Math.max(MIN_REWRITE_ALLOWANCE, Math.floor(original * MAX_REWRITTEN_RATIO));
  if (removed > allowed) {
    return `The edits rewrite ${removed} of ${original} existing lines; at most ${allowed} may change. Keep the candidate's code and only touch what's broken.`;
  }
  if (added > MAX_ADDED_LINES) {
    return `The edits add ${added} lines; keep the fix under ${MAX_ADDED_LINES} added lines.`;
  }

  const compiled = compileWith(await loadBabel(), fixed);
  if (!compiled.ok) {
    return `The fixed code doesn't compile: ${compiled.error.message}${compiled.error.line ? ` (line ${compiled.error.line})` : ""}.`;
  }
  return null;
}

function toResponse(raw: RawReview, edits: LineEdit[], fixRejected?: string): ReviewResponse {
  return {
    good: raw.good.slice(0, 6),
    issues: raw.issues.slice(0, 10).map((issue) => ({
      requirementId: issue.requirementId ?? undefined,
      text: issue.text,
    })),
    bestPractices: raw.bestPractices.slice(0, 6),
    edits,
    fixRejected,
  };
}

async function ask(prompt: string, signal: AbortSignal): Promise<RawReview> {
  const { output } = await generateText({
    model: process.env.REVIEW_MODEL || DEFAULT_REVIEW_MODEL,
    instructions: INSTRUCTIONS,
    prompt,
    output: Output.object({ schema: reviewSchema }),
    maxRetries: 1,
    abortSignal: signal,
  });
  return output;
}

export async function reviewWithAi(exercise: Exercise, request: ReviewRequest): Promise<ReviewResponse> {
  const signal = AbortSignal.timeout(55_000);
  const prompt = buildPrompt(exercise, request);

  const first = await ask(prompt, signal);
  const problem = await validateEdits(request.code, first.edits);
  if (!problem) return toResponse(first, first.edits);

  const retryPrompt = `${prompt}

## Your previous fix was rejected
${problem}

Return a smaller fix this time: change as few lines as possible and keep everything else exactly as the candidate wrote it.`;
  try {
    const second = await ask(retryPrompt, signal);
    const secondProblem = await validateEdits(request.code, second.edits);
    if (!secondProblem) return toResponse(first, second.edits);
    return toResponse(first, [], secondProblem);
  } catch {
    return toResponse(first, [], problem);
  }
}

/** Maps provider failures to a status code and a message the UI can show. */
export function describeAiError(error: unknown): { status: number; message: string } {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return { status: 503, message: "The AI Gateway rejected the credentials. Check AI_GATEWAY_API_KEY." };
    }
    if (error.statusCode === 402) {
      return { status: 503, message: "The AI Gateway account is out of credits." };
    }
    if (error.statusCode === 429) {
      return { status: 429, message: "The AI reviewer is rate limited. Try again in a minute." };
    }
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return { status: 504, message: "The AI review took too long." };
  }
  return { status: 502, message: "The AI review failed. The automated feedback above is still accurate." };
}
