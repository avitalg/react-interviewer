import { createEnv, type SandboxWindow } from "./env";
import { runChecks } from "./harness";
import { isParentToSandboxMessage } from "./messages";
import { startPreview } from "./preview";
import type { SandboxToParent } from "./types";

const win = window as SandboxWindow;
const post = (message: SandboxToParent) => win.parent.postMessage(message, "*");

const env = createEnv(win);
let runPreview: ReturnType<typeof startPreview> | null = null;

win.addEventListener("message", async (event: MessageEvent) => {
  if (event.source !== win.parent || event.origin === "null" || !isParentToSandboxMessage(event.data)) return;
  const message = event.data;
  if (message.type === "run") {
    runPreview ??= startPreview(env, post);
    runPreview(message);
  } else if (message.type === "test") {
    const { smoke, results } = await runChecks(env, message);
    post({ type: "testResults", runId: message.runId, smoke, results });
  }
});

post({ type: "ready" });
