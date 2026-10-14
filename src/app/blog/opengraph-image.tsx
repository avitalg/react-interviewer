import { ogContentType, ogSize, renderOgImage } from "@/blog/og-image";

export const alt = "React interview guides";
export const size = ogSize;
export const contentType = ogContentType;

export default function OpenGraphImage() {
  return renderOgImage({
    title: "React interview guides, tied to live coding exercises",
    eyebrow: "Blog",
  });
}
