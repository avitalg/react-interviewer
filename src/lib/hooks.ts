import { useEffect, useState, useSyncExternalStore } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useMediaQuery(query: string, serverValue = true): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

let aiStatusPromise: Promise<boolean> | null = null;

function fetchAiStatus(): Promise<boolean> {
  aiStatusPromise ??= fetch("/api/review")
    .then((res) => (res.ok ? res.json() : { enabled: false }))
    .then((data: { enabled?: boolean }) => Boolean(data.enabled))
    .catch(() => false);
  return aiStatusPromise;
}

/** Whether the server has an AI reviewer configured; null while unknown. */
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetchAiStatus().then((value) => {
      if (active) setEnabled(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return enabled;
}
