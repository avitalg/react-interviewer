import { getExercise } from "@/exercises";

export async function GET(_request: Request, { params }: RouteContext<"/api/solution/[id]">) {
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }
  return Response.json({
    solution: exercise.referenceSolution,
    explanation: exercise.solutionExplanation,
  });
}
