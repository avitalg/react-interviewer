import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExercise, getExercises, getNextExercise, toClientExercise } from "@/exercises";
import { ExerciseLoader } from "@/components/workspace/ExerciseLoader";
import { WorkspaceSkeleton } from "@/components/workspace/WorkspaceSkeleton";

export function generateStaticParams() {
  return getExercises().map((exercise) => ({ id: exercise.id }));
}

export async function generateMetadata({ params }: PageProps<"/exercise/[id]">): Promise<Metadata> {
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise) return { title: "Exercise not found" };
  const description = exercise.description.trim().split(/\n\s*\n/)[0]?.replace(/[`*]/g, "") ?? exercise.title;
  return {
    title: exercise.title,
    description,
    alternates: { canonical: `/exercise/${exercise.id}` },
  };
}

async function Exercise({ params }: { params: PageProps<"/exercise/[id]">["params"] }) {
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise) notFound();
  return <ExerciseLoader exercise={toClientExercise(exercise)} nextExercise={getNextExercise(id)} />;
}

export default function ExercisePage({ params }: PageProps<"/exercise/[id]">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <Exercise params={params} />
    </Suspense>
  );
}
