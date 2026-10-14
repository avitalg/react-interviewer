"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui";
import { CodeEditor } from "./CodeEditor";
import { DiffView } from "./DiffView";

export function SolutionModal({ exerciseId, userCode, onClose }: { exerciseId: string; userCode: string; onClose: () => void }) {
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/solution/${encodeURIComponent(exerciseId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((data: { solution: string }) => {
        if (active) setSolution(data.solution);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [exerciseId]);

  return (
    <Modal
      title="Reference solution"
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={() => setCompare((value) => !value)} disabled={!solution}>
            {compare ? "Show solution" : "Compare with my code"}
          </Button>
          <Button variant="primary" onClick={onClose} data-autofocus>
            Close
          </Button>
        </>
      }
    >
      <p className="mb-3 text-muted">
        One way to solve it. Your approach can differ and still be correct, as long as it meets the requirements.
      </p>
      {error && <p className="text-rose-500">Couldn&apos;t load the solution: {error}</p>}
      {!solution && !error && <p className="text-muted">Loading…</p>}
      {solution &&
        (compare ? (
          <DiffView before={userCode} after={solution} context={2} />
        ) : (
          <div className="h-[60vh] overflow-hidden rounded-md border border-border">
            <CodeEditor value={solution} readOnly ariaLabel="Reference solution" />
          </div>
        ))}
    </Modal>
  );
}
