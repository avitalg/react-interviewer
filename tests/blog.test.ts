import { describe, expect, it } from "vitest";
import { parseMarkdown, slugify } from "@/blog/markdown";
import { articles } from "@/blog/posts";
import { allExercises } from "@/exercises/all";

const exerciseIds = new Set(allExercises.map((exercise) => exercise.id));
const slugs = new Set(articles.map((article) => article.slug));

describe("blog articles", () => {
  it("have unique slugs, titles, and SEO descriptions", () => {
    expect(articles.length).toBeGreaterThanOrEqual(8);
    expect(slugs.size).toBe(articles.length);
    expect(new Set(articles.map((article) => article.title)).size).toBe(articles.length);
    for (const article of articles) {
      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
      expect(article.description.length).toBeGreaterThan(80);
      expect(article.description.length).toBeLessThan(180);
      expect(article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.tags.length).toBeGreaterThan(0);
      expect(article.body.length).toBeGreaterThan(400);
    }
  });

  it("link to real exercises and other articles", () => {
    for (const article of articles) {
      expect(article.relatedExercises.length).toBeGreaterThan(0);
      for (const id of article.relatedExercises) {
        expect(exerciseIds.has(id), `${article.slug} -> ${id}`).toBe(true);
      }
      for (const match of article.body.matchAll(/\]\(\/exercise\/([a-z0-9-]+)\)/g)) {
        expect(exerciseIds.has(match[1]), `${article.slug} body -> ${match[1]}`).toBe(true);
      }
      for (const match of article.body.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
        expect(slugs.has(match[1]), `${article.slug} body -> /blog/${match[1]}`).toBe(true);
        expect(match[1]).not.toBe(article.slug);
      }
    }
  });
});

describe("markdown parser", () => {
  it("parses headings, lists, code, and paragraphs", () => {
    const blocks = parseMarkdown(`## Why keys matter

A key is an identity.

- Use \`user.id\`
- Do not use the index

\`\`\`
{users.map((user) => user.id)}
\`\`\`
`);
    expect(blocks).toEqual([
      { type: "h2", text: "Why keys matter", id: "why-keys-matter" },
      { type: "p", text: "A key is an identity." },
      { type: "ul", items: ["Use `user.id`", "Do not use the index"] },
      { type: "code", lang: "", code: "{users.map((user) => user.id)}" },
    ]);
  });

  it("parses tables and images", () => {
    const blocks = parseMarkdown(`![useEffect cleanup function lifecycle diagram](/blog/diagram.svg)

| Side effect | Cleanup |
| --- | --- |
| \`setInterval\` | \`clearInterval(id)\` |
`);
    expect(blocks).toEqual([
      {
        type: "image",
        alt: "useEffect cleanup function lifecycle diagram",
        src: "/blog/diagram.svg",
      },
      {
        type: "table",
        headers: ["Side effect", "Cleanup"],
        rows: [["`setInterval`", "`clearInterval(id)`"]],
      },
    ]);
  });

  it("slugifies headings without backticks", () => {
    expect(slugify("When to use `useEffect`")).toBe("when-to-use-useeffect");
  });
});
