import { describe, expect, it } from "vitest";
import { allExercises } from "@/exercises/all";
import { toClientExercise } from "@/exercises/serialize";
import { topics } from "@/exercises/topics";
import { evaluateCode, type Evaluation } from "@/lib/review/evaluate";
import { babel, jsdomRunner } from "./helpers/sandbox";

function describeFailures(evaluation: Evaluation) {
  const lines = evaluation.checks.filter((c) => !c.passed).map((c) => `  - [${c.id}] ${c.label}: ${c.message}`);
  if (evaluation.compileError) lines.unshift(`  compile error: ${evaluation.compileError.message}`);
  if (evaluation.crash) lines.unshift(`  crash: ${evaluation.crash}`);
  return lines.join("\n");
}

describe("exercise data", () => {
  it("has at least 3 exercises per topic and unique ids", () => {
    for (const topic of topics) {
      expect(allExercises.filter((e) => e.topic === topic.id).length, topic.id).toBeGreaterThanOrEqual(3);
    }
    const ids = allExercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allExercises.map((e) => [e.id, e] as const))("%s: checks reference real requirements", (_id, exercise) => {
    const requirementIds = new Set(exercise.requirements.map((r) => r.id));
    expect(exercise.checks.length).toBeGreaterThan(0);
    for (const check of exercise.checks) expect(requirementIds.has(check.requirementId), check.id).toBe(true);
    const checkIds = exercise.checks.map((c) => c.id);
    expect(new Set(checkIds).size).toBe(checkIds.length);
    expect(exercise.solutionExplanation.trim().length).toBeGreaterThan(40);
  });
});

describe.each(allExercises.map((e) => [e.id, e] as const))("%s", (_id, exercise) => {
  const client = toClientExercise(exercise);

  it("reference solution passes every check", async () => {
    const evaluation = await evaluateCode(babel, client, exercise.referenceSolution, jsdomRunner);
    expect(evaluation.verdict, describeFailures(evaluation)).toBe("pass");
  });

  it("starter code does not pass", async () => {
    const evaluation = await evaluateCode(babel, client, exercise.starterCode, jsdomRunner);
    expect(evaluation.verdict).not.toBe("pass");
  });
});
