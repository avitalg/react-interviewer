"use client";

import { useEffect, useState } from "react";
import { Button, RichText } from "@/components/ui";
import { CodeEditor } from "./CodeEditor";
import { DiffView } from "./DiffView";

export function SolutionPanel({
  exerciseId,
  userCode,
  unlocked,
  active,
}: {
  exerciseId: string;
  userCode: string;
  unlocked: boolean;
  active: boolean;
}) {
  const [data, setData] = useState<{ solution: string; explanation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (!unlocked || !active) return;
    let cancelled = false;
    fetch(`/api/solution/${encodeURIComponent(exerciseId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((payload: { solution: string; explanation: string }) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId, unlocked, active]);

  if (!unlocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted">
        <p>
          Press <span className="font-medium text-fg">Submit</span> at least once to unlock a walkthrough of one good
          solution.
        </p>
        <p className="text-xs">Your approach can differ and still be correct, as long as it meets the requirements.</p>
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-sm text-rose-500">Couldn&apos;t load the solution: {error}</p>;
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" aria-hidden />
        Loading solution…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">How this solution works</p>
        <RichText text={data.explanation} className="text-sm leading-relaxed text-fg/90" />
        <Button onClick={() => setCompare((value) => !value)}>
          {compare ? "Show solution" : "Compare with my code"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {compare ? (
          <div className="p-3">
            <DiffView before={userCode} after={data.solution} context={2} />
          </div>
        ) : (
          <CodeEditor value={data.solution} readOnly ariaLabel="Reference solution" />
        )}
      </div>
    </div>
  );
}
