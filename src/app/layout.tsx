import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GA_MEASUREMENT_ID, gaInitScript } from "@/lib/ga";
import { getSiteUrl } from "@/lib/site";
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "React Interviewer: practice React interview exercises",
    template: "%s · React Interviewer",
  },
  description:
    "Practice React interview exercises with a live editor, live preview, and automated feedback. Guides to hooks, lists, forms, and data fetching.",
  keywords: [
    "React interview",
    "React interview questions",
    "React coding interview",
    "useEffect interview",
    "React hooks",
    "practice React",
  ],
  openGraph: {
    siteName: "React Interviewer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
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
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: gaInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
            <span className="text-accent">{"</>"}</span>
            <span>react-interviewer</span>
          </Link>
          <div className="flex items-center gap-3">
            <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted transition hover:text-fg">
                Exercises
              </Link>
              <Link href="/blog" className="text-muted transition hover:text-fg">
                Blog
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
