import { SANDBOX_PERMISSIONS } from "@/sandbox/csp";
import { isSandboxEvent, isSandboxToParentMessage } from "@/sandbox/messages";
import type { CheckOutcome, CheckPayload, ParentToSandbox, SandboxToParent } from "@/sandbox/types";

export { SANDBOX_PERMISSIONS };
export const SANDBOX_URL = "/sandbox/frame.html";

export function isSandboxMessage(data: unknown): data is SandboxToParent {
  return isSandboxToParentMessage(data);
}

function attachSandboxFrame(iframe: HTMLIFrameElement) {
  iframe.setAttribute("sandbox", SANDBOX_PERMISSIONS);
  iframe.referrerPolicy = "no-referrer";
  iframe.allow = "";
}

let nextRunId = 1;

/** Runs runtime checks in a fresh, hidden sandbox iframe. */
export function runTestsInFrame(payload: {
  code: string;
  checks: CheckPayload[];
  mockApi?: string;
}): Promise<{ smoke: CheckOutcome; results: CheckOutcome[] }> {
  const runId = nextRunId++;
  const iframe = document.createElement("iframe");
  attachSandboxFrame(iframe);
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.title = "Test runner";
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1024px",
    height: "768px",
    border: "0",
    visibility: "hidden",
  });

  const budget = 10_000 + payload.checks.reduce((sum, check) => sum + (check.timeoutMs ?? 5000), 5000);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
      iframe.remove();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("The test runner did not respond in time."));
    }, budget);

    let started = false;
    function onMessage(event: MessageEvent) {
      if (!isSandboxEvent(event, iframe.contentWindow)) return;
      const message = event.data;
      if (message.type === "ready" && !started) {
        started = true;
        const testMessage: ParentToSandbox = { type: "test", runId, ...payload };
        iframe.contentWindow?.postMessage(testMessage, "*");
      } else if (message.type === "testResults" && message.runId === runId) {
        cleanup();
        resolve({ smoke: message.smoke, results: message.results });
      }
    }

    window.addEventListener("message", onMessage);
    iframe.src = SANDBOX_URL;
    document.body.appendChild(iframe);
  });
}
