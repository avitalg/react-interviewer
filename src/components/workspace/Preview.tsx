"use client";

import { SANDBOX_PERMISSIONS, SANDBOX_URL } from "@/lib/sandbox-client";
import { cx } from "@/components/ui";
import type { PreviewError, PreviewRun, PreviewStatus } from "./useLivePreview";

export function PreviewStatusBadge({ status }: { status: PreviewStatus }) {
  const config = {
    updating: { label: "Updating…", dot: "bg-amber-500 animate-pulse" },
    ready: { label: "Up to date", dot: "bg-emerald-500" },
    error: { label: "Error", dot: "bg-rose-500" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" role="status" aria-live="polite">
      <span className={cx("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}

const errorTitles: Record<PreviewError["kind"], string> = {
  syntax: "Syntax error",
  module: "Your code couldn't run",
  render: "Error while rendering",
  runtime: "Runtime error",
};

export function Preview({
  frames,
  visibleId,
  error,
  registerFrame,
}: {
  frames: PreviewRun[];
  visibleId: number | null;
  error: PreviewError | null;
  registerFrame: (id: number, element: HTMLIFrameElement | null) => void;
}) {
  const blocking = error && error.kind !== "runtime";
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {frames.map((frame) => (
        <iframe
          key={frame.id}
          ref={(element) => registerFrame(frame.id, element)}
          src={SANDBOX_URL}
          sandbox={SANDBOX_PERMISSIONS}
          allow=""
          referrerPolicy="no-referrer"
          title="Live preview"
          className={cx(
            "absolute inset-0 h-full w-full border-0 bg-white",
            // Visible frames inherit visibility so a hidden Preview tab hides them too.
            frame.id !== visibleId && visibleId !== null && "invisible",
          )}
        />
      ))}

      {error && blocking && (
        <div className="absolute inset-0 overflow-auto bg-surface/95 p-5 text-fg backdrop-blur-sm" role="alert">
          <ErrorDetails error={error} />
        </div>
      )}
      {error && !blocking && (
        <div className="absolute inset-x-0 bottom-0 max-h-[45%] overflow-auto border-t border-rose-500/40 bg-surface/95 p-4 text-fg backdrop-blur-sm" role="alert">
          <ErrorDetails error={error} />
        </div>
      )}
    </div>
  );
}

function ErrorDetails({ error }: { error: PreviewError }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        {errorTitles[error.kind]}
        {error.line !== undefined && (
          <span className="font-mono text-xs font-normal text-muted">
            line {error.line}
            {error.column !== undefined ? `, column ${error.column}` : ""}
          </span>
        )}
      </div>
      <p className="font-mono text-sm break-words whitespace-pre-wrap">{error.message}</p>
      {error.frame && (
        <pre className="overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed">
          {error.frame}
        </pre>
      )}
      <p className="text-xs text-muted">
        {error.kind === "runtime"
          ? "The preview keeps running. This message stays until the next successful render."
          : "Fix the code and the preview will update automatically."}
      </p>
    </div>
  );
}
