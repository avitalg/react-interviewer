"use client";

import type { ReactNode } from "react";
import { verdictLabel, type Verdict } from "@/lib/checks/verdict";
import type { ExerciseSummary } from "@/exercises/types";
import type { ReviewReport } from "@/lib/review/types";
import { Button, ButtonLink, Inline, cx } from "@/components/ui";
import { DiffView } from "./DiffView";

const verdictStyles: Record<Verdict, { box: string; title: string; blurb: string }> = {
  pass: {
    box: "border-emerald-500/40 bg-emerald-500/10",
    title: "text-emerald-600 dark:text-emerald-400",
    blurb: "All requirements are met. Nice work.",
  },
  partial: {
    box: "border-amber-500/40 bg-amber-500/10",
    title: "text-amber-600 dark:text-amber-400",
    blurb: "You're close. Some requirements still need work.",
  },
  "not-yet": {
    box: "border-rose-500/40 bg-rose-500/10",
    title: "text-rose-600 dark:text-rose-400",
    blurb: "Most requirements aren't met yet.",
  },
};

function Section({ title, children, count }: { title: string; children: ReactNode; count?: number }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-fg uppercase">
        {title}
        {count !== undefined && <span className="rounded bg-surface-2 px-1.5 font-mono text-[10px] text-muted">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

export function FeedbackPanel({
  report,
  checking,
  currentCode,
  onApplyFix,
  nextExercise,
}: {
  report: ReviewReport | null;
  checking: boolean;
  currentCode: string;
  onApplyFix: (fixedCode: string) => void;
  nextExercise?: ExerciseSummary;
}) {
  if (checking && !report) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" aria-hidden />
        Running checks…
      </div>
    );
  }
  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted">
        <p>
          Press <span className="font-medium text-fg">Submit</span> to check your solution against the requirements.
        </p>
        <p className="text-xs">You&apos;ll get a verdict, notes on React best practices, and a minimal suggested fix.</p>
      </div>
    );
  }

  const style = verdictStyles[report.verdict];
  const passedRequirements = report.requirements.filter((r) => r.status === "pass").length;
  const checkedRequirements = report.requirements.filter((r) => r.status !== "unverified").length;
  const stale = currentCode !== report.submittedCode;
  const fixApplied = report.fix && currentCode === report.fix.code;
  const failingRequirements = report.requirements.filter((r) => r.status === "fail" && r.failures.length > 0);
  const generalIssues = report.issues.filter((issue) => !issue.requirementId);
  const aiRequirementIssues = report.issues.filter(
    (issue) => issue.requirementId && !report.checks.some((c) => c.requirementId === issue.requirementId && !c.passed),
  );

  return (
    <div className="h-full space-y-6 overflow-auto px-6 py-5 text-sm">
      <div className={cx("rounded-lg border p-4", style.box)} role="status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={cx("text-lg font-semibold", style.title)}>{verdictLabel[report.verdict]}</div>
          <AiChip status={report.ai.status} />
        </div>
        <p className="mt-1 text-muted">
          {style.blurb}{" "}
          {checkedRequirements > 0 && (
            <span className="font-mono text-xs">
              ({passedRequirements}/{checkedRequirements} requirements)
            </span>
          )}
        </p>
        {report.ai.status === "error" && report.ai.message && (
          <p className="mt-2 text-xs text-muted">AI review unavailable: {report.ai.message}</p>
        )}
        {stale && (
          <p className="mt-2 text-xs text-muted">Your code changed since this review. Submit again for updated feedback.</p>
        )}
        {report.verdict === "pass" &&
          (nextExercise ? (
            <ButtonLink href={`/exercise/${nextExercise.id}`} variant="primary" className="mt-4">
              Next exercise
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </ButtonLink>
          ) : (
            <ButtonLink href="/" variant="primary" className="mt-4">
              Back to all exercises
            </ButtonLink>
          ))}
      </div>

      {report.good.length > 0 && (
        <Section title="What's good" count={report.good.length}>
          <ul className="space-y-1.5">
            {report.good.map((item, index) => (
              <li key={index} className="flex gap-2 text-fg">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                <span>
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(generalIssues.length > 0 || failingRequirements.length > 0 || aiRequirementIssues.length > 0) && (
        <Section title="What's missing or wrong">
          <div className="space-y-3">
            {generalIssues.map((issue, index) => (
              <div key={`general-${index}`} className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-fg">
                <Inline text={issue.text} />
              </div>
            ))}
            {failingRequirements.map((requirement) => {
              const number = report.requirements.findIndex((r) => r.id === requirement.id) + 1;
              const extra = report.issues.filter(
                (issue) => issue.requirementId === requirement.id && !requirement.failures.some((f) => issue.text.startsWith(f.label)),
              );
              return (
                <div key={requirement.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="mb-1.5 text-xs text-muted">
                    Requirement {number}: <Inline text={requirement.text} />
                  </div>
                  <ul className="space-y-1">
                    {requirement.failures.map((failure) => (
                      <li key={failure.id} className="flex gap-2 text-fg">
                        <span className="text-rose-500" aria-hidden>
                          ✗
                        </span>
                        <span>
                          <span className="font-medium">{failure.label}.</span>{" "}
                          {failure.message && (
                            <span className="text-muted">
                              <Inline text={failure.message} />
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                    {extra.map((issue, index) => (
                      <li key={`ai-${index}`} className="flex gap-2 text-fg">
                        <span className="text-rose-500" aria-hidden>
                          ✗
                        </span>
                        <Inline text={issue.text} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {aiRequirementIssues.map((issue, index) => {
              const number = report.requirements.findIndex((r) => r.id === issue.requirementId) + 1;
              return (
                <div key={`ai-req-${index}`} className="rounded-md border border-border bg-surface p-3 text-fg">
                  {number > 0 && <div className="mb-1 text-xs text-muted">Requirement {number}</div>}
                  <Inline text={issue.text} />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {(report.notes.length > 0 || report.aiNotes.length > 0) && (
        <Section title="React best practices" count={report.notes.length + report.aiNotes.length}>
          <ul className="space-y-2">
            {report.notes.map((note) => (
              <li key={note.id} className="flex gap-2">
                <span
                  className={cx(
                    "mt-0.5 h-fit shrink-0 rounded px-1.5 font-mono text-[10px] leading-4",
                    note.severity === "warning" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                  )}
                >
                  {note.line ? `L${note.line}` : note.severity}
                </span>
                <span className="text-fg">
                  <Inline text={note.text} />
                </span>
              </li>
            ))}
            {report.aiNotes.map((note, index) => (
              <li key={`ai-note-${index}`} className="flex gap-2">
                <span className="mt-0.5 h-fit shrink-0 rounded bg-violet-500/15 px-1.5 font-mono text-[10px] leading-4 text-violet-700 dark:text-violet-300">
                  AI
                </span>
                <span className="text-fg">
                  <Inline text={note} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Suggested fix">
        {report.fix ? (
          <div className="space-y-3">
            <ul className="space-y-1 text-muted">
              {report.fix.reasons.map((reason, index) => (
                <li key={index} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>
                    <Inline text={reason} />
                  </span>
                </li>
              ))}
            </ul>
            <DiffView before={report.submittedCode} after={report.fix.code} />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={() => onApplyFix(report.fix!.code)}
                disabled={stale || Boolean(fixApplied)}
                title={stale ? "Your code changed since this review; submit again first." : undefined}
              >
                {fixApplied ? "Fix applied" : "Apply fix"}
              </Button>
              <span className="text-xs text-muted">
                {report.fix.source === "ai" ? "Suggested by the AI reviewer" : "Automatic quick fix"}
                {report.fix.score && (
                  <>
                    {" · "}
                    this fix passes {report.fix.score.passed}/{report.fix.score.total} checks
                  </>
                )}
                {report.ai.status === "loading" && " · waiting for the AI review…"}
              </span>
            </div>
          </div>
        ) : report.ai.status === "loading" ? (
          <p className="flex items-center gap-2 text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" aria-hidden />
            The AI reviewer is preparing a minimal fix…
          </p>
        ) : (
          <p className="text-muted">
            {report.verdict === "pass"
              ? "Nothing to fix."
              : "No automatic fix for this one. Use the failing requirements above as hints."}
          </p>
        )}
      </Section>
    </div>
  );
}

function AiChip({ status }: { status: ReviewReport["ai"]["status"] }) {
  const label = {
    off: "AI review off",
    loading: "AI reviewing…",
    done: "AI reviewed",
    error: "AI review failed",
  }[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted",
        status === "loading" && "animate-pulse",
      )}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          status === "done" ? "bg-violet-500" : status === "error" ? "bg-rose-500" : status === "loading" ? "bg-amber-500" : "bg-zinc-500",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
