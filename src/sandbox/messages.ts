import type { CheckOutcome, CheckPayload, ParentToSandbox, SandboxError, SandboxToParent } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isOutcome(value: unknown): value is CheckOutcome {
  return isRecord(value) && typeof value.id === "string" && typeof value.passed === "boolean";
}

function isSandboxError(value: unknown): value is SandboxError {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    (value.phase === "module" || value.phase === "render" || value.phase === "runtime")
  );
}

function isCheckPayload(value: unknown): value is CheckPayload {
  return isRecord(value) && typeof value.id === "string" && typeof value.source === "string";
}

export function isParentToSandboxMessage(data: unknown): data is ParentToSandbox {
  if (!isRecord(data) || typeof data.runId !== "number" || typeof data.code !== "string") return false;
  if (data.mockApi !== undefined && typeof data.mockApi !== "string") return false;
  if (data.type === "run") return true;
  return data.type === "test" && Array.isArray(data.checks) && data.checks.every(isCheckPayload);
}

export function isSandboxToParentMessage(data: unknown): data is SandboxToParent {
  if (!isRecord(data) || typeof data.type !== "string") return false;
  switch (data.type) {
    case "ready":
      return true;
    case "rendered":
      return typeof data.runId === "number";
    case "error":
      return typeof data.runId === "number" && isSandboxError(data.error);
    case "testResults":
      return typeof data.runId === "number" && isOutcome(data.smoke) && Array.isArray(data.results) && data.results.every(isOutcome);
    default:
      return false;
  }
}

/** Opaque-origin frames (sandbox without allow-same-origin) report origin "null". */
export function isSandboxEvent(event: MessageEvent, source: MessageEventSource | null | undefined): boolean {
  return event.origin === "null" && Boolean(source) && event.source === source && isSandboxToParentMessage(event.data);
}
