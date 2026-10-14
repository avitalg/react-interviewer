import { applyTextEdits, lineEditsToTextEdits } from "@/lib/fix";
import type { ReviewReport, ReviewResponse } from "./types";

/** Adds the AI's qualitative feedback to the deterministic report. The verdict never changes. */
export function mergeAiReview(report: ReviewReport, ai: ReviewResponse): ReviewReport {
  let fix = report.fix;
  if (ai.edits.length > 0) {
    const { code } = applyTextEdits(report.submittedCode, lineEditsToTextEdits(report.submittedCode, ai.edits));
    if (code !== report.submittedCode) {
      fix = { code, source: "ai", reasons: ai.edits.map((edit) => edit.reason).filter(Boolean) };
    }
  }
  const known = new Set(report.issues.map((issue) => issue.text));
  return {
    ...report,
    good: ai.good.length > 0 ? ai.good : report.good,
    issues: [...report.issues, ...ai.issues.filter((issue) => !known.has(issue.text))],
    aiNotes: ai.bestPractices,
    fix,
    ai: { status: "done", message: ai.fixRejected },
  };
}
