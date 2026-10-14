"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compile } from "@/lib/compile";
import { useDebouncedValue } from "@/lib/hooks";
import { isSandboxEvent } from "@/sandbox/messages";
import type { ParentToSandbox } from "@/sandbox/types";

export const PREVIEW_DEBOUNCE_MS = 2000;

export interface PreviewError {
  kind: "syntax" | "module" | "render" | "runtime";
  message: string;
  line?: number;
  column?: number;
  frame?: string;
}

export interface PreviewRun {
  id: number;
  js: string;
  code: string;
}

export type PreviewStatus = "updating" | "ready" | "error";

let nextRunId = 1;

/**
 * Compiles the code 2s after typing stops and renders it in a fresh sandbox iframe.
 * The previous frame stays visible until the new one renders, and the last error
 * stays visible until a render succeeds.
 */
export function useLivePreview(code: string, mockApi?: string) {
  const debouncedCode = useDebouncedValue(code, PREVIEW_DEBOUNCE_MS);
  const [frames, setFrames] = useState<PreviewRun[]>([]);
  const [visibleId, setVisibleId] = useState<number | null>(null);
  const [error, setError] = useState<PreviewError | null>(null);
  const [processedCode, setProcessedCode] = useState<string | null>(null);

  const frameElements = useRef(new Map<number, HTMLIFrameElement>());
  const framesRef = useRef(frames);
  const visibleRef = useRef(visibleId);
  useEffect(() => {
    framesRef.current = frames;
    visibleRef.current = visibleId;
  }, [frames, visibleId]);

  useEffect(() => {
    let cancelled = false;
    compile(debouncedCode).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError({ kind: "syntax", ...result.error });
        setProcessedCode(debouncedCode);
        return;
      }
      const run: PreviewRun = { id: nextRunId++, js: result.js, code: debouncedCode };
      setFrames((current) => [...current.filter((frame) => frame.id === visibleRef.current), run]);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedCode]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      let source: { id: number; element: HTMLIFrameElement } | null = null;
      for (const [id, element] of frameElements.current) {
        if (isSandboxEvent(event, element.contentWindow)) source = { id, element };
      }
      if (!source) return;
      const run = framesRef.current.find((frame) => frame.id === source.id);
      if (!run) return;
      const message = event.data;

      if (message.type === "ready") {
        const runMessage: ParentToSandbox = { type: "run", runId: run.id, code: run.js, mockApi };
        source.element.contentWindow?.postMessage(runMessage, "*");
      } else if (message.type === "rendered" && message.runId === run.id) {
        setVisibleId(run.id);
        setFrames((current) => current.filter((frame) => frame.id >= run.id));
        setError(null);
        setProcessedCode(run.code);
      } else if (message.type === "error" && message.runId === run.id) {
        // A replaced iframe can still post delayed window.onerror while it unloads.
        if (visibleRef.current !== null && run.id < visibleRef.current) return;
        const { phase, message: text, name } = message.error;
        const isVisible = run.id === visibleRef.current;
        setError({
          kind: phase === "runtime" ? "runtime" : phase,
          message: name && name !== "Error" && !text.startsWith(name) ? `${name}: ${text}` : text,
        });
        if (!isVisible && phase !== "runtime") {
          setFrames((current) => current.filter((frame) => frame.id !== run.id));
        }
        setProcessedCode(run.code);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mockApi]);

  const registerFrame = useCallback((id: number, element: HTMLIFrameElement | null) => {
    if (element) frameElements.current.set(id, element);
    else frameElements.current.delete(id);
  }, []);

  // Runtime errors (a click handler, a timer) stay as an overlay on the Preview
  // tab. The badge is the compile/render pipeline, so a Pass isn't contradicted
  // by a leftover window.onerror from a previous iframe.
  const blockingError = error && error.kind !== "runtime";
  const status: PreviewStatus =
    code !== debouncedCode || processedCode !== debouncedCode ? "updating" : blockingError ? "error" : "ready";

  return { frames, visibleId, error, status, registerFrame };
}
