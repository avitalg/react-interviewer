import "server-only";
import { articles } from "./posts";
import type { Article } from "./types";

export type { Article, ArticleFaq } from "./types";

function byDateDesc(a: Article, b: Article): number {
  return b.date.localeCompare(a.date);
}

export function getArticles(): Article[] {
  return [...articles].sort(byDateDesc);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticle(slug);
  if (!current) return [];
  const tags = new Set(current.tags);
  return getArticles()
    .filter((article) => article.slug !== slug)
    .sort((a, b) => {
      const aScore = a.tags.filter((tag) => tags.has(tag)).length;
      const bScore = b.tags.filter((tag) => tags.has(tag)).length;
      return bScore - aScore || byDateDesc(a, b);
    })
    .slice(0, limit);
}
