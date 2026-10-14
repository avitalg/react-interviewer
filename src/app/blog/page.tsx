import type { Metadata } from "next";
import { getArticles } from "@/blog";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { JsonLd } from "@/components/blog/JsonLd";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides to React interview questions, hooks, lists, forms, and live coding practice.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "React interview guides",
    description: "Guides to React interview questions, hooks, lists, forms, and live coding practice.",
    type: "website",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const articles = getArticles();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `${siteName} Blog`,
          description: "Guides to React interview questions and live coding practice.",
          blogPost: articles.map((article) => ({
            "@type": "BlogPosting",
            headline: article.title,
            description: article.description,
            datePublished: article.date,
            url: absoluteUrl(`/blog/${article.slug}`),
          })),
        }}
      />
      <header className="space-y-3 border-b border-border pb-8">
        <p className="font-mono text-[11px] tracking-wide text-muted uppercase">Blog</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">React interview guides</h1>
        <p className="max-w-2xl text-muted">
          Practical write-ups of the questions hiring teams ask, each tied to a live exercise you can solve in the
          browser.
        </p>
      </header>
      <ul className="grid gap-4 py-8">
        {articles.map((article) => (
          <li key={article.slug}>
            <ArticleCard
              href={`/blog/${article.slug}`}
              title={article.title}
              description={article.description}
              date={article.date}
              tags={article.tags}
              heading="h2"
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
