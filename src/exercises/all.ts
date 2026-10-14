import { conditionalExercises } from "./topics/conditional";
import { contextExercises } from "./topics/context";
import { effectsExercises } from "./topics/effects";
import { fetchingExercises } from "./topics/fetching";
import { formsExercises } from "./topics/forms";
import { hooksExercises } from "./topics/hooks";
import { jsxExercises } from "./topics/jsx";
import { listsExercises } from "./topics/lists";
import { performanceExercises } from "./topics/performance";
import { propsExercises } from "./topics/props";
import { refsExercises } from "./topics/refs";
import { stateExercises } from "./topics/state";
import type { Exercise } from "./types";

export const allExercises: Exercise[] = [
  ...jsxExercises,
  ...propsExercises,
  ...stateExercises,
  ...effectsExercises,
  ...formsExercises,
  ...listsExercises,
  ...conditionalExercises,
  ...refsExercises,
  ...contextExercises,
  ...hooksExercises,
  ...performanceExercises,
  ...fetchingExercises,
];
