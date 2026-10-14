"use client";

import type { ClientExercise } from "@/exercises/types";
import type { RequirementStatus } from "@/lib/checks/verdict";
import { Inline, RichText, cx } from "@/components/ui";

function RequirementIcon({ status }: { status?: RequirementStatus }) {
  if (status === "pass") {
    return (
      <span className="mt-0.5 text-emerald-500" aria-label="Passed">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className="mt-0.5 text-rose-500" aria-label="Not met">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 text-muted" aria-label={status === "unverified" ? "Not checked automatically" : "Not checked yet"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="8" />
      </svg>
    </span>
  );
}

export function TaskPanel({
  exercise,
  statuses,
}: {
  exercise: ClientExercise;
  statuses?: Record<string, RequirementStatus>;
}) {
  return (
    <details open className="group border-b border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 pt-4 pb-3 text-xs font-medium tracking-wide text-muted uppercase select-none hover:text-fg">
        Task
        <svg
          className="transition group-open:rotate-180"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="max-h-[38vh] space-y-5 overflow-auto px-6 pb-5 text-sm leading-relaxed text-muted">
        <RichText text={exercise.description} />
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-fg uppercase">Requirements</h3>
          <ol className="space-y-2.5">
            {exercise.requirements.map((requirement, index) => {
              const status = statuses?.[requirement.id];
              return (
                <li key={requirement.id} className="flex gap-3">
                  <RequirementIcon status={status} />
                  <span className={cx(status === "pass" && "text-fg")}>
                    <span className="mr-1.5 font-mono text-xs text-muted">{index + 1}.</span>
                    <Inline text={requirement.text} />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </details>
  );
}
