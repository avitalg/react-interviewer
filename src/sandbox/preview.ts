/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMockFetch, evaluateFunction, evaluateModule, getComponent, type SandboxEnv } from "./env";
import type { MockApi, SandboxError, SandboxToParent } from "./types";

type Post = (message: SandboxToParent) => void;

/** Browser noise that isn't a bug in the user's component. */
export function isBenignRuntimeError(message: string): boolean {
  return /ResizeObserver loop|undelivered notifications|Script error\.?$|Failed to connect to MetaMask/i.test(message);
}

function toSandboxError(error: unknown, phase: SandboxError["phase"]): SandboxError {
  if (error instanceof Error || (error && typeof error === "object" && "message" in error)) {
    const err = error as Error;
    return { name: err.name || "Error", message: err.message, stack: err.stack, phase };
  }
  return { name: "Error", message: String(error), phase };
}

/** Renders the user's module into #root and reports render/runtime errors to the parent. */
export function startPreview(env: SandboxEnv, post: Post) {
  const { win, React, ReactDOM } = env;
  const h = React.createElement;
  let runId = 0;
  let root: any = null;
  let lastBoundaryMessage: string | null = null;

  const reportRuntime = (error: unknown) => {
    const message = toSandboxError(error, "runtime");
    if (isBenignRuntimeError(message.message) || win.closed) return;
    // React (dev) also reports errors that an error boundary caught; the boundary already sent those.
    env.real.setTimeout(() => {
      if (win.closed || lastBoundaryMessage === message.message) return;
      post({ type: "error", runId, error: message });
    }, 0);
  };

  win.addEventListener("error", (event: ErrorEvent) => reportRuntime(event.error ?? new Error(event.message)));
  win.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    if (event.reason?.name === "AbortError") return;
    reportRuntime(event.reason);
  });

  function Reporter({ onCommit }: { onCommit: () => void }) {
    React.useEffect(() => {
      onCommit();
    }, [onCommit]);
    return null;
  }

  return function run(message: { runId: number; code: string; mockApi?: string }) {
    runId = message.runId;
    lastBoundaryMessage = null;

    const api = message.mockApi ? evaluateFunction<MockApi>(env, message.mockApi) : undefined;
    win.fetch = createMockFetch(env, { getApi: () => api, allowNetwork: false }) as typeof fetch;

    let Component: any;
    try {
      Component = getComponent(evaluateModule(env, message.code));
    } catch (error) {
      post({ type: "error", runId, error: toSandboxError(error, "module") });
      return;
    }

    const container = win.document.getElementById("root")!;
    root ??= ReactDOM.createRoot(container);
    const currentRun = runId;
    root.render(
      h(
        env.ErrorBoundary,
        {
          onError: (error: Error) => {
            lastBoundaryMessage = error.message;
            post({ type: "error", runId: currentRun, error: toSandboxError(error, "render") });
          },
          fallback: null,
        },
        h(Component),
        h(Reporter, { onCommit: () => post({ type: "rendered", runId: currentRun }) }),
      ),
    );
  };
}
