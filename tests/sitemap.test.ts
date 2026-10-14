import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { articles } from "@/blog/posts";
import { allExercises } from "@/exercises/all";
import { productionSiteUrl } from "@/lib/site";
import { buildSitemap } from "@/lib/sitemap";

describe("sitemap", () => {
  it("lists the home page, blog, every article, and every exercise on the production origin", () => {
    const entries = buildSitemap();
    const urls = entries.map((entry) => new URL(entry.url));
    const paths = urls.map((url) => url.pathname);

    for (const url of urls) {
      expect(url.origin).toBe(productionSiteUrl);
    }

    expect(paths).toContain("/");
    expect(paths).toContain("/blog");
    for (const article of articles) {
      expect(paths).toContain(`/blog/${article.slug}`);
    }
    for (const exercise of allExercises) {
      expect(paths).toContain(`/exercise/${exercise.id}`);
    }

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(2 + articles.length + allExercises.length);
  });
});

describe("robots", () => {
  it("points crawlers at the sitemap and blocks API routes", () => {
    const file = robots();
    expect(file.sitemap).toBe(`${productionSiteUrl}/sitemap.xml`);
    expect(file.rules).toEqual(
      expect.objectContaining({
        allow: "/",
        disallow: "/api/",
      }),
    );
  });
});
