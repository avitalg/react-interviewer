import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "React Interviewer: practice React interview exercises",
  description: "Practice React interview exercises with a live editor, live preview and automated feedback.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
            <span className="text-accent">{"</>"}</span>
            <span>react-interviewer</span>
          </Link>
          <ThemeToggle />
        </header>
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-XMPHCPEZWJ" />
      </body>
    </html>
  );
}
