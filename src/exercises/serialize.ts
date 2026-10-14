import { getTopic } from "./topics";
import type { ClientExercise, Exercise } from "./types";

/**
 * Turns a function into source that evaluates to that function with `(${source})`.
 * Handles arrows, function expressions and method shorthand (`run(t) {}` / `async run(t) {}`).
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function functionSource(fn: Function): string {
  const source = fn.toString().trim();
  if (/^(async\s+)?function\b/.test(source)) return source;
  if (/^(async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(source)) return source;
  const method = /^(async\s+)?([A-Za-z_$][\w$]*)\s*\(/.exec(source);
  if (method) {
    const isAsync = Boolean(method[1]);
    return `${isAsync ? "async " : ""}function ${source.slice(method[0].length - 1)}`;
  }
  return source;
}

/** What the browser receives: no reference solution, and functions serialized as source strings. */
export function toClientExercise(exercise: Exercise): ClientExercise {
  const { referenceSolution: _solution, mockApi, checks, ...rest } = exercise;
  void _solution;
  return {
    ...rest,
    topicTitle: getTopic(exercise.topic)?.title ?? exercise.topic,
    mockApi: mockApi ? functionSource(mockApi) : undefined,
    checks: checks.map((check) =>
      check.kind === "static"
        ? check
        : {
            id: check.id,
            requirementId: check.requirementId,
            label: check.label,
            kind: "runtime" as const,
            source: functionSource(check.run),
            timeoutMs: check.timeoutMs,
          },
    ),
  };
}
