import type { CheckPayload, MockApi, TestApi } from "@/sandbox/types";

export type TopicId =
  | "jsx"
  | "props"
  | "state"
  | "effects"
  | "forms"
  | "lists"
  | "conditional"
  | "refs"
  | "context"
  | "hooks"
  | "performance"
  | "fetching";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Topic {
  id: TopicId;
  title: string;
  blurb: string;
}

export interface Requirement {
  id: string;
  text: string;
}

/** Static rules evaluated on the Babel AST. See src/lib/checks/static.ts. */
export type StaticRule =
  | { rule: "usesHook"; hook: string; min?: number; max?: number }
  | { rule: "usesReactMemo" }
  | { rule: "createsContext" }
  | { rule: "definesComponent"; name: string }
  | { rule: "definesFunction"; name: string }
  | { rule: "usesComponent"; name: string; min?: number }
  | { rule: "usesIdentifier"; name: string }
  | { rule: "listItemsHaveKeys" }
  | { rule: "noIndexAsKey" }
  | { rule: "effectHasDepsArray" }
  | { rule: "effectDepsComplete" }
  | { rule: "effectHasCleanup" }
  | { rule: "noStateMutation" }
  | { rule: "controlledInputs" }
  | { rule: "noDirectDom" };

interface CheckBase {
  id: string;
  requirementId: string;
  /** Short description shown in the feedback, e.g. "Clicking + increments the count". */
  label: string;
}

export interface StaticCheck extends CheckBase {
  kind: "static";
  rule: StaticRule;
}

export interface RuntimeCheck extends CheckBase {
  kind: "runtime";
  /** Runs inside the sandbox. Must be self-contained: use only `t`, no outer variables. */
  run: (t: TestApi) => Promise<void> | void;
  timeoutMs?: number;
}

export type Check = StaticCheck | RuntimeCheck;

export interface Exercise {
  id: string;
  topic: TopicId;
  title: string;
  difficulty: Difficulty;
  /** Short markdown-lite text: paragraphs, `inline code` and **bold**. */
  description: string;
  requirements: Requirement[];
  starterCode: string;
  checks: Check[];
  /** Used only for checking; revealed only after the user submits at least once. */
  referenceSolution: string;
  /** Fake backend for data-fetching exercises, used by the preview and the tests. Must be self-contained. */
  mockApi?: MockApi;
}

export type ClientCheck =
  | (CheckBase & { kind: "static"; rule: StaticRule })
  | (CheckBase & { kind: "runtime" } & Pick<CheckPayload, "source" | "timeoutMs">);

/** What the browser receives: no reference solution, and functions serialized as source strings. */
export interface ClientExercise extends Omit<Exercise, "checks" | "referenceSolution" | "mockApi"> {
  checks: ClientCheck[];
  mockApi?: string;
  topicTitle: string;
}

export interface ExerciseSummary {
  id: string;
  topic: TopicId;
  title: string;
  difficulty: Difficulty;
}
