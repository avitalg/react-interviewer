"use client";

import type { EditorView } from "@codemirror/view";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { ClientExercise, ExerciseSummary } from "@/exercises/types";
import { trackEvent } from "@/lib/analytics";
import { verdictLabel } from "@/lib/checks/verdict";
import { toEditorChanges } from "@/lib/fix";
import { useAiEnabled, useMediaQuery } from "@/lib/hooks";
import { loadCode, saveCode, useProgress, useStatuses } from "@/lib/progress";
import { ConfirmDialog } from "@/components/Modal";
import { Button, ButtonLink, DifficultyBadge, StatusPill, cx } from "@/components/ui";
import { CodeEditor } from "./CodeEditor";
import { FeedbackPanel } from "./FeedbackPanel";
import { Preview, PreviewStatusBadge } from "./Preview";
import { SolutionPanel } from "./SolutionPanel";
import { TaskPanel } from "./TaskPanel";
import { useLivePreview } from "./useLivePreview";
import { useReview } from "./useReview";

type Tab = "preview" | "feedback" | "solution";

export function Workspace({
  exercise,
  nextExercise,
}: {
  exercise: ClientExercise;
  nextExercise?: ExerciseSummary;
}) {
  const [code, setCode] = useState(() => loadCode(exercise.id) ?? exercise.starterCode);
  const [tab, setTab] = useState<Tab>("preview");
  const [confirmReset, setConfirmReset] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const isWide = useMediaQuery("(min-width: 1024px)");
  const aiEnabled = useAiEnabled();
  const progress = useProgress(exercise.id);
  const preview = useLivePreview(code, exercise.mockApi);
  const review = useReview(exercise, aiEnabled === true);
  const exerciseIds = useMemo(() => [exercise.id], [exercise.id]);

  // Persist code (debounced), and flush when the page is hidden or the exercise unmounts.
  const latestCode = useRef(code);
  const persist = useCallback(
    (announce = false) => {
      saveCode(exercise.id, latestCode.current, exercise.starterCode);
      if (announce) setJustSaved(true);
    },
    [exercise.id, exercise.starterCode],
  );
  const handleEditorSave = useCallback(() => persist(true), [persist]);
  useEffect(() => {
    latestCode.current = code;
    const id = window.setTimeout(() => persist(), 500);
    return () => window.clearTimeout(id);
  }, [code, persist]);
  useEffect(() => {
    const flush = () => persist();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persist]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key !== "s" && event.key !== "S") return;
      event.preventDefault();
      persist(true);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [persist]);
  useEffect(() => {
    if (!justSaved) return;
    const id = window.setTimeout(() => setJustSaved(false), 1200);
    return () => window.clearTimeout(id);
  }, [justSaved]);
  useEffect(() => {
    trackEvent("exercise_open", {
      exercise_id: exercise.id,
      topic: exercise.topic,
      difficulty: exercise.difficulty,
    });
  }, [exercise.id, exercise.topic, exercise.difficulty]);

  /** Replaces editor content in one transaction, touching only changed lines, so one undo reverts it. */
  const replaceCode = useCallback((next: string) => {
    const view = viewRef.current;
    if (!view) {
      setCode(next);
      return;
    }
    const changes = toEditorChanges(view.state.doc.toString(), next);
    if (changes.length > 0) view.dispatch({ changes, userEvent: "input.replace" });
    view.focus();
  }, []);

  const onSubmit = () => {
    setTab("feedback");
    trackEvent("submit", { exercise_id: exercise.id });
    void review.submit(code);
  };

  const status = useStatuses(exerciseIds)[exercise.id];
  const requirementStatuses = useMemo(
    () => Object.fromEntries(review.report?.requirements.map((r) => [r.id, r.status]) ?? []),
    [review.report],
  );
  const canShowSolution = progress.submissions > 0 || review.report !== null;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border bg-surface px-6 py-4">
      <div className="min-w-0">
        <nav className="flex items-center gap-2" aria-label="Exercise navigation">
          <ButtonLink href="/" variant="ghost" className="-ml-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18 9 12l6-6" />
            </svg>
            All exercises
          </ButtonLink>
          <span className="text-xs text-muted" aria-hidden>
            /
          </span>
          <Link href={`/#${exercise.topic}`} className="truncate text-xs text-muted hover:text-fg">
            {exercise.topicTitle}
          </Link>
        </nav>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="truncate text-base font-semibold">{exercise.title}</h1>
          <DifficultyBadge difficulty={exercise.difficulty} />
          <StatusPill status={status} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AiStatus enabled={aiEnabled} />
        <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={code === exercise.starterCode}>
          Reset to starter code
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={review.checking}>
          {review.checking ? "Checking…" : "Submit"}
        </Button>
        {nextExercise && (
          <ButtonLink href={`/exercise/${nextExercise.id}`} title={nextExercise.title}>
            Next exercise
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </ButtonLink>
        )}
      </div>
    </div>
  );

  const editor = (
    <div className="flex h-full min-h-0 flex-col">
      <TaskPanel exercise={exercise} statuses={review.report ? requirementStatuses : undefined} />
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-2 font-mono text-xs text-muted">
        <span>App.jsx</span>
        <span aria-live="polite">
          {justSaved ? "Saved" : code === exercise.starterCode ? "starter code" : "saved locally"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-surface">
        <CodeEditor
          value={code}
          onChange={setCode}
          onSave={handleEditorSave}
          onReady={(view) => {
            viewRef.current = view;
          }}
        />
      </div>
    </div>
  );

  const output = (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4" role="tablist" aria-label="Output">
        <div className="flex">
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
          <TabButton active={tab === "feedback"} onClick={() => setTab("feedback")}>
            Feedback
            {review.report && (
              <span
                className={cx(
                  "ml-1.5 rounded px-1.5 text-[10px]",
                  review.report.verdict === "pass"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : review.report.verdict === "partial"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                )}
              >
                {verdictLabel[review.report.verdict]}
              </span>
            )}
          </TabButton>
          <TabButton
            active={tab === "solution"}
            onClick={() => {
              if (tab !== "solution") trackEvent("show_solution", { exercise_id: exercise.id });
              setTab("solution");
            }}
          >
            Solution
            {!canShowSolution && (
              <span className="ml-1.5 text-[10px] text-muted" aria-label="Locked until you submit">
                locked
              </span>
            )}
          </TabButton>
        </div>
        <div className="pr-2">
          <PreviewStatusBadge status={preview.status} />
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className={cx("absolute inset-0", tab !== "preview" && "invisible")} role="tabpanel" aria-label="Preview">
          <Preview
            frames={preview.frames}
            visibleId={preview.visibleId}
            error={preview.error}
            registerFrame={preview.registerFrame}
          />
        </div>
        <div className={cx("absolute inset-0", tab !== "feedback" && "invisible")} role="tabpanel" aria-label="Feedback">
          {review.error ? (
            <p className="p-4 text-sm text-rose-500">Couldn&apos;t run the checks: {review.error}</p>
          ) : (
            <FeedbackPanel
              exerciseId={exercise.id}
              report={review.report}
              checking={review.checking}
              currentCode={code}
              onApplyFix={replaceCode}
              nextExercise={nextExercise}
            />
          )}
        </div>
        <div className={cx("absolute inset-0", tab !== "solution" && "invisible")} role="tabpanel" aria-label="Solution">
          <SolutionPanel
            key={exercise.id}
            exerciseId={exercise.id}
            userCode={code}
            unlocked={canShowSolution}
            active={tab === "solution"}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100dvh-3rem)] lg:min-h-0">
      {header}
      {isWide ? (
        <Group orientation="horizontal" className="min-h-0 flex-1">
          <Panel id="editor" defaultSize="50%" minSize="25%">
            {editor}
          </Panel>
          <Separator aria-label="Resize editor and output" className="w-1.5 bg-border transition-colors hover:bg-accent data-[separator=active]:bg-accent" />
          <Panel id="output" defaultSize="50%" minSize="25%">
            {output}
          </Panel>
        </Group>
      ) : (
        <div className="flex flex-col">
          <div className="h-[75vh] border-b border-border">{editor}</div>
          <div className="h-[75vh]">{output}</div>
        </div>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset to starter code?"
          message="This replaces your code with the original starter code. You can undo it in the editor with Ctrl/Cmd+Z."
          confirmLabel="Reset"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false);
            trackEvent("reset_code", { exercise_id: exercise.id });
            replaceCode(exercise.starterCode);
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        "-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm transition",
        active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function AiStatus({ enabled }: { enabled: boolean | null }) {
  if (enabled === null) return null;
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted sm:inline-flex"
      title={
        enabled
          ? "Submissions also get a qualitative AI review with a minimal fix."
          : "Set AI_GATEWAY_API_KEY (or link a Vercel project) to enable AI reviews. Automated checks still run."
      }
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", enabled ? "bg-violet-500" : "bg-zinc-500")} aria-hidden />
      AI review {enabled ? "on" : "off"}
    </span>
  );
}
