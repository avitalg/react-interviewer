import { connection } from "next/server";
import { z } from "zod";
import { getExercise } from "@/exercises";
import { describeAiError, isAiConfigured, reviewWithAi } from "@/lib/review/ai";
import type { ReviewRequest } from "@/lib/review/types";

export const maxDuration = 60;

const requestSchema = z.object({
  exerciseId: z.string().max(100),
  code: z.string().max(20_000),
  verdict: z.enum(["pass", "partial", "not-yet"]),
  checks: z
    .array(
      z.object({
        requirementId: z.string(),
        label: z.string(),
        passed: z.boolean(),
        message: z.string().optional(),
      }),
    )
    .max(50),
  notes: z.array(z.string()).max(30),
});

export async function GET() {
  await connection();
  return Response.json({ enabled: isAiConfigured() });
}

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return Response.json({ error: "AI review is not configured." }, { status: 503 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid review request." }, { status: 400 });
  }
  const body: ReviewRequest = parsed.data;

  const exercise = getExercise(body.exerciseId);
  if (!exercise) {
    return Response.json({ error: "Unknown exercise." }, { status: 404 });
  }

  try {
    return Response.json(await reviewWithAi(exercise, body));
  } catch (error) {
    console.error("AI review failed", error);
    const { status, message } = describeAiError(error);
    return Response.json({ error: message }, { status });
  }
}
