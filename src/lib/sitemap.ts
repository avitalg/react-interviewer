import { articles } from "@/blog/posts";
import { allExercises } from "@/exercises/all";
import { absoluteUrl } from "@/lib/site";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}

export function buildSitemap(): SitemapEntry[] {
  const posts = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const latest = posts[0]?.date;

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: article.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...allExercises.map((exercise) => ({
      url: absoluteUrl(`/exercise/${exercise.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
