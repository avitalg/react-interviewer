import { getArticle, getArticles } from "@/blog";
import { ogContentType, ogSize, renderOgImage } from "@/blog/og-image";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "React interview guide";

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  return renderOgImage({
    title: article?.title ?? "React interview guide",
    eyebrow: "Blog",
  });
}
