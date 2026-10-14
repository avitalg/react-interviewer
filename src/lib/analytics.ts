"use client";

import { track } from "@vercel/analytics";

type Gtag = (...args: unknown[]) => void;

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  track(name, properties);
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  gtag?.("event", name, properties ?? {});
}
