import { getExerciseSummaries, topics } from "@/exercises";
import { OverallProgress, TopicExercises } from "@/components/home/TopicExercises";

export default function Home() {
  const exercises = getExerciseSummaries();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Practice React interviews</h1>
          <p className="text-muted">
            {exercises.length} hands-on exercises across {topics.length} topics. Write code in the editor, see it run live,
            and submit for feedback on every requirement, with minimal fixes you can apply in one click.
          </p>
        </div>
        <OverallProgress ids={exercises.map((exercise) => exercise.id)} />
      </section>

      <nav aria-label="Topics" className="flex flex-wrap gap-2 py-6">
        {topics.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-fg"
          >
            {topic.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic, index) => (
          <section
            key={topic.id}
            id={topic.id}
            aria-labelledby={`${topic.id}-title`}
            className="flex scroll-mt-16 flex-col overflow-hidden rounded-lg border border-border bg-surface"
          >
            <header className="space-y-1 px-4 pt-4 pb-3">
              <p className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, "0")}</p>
              <h2 id={`${topic.id}-title`} className="font-semibold">
                {topic.title}
              </h2>
              <p className="text-sm text-muted">{topic.blurb}</p>
            </header>
            <TopicExercises
              topicTitle={topic.title}
              exercises={exercises.filter((exercise) => exercise.topic === topic.id)}
            />
          </section>
        ))}
      </div>
    </main>
  );
}
