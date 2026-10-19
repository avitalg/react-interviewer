import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getRelatedArticles } from "@/blog";
import { ArticleCard, formatArticleDate } from "@/components/blog/ArticleCard";
import { ArticleToc, Markdown } from "@/components/blog/Markdown";
import { JsonLd } from "@/components/blog/JsonLd";
import { getExercise } from "@/exercises";
import { absoluteUrl, siteName } from "@/lib/site";
import { DifficultyBadge } from "@/components/ui";

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return {
    title: article.headline ? { absolute: article.title } : article.title,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.date,
      url: `/blog/${article.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

function ArticleFallback() {
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6" aria-hidden />;
}

async function Article({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.slug);
  const exercises = article.relatedExercises
    .map((id) => getExercise(id))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));
  const url = absoluteUrl(`/blog/${article.slug}`);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: article.headline ?? article.title,
          name: article.title,
          description: article.description,
          datePublished: article.date,
          dateModified: article.date,
          mainEntityOfPage: url,
          author: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
          publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: article.title, item: url },
          ],
        }}
      />
      {article.faq ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: article.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      ) : null}
      <nav className="mb-6 font-mono text-[11px] text-muted">
        <Link href="/blog" className="hover:text-fg">
          Blog
        </Link>
        <span aria-hidden className="px-2">
          /
        </span>
        <span className="text-fg">{article.title}</span>
      </nav>
      <header className="space-y-4 border-b border-border pb-8">
        <p className="font-mono text-[11px] text-muted">
          <span>Last updated </span>
          <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
          <span aria-hidden className="px-2">
            ·
          </span>
          {article.tags.join(" · ")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.headline ?? article.title}</h1>
        <p className="text-muted">{article.description}</p>
        <ArticleToc source={article.body} />
      </header>
      <article className="py-8">
        <Markdown source={article.body} />
      </article>
      {exercises.length > 0 ? (
        <section className="space-y-3 border-t border-border py-8">
          <h2 className="font-semibold tracking-tight">Practice these exercises</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                <Link
                  href={`/exercise/${exercise.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1 truncate">{exercise.title}</span>
                  <DifficultyBadge difficulty={exercise.difficulty} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {related.length > 0 ? (
        <section className="space-y-3 border-t border-border py-8">
          <h2 className="font-semibold tracking-tight">Keep reading</h2>
          <ul className="grid gap-4">
            {related.map((item) => (
              <li key={item.slug}>
                <ArticleCard
                  href={`/blog/${item.slug}`}
                  title={item.title}
                  description={item.description}
                  date={item.date}
                  tags={item.tags}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

export default function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<ArticleFallback />}>
      <Article params={params} />
    </Suspense>
  );
}
