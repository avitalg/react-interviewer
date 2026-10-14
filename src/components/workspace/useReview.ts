"use client";

import { useCallback, useRef, useState } from "react";
import type { ClientExercise } from "@/exercises/types";
import { trackEvent } from "@/lib/analytics";
import { loadBabel } from "@/lib/compile";
import { loadProgress, recordSubmission } from "@/lib/progress";
import { buildReport, evaluateCode } from "@/lib/review/evaluate";
import { mergeAiReview } from "@/lib/review/merge";
import type { ReviewReport, ReviewRequest, ReviewResponse } from "@/lib/review/types";
import { runTestsInFrame } from "@/lib/sandbox-client";

async function requestAiReview(body: ReviewRequest): Promise<ReviewResponse> {
  const res = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `The review service returned ${res.status}.`);
  }
  return res.json();
}

export function useReview(exercise: ClientExercise, aiEnabled: boolean) {
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const submit = useCallback(
    async (code: string) => {
      const token = ++latest.current;
      const isCurrent = () => token === latest.current;
      setChecking(true);
      setError(null);

      let babel: Awaited<ReturnType<typeof loadBabel>>;
      let evaluation: Awaited<ReturnType<typeof evaluateCode>>;
      try {
        babel = await loadBabel();
        evaluation = await evaluateCode(babel, exercise, code, runTestsInFrame);
      } catch (err) {
        if (isCurrent()) {
          setChecking(false);
          setError(err instanceof Error ? err.message : String(err));
          trackEvent("submission_error", { exercise_id: exercise.id });
        }
        return;
      }
      if (!isCurrent()) return;

      const previous = loadProgress(exercise.id);
      recordSubmission(exercise.id, evaluation.verdict);
      trackEvent("submission_result", {
        exercise_id: exercise.id,
        topic: exercise.topic,
        verdict: evaluation.verdict,
        passed: evaluation.checks.filter((check) => check.passed).length,
        total: evaluation.checks.length,
        submissions: previous.submissions + 1,
        first_solve: !previous.solved && evaluation.verdict === "pass",
      });
      let current = buildReport(code, evaluation, aiEnabled);
      setReport(current);
      setChecking(false);

      const update = (next: (report: ReviewReport) => ReviewReport) => {
        if (!isCurrent()) return;
        current = next(current);
        setReport(current);
      };

      if (current.ai.status === "loading") {
        try {
          const ai = await requestAiReview({
            exerciseId: exercise.id,
            code,
            verdict: evaluation.verdict,
            checks: evaluation.checks.map(({ requirementId, label, passed, message }) => ({
              requirementId,
              label,
              passed,
              message,
            })),
            notes: current.notes.map((note) => (note.line ? `Line ${note.line}: ${note.text}` : note.text)),
          });
          update((report) => mergeAiReview(report, ai));
        } catch (error) {
          update((report) => ({
            ...report,
            ai: { status: "error", message: error instanceof Error ? error.message : String(error) },
          }));
        }
      }

      const fix = current.fix;
      if (fix && isCurrent()) {
        const scored = await evaluateCode(babel, exercise, fix.code, runTestsInFrame).catch(() => null);
        if (scored) {
          update((report) =>
            report.fix?.code === fix.code
              ? {
                  ...report,
                  fix: {
                    ...report.fix,
                    score: {
                      passed: scored.checks.filter((check) => check.passed).length,
                      total: scored.checks.length,
                      verdict: scored.verdict,
                    },
                  },
                }
              : report,
          );
        }
      }
    },
    [exercise, aiEnabled],
  );

  return { report, checking, error, submit };
}
