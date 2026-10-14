import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function renderOgImage({ title, eyebrow }: { title: string; eyebrow: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0d",
          color: "#e4e4e7",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#38bdf8", fontSize: 28 }}>
          <span>{"</>"}</span>
          <span>react-interviewer</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ color: "#8b8b96", fontSize: 24 }}>{eyebrow}</div>
          <div style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
