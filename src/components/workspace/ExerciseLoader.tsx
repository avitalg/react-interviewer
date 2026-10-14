"use client";

import dynamic from "next/dynamic";
import type { ClientExercise, ExerciseSummary } from "@/exercises/types";
import { WorkspaceSkeleton } from "./WorkspaceSkeleton";

// The workspace reads saved code from localStorage on its first render, so it only renders in the browser.
const Workspace = dynamic(() => import("./Workspace").then((mod) => mod.Workspace), {
  ssr: false,
  loading: WorkspaceSkeleton,
});

export function ExerciseLoader({
  exercise,
  nextExercise,
}: {
  exercise: ClientExercise;
  nextExercise?: ExerciseSummary;
}) {
  return <Workspace key={exercise.id} exercise={exercise} nextExercise={nextExercise} />;
}
