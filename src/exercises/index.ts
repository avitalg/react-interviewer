import "server-only";
import { allExercises } from "./all";
import type { Exercise, ExerciseSummary } from "./types";

export { topics } from "./topics";
export { toClientExercise } from "./serialize";

export function getExercises(): Exercise[] {
  return allExercises;
}

export function getExercise(id: string): Exercise | undefined {
  return allExercises.find((exercise) => exercise.id === id);
}

export function getExerciseSummaries(): ExerciseSummary[] {
  return allExercises.map(({ id, topic, title, difficulty }) => ({ id, topic, title, difficulty }));
}

export function getNextExercise(id: string): ExerciseSummary | undefined {
  const index = allExercises.findIndex((exercise) => exercise.id === id);
  if (index < 0 || index === allExercises.length - 1) return undefined;
  const next = allExercises[index + 1];
  return { id: next.id, topic: next.topic, title: next.title, difficulty: next.difficulty };
}
