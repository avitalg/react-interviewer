import { useMemo, useSyncExternalStore } from "react";
import type { Verdict } from "@/lib/checks/verdict";

export type ExerciseStatus = "not-started" | "in-progress" | "solved";

export interface Progress {
  solved: boolean;
  submissions: number;
  lastVerdict?: Verdict;
}

const codeKey = (id: string) => `rip:code:${id}`;
const progressKey = (id: string) => `rip:progress:${id}`;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("rip:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable: progress just won't persist.
  }
  emit();
}

export function loadCode(id: string): string | null {
  return read(codeKey(id));
}

/** Saving the starter code itself clears the entry, so an untouched exercise stays "Not started". */
export function saveCode(id: string, code: string, starterCode: string) {
  const next = code === starterCode ? null : code;
  if (read(codeKey(id)) === next) return;
  write(codeKey(id), next);
}

function parseProgress(raw: string | null): Progress {
  if (!raw) return { solved: false, submissions: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { solved: Boolean(parsed.solved), submissions: Number(parsed.submissions) || 0, lastVerdict: parsed.lastVerdict };
  } catch {
    return { solved: false, submissions: 0 };
  }
}

export function loadProgress(id: string): Progress {
  return parseProgress(read(progressKey(id)));
}

export function recordSubmission(id: string, verdict: Verdict) {
  const progress = loadProgress(id);
  const next: Progress = {
    solved: progress.solved || verdict === "pass",
    submissions: progress.submissions + 1,
    lastVerdict: verdict,
  };
  write(progressKey(id), JSON.stringify(next));
}

export function getStatus(id: string): ExerciseStatus {
  const progress = loadProgress(id);
  if (progress.solved) return "solved";
  if (progress.submissions > 0 || read(codeKey(id)) !== null) return "in-progress";
  return "not-started";
}

export function useProgress(id: string): Progress {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(progressKey(id)),
    () => null,
  );
  return useMemo(() => parseProgress(raw), [raw]);
}

/** Statuses for many exercises at once; the snapshot is a joined string so it stays referentially stable. */
export function useStatuses(ids: string[]): Record<string, ExerciseStatus> {
  const key = ids.join(",");
  const snapshot = useSyncExternalStore(
    subscribe,
    () => key.split(",").map(getStatus).join(","),
    () => "",
  );
  return useMemo(() => {
    const statuses = snapshot ? snapshot.split(",") : [];
    return Object.fromEntries(
      key.split(",").map((id, index) => [id, (statuses[index] as ExerciseStatus | undefined) ?? "not-started"]),
    );
  }, [key, snapshot]);
}
