"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { track } from "@vercel/analytics";

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  track(name, properties);
  sendGAEvent("event", name, properties ?? {});
}
