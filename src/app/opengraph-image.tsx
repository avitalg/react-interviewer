import { ogContentType, ogSize, renderOgImage } from "@/blog/og-image";

export const alt = "Practice React interview exercises";
export const size = ogSize;
export const contentType = ogContentType;

export default function OpenGraphImage() {
  return renderOgImage({
    title: "Practice React interviews with a live editor and feedback",
    eyebrow: "Hands-on exercises",
  });
}
