import type { ClientExercise } from "@/exercises/types";
import type { CheckOutcome, CheckPayload } from "@/sandbox/types";
import { analyzeWith, type Facts } from "@/lib/checks/analyze";
import { bestPracticeNotes, evaluateRule } from "@/lib/checks/static";
import { computeVerdict, type CheckResult, type RequirementResult, type Verdict } from "@/lib/checks/verdict";
import { compileWith, type Babel, type CompileError } from "@/lib/compile";
import { applyTextEdits } from "@/lib/fix";
import { quickFixes } from "@/lib/quickfix";
import type { ReviewReport } from "./types";

export type CheckRunner = (payload: {
  code: string;
  checks: CheckPayload[];
  mockApi?: string;
}) => Promise<{ smoke: CheckOutcome; results: CheckOutcome[] }>;

export type EvaluableExercise = Pick<ClientExercise, "requirements" | "checks" | "mockApi">;

export interface Evaluation {
  verdict: Verdict;
  requirements: RequirementResult[];
  checks: CheckResult[];
  compileError?: CompileError;
  crash?: string;
  facts?: Facts;
}

/** Compiles, runs static rules and sandboxed runtime checks, and computes the verdict. */
export async function evaluateCode(
  babel: Babel,
  exercise: EvaluableExercise,
  code: string,
  runner: CheckRunner,
): Promise<Evaluation> {
  const compiled = compileWith(babel, code);
  if (!compiled.ok) {
    const checks = exercise.checks.map((check) => ({
      id: check.id,
      requirementId: check.requirementId,
      label: check.label,
      kind: check.kind,
      passed: false,
      message: "The code doesn't compile.",
    }));
    return { ...computeVerdict({ requirements: exercise.requirements, checks, blocked: true }), checks, compileError: compiled.error };
  }

  const analysis = analyzeWith(babel, code);
  const facts = analysis.ok ? analysis.facts : undefined;

  const runtimeChecks = exercise.checks.flatMap((check) =>
    check.kind === "runtime" ? [{ id: check.id, source: check.source, timeoutMs: check.timeoutMs }] : [],
  );

  let smoke: CheckOutcome;
  let outcomes = new Map<string, CheckOutcome>();
  try {
    const run = await runner({ code: compiled.js, checks: runtimeChecks, mockApi: exercise.mockApi });
    smoke = run.smoke;
    outcomes = new Map(run.results.map((result) => [result.id, result]));
  } catch (error) {
    smoke = { id: "__smoke__", passed: false, message: error instanceof Error ? error.message : String(error) };
  }

  const checks: CheckResult[] = exercise.checks.map((check) => {
    const base = { id: check.id, requirementId: check.requirementId, label: check.label, kind: check.kind };
    if (check.kind === "static") {
      const outcome = facts ? evaluateRule(check.rule, facts) : { passed: false, message: "Code could not be analyzed." };
      return { ...base, ...outcome };
    }
    const outcome = outcomes.get(check.id);
    if (!outcome) return { ...base, passed: false, message: smoke.message ?? "The check did not run." };
    return { ...base, passed: outcome.passed, message: outcome.message };
  });

  const blocked = !smoke.passed;
  return {
    ...computeVerdict({ requirements: exercise.requirements, checks, blocked }),
    checks,
    crash: blocked ? smoke.message ?? "The component failed to render." : undefined,
    facts,
  };
}

/** Builds the deterministic part of the feedback (AI review is merged in afterwards). */
export function buildReport(code: string, evaluation: Evaluation, aiEnabled: boolean): ReviewReport {
  const { checks, compileError, crash, facts } = evaluation;
  const good = [...new Set(checks.filter((check) => check.passed).map((check) => check.label))];
  const issues: ReviewReport["issues"] = [];
  if (compileError) {
    issues.push({ text: `Syntax error${compileError.line ? ` on line ${compileError.line}` : ""}: ${compileError.message}` });
  } else if (crash) {
    issues.push({ text: `The component doesn't render: ${crash}` });
  }
  if (!compileError && !crash) {
    for (const check of checks) {
      if (!check.passed) {
        issues.push({ requirementId: check.requirementId, text: `${check.label}: ${check.message ?? "failed"}` });
      }
    }
  }

  const notes = facts ? bestPracticeNotes(facts) : [];
  let fix: ReviewReport["fix"];
  if (facts) {
    const edits = quickFixes(code, facts);
    if (edits.length > 0) {
      const { code: fixed, applied } = applyTextEdits(code, edits);
      if (fixed !== code) fix = { code: fixed, source: "quickfix", reasons: applied.map((edit) => edit.reason) };
    }
  }

  return {
    submittedCode: code,
    verdict: evaluation.verdict,
    requirements: evaluation.requirements,
    checks,
    compileError,
    crash,
    good,
    issues,
    notes,
    aiNotes: [],
    fix,
    ai: { status: aiEnabled && !compileError ? "loading" : "off" },
  };
}
