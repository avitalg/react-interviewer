import type { CompileError } from "@/lib/compile";
import type { Note } from "@/lib/checks/static";
import type { CheckResult, RequirementResult, Verdict } from "@/lib/checks/verdict";
import type { LineEdit } from "@/lib/fix";

export interface Issue {
  requirementId?: string;
  text: string;
}

export interface SuggestedFix {
  code: string;
  source: "ai" | "quickfix";
  reasons: string[];
  /** How the fixed code does against the checks, filled in after re-running them. */
  score?: { passed: number; total: number; verdict: Verdict };
}

export interface ReviewReport {
  submittedCode: string;
  verdict: Verdict;
  requirements: RequirementResult[];
  checks: CheckResult[];
  compileError?: CompileError;
  crash?: string;
  good: string[];
  issues: Issue[];
  notes: Note[];
  aiNotes: string[];
  fix?: SuggestedFix;
  ai: { status: "off" | "loading" | "done" | "error"; message?: string };
}

export interface ReviewRequest {
  exerciseId: string;
  code: string;
  verdict: Verdict;
  checks: Pick<CheckResult, "requirementId" | "label" | "passed" | "message">[];
  notes: string[];
}

export interface ReviewResponse {
  good: string[];
  issues: Issue[];
  bestPractices: string[];
  edits: LineEdit[];
  /** Set when the model's fix was discarded by the guardrails. */
  fixRejected?: string;
}
