"use client";

import Link from "next/link";
import type { ExerciseSummary } from "@/exercises/types";
import { useStatuses } from "@/lib/progress";
import { DifficultyBadge, StatusPill } from "@/components/ui";

export function ProgressBar({ solved, total, label }: { solved: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={solved}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function TopicExercises({ topicTitle, exercises }: { topicTitle: string; exercises: ExerciseSummary[] }) {
  const statuses = useStatuses(exercises.map((exercise) => exercise.id));
  const solved = exercises.filter((exercise) => statuses[exercise.id] === "solved").length;

  return (
    <>
      <div className="flex items-center gap-3 px-4 pb-3">
        <ProgressBar solved={solved} total={exercises.length} label={`${topicTitle} progress`} />
        <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
          {solved}/{exercises.length}
        </span>
      </div>
      <ul className="border-t border-border">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/exercise/${exercise.id}`}
              className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-fg group-hover:text-accent">{exercise.title}</span>
              <DifficultyBadge difficulty={exercise.difficulty} />
              <span className="w-[5.5rem] text-right">
                <StatusPill status={statuses[exercise.id]} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function OverallProgress({ ids }: { ids: string[] }) {
  const statuses = useStatuses(ids);
  const values = Object.values(statuses);
  const solved = values.filter((status) => status === "solved").length;
  const started = values.filter((status) => status === "in-progress").length;

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Overall progress</span>
        <span className="font-mono tabular-nums">
          <span className="text-fg">{solved}</span>
          <span className="text-muted">/{ids.length} solved</span>
        </span>
      </div>
      <ProgressBar solved={solved} total={ids.length} label="Overall progress" />
      <p className="text-xs text-muted">{started > 0 ? `${started} in progress` : "Progress is saved in this browser."}</p>
    </div>
  );
}
