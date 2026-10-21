import { expect, it } from "vitest";
import { allExercises } from "@/exercises/all";
import { toClientExercise } from "@/exercises/serialize";
import { evaluateCode } from "@/lib/review/evaluate";
import { babel, jsdomRunner } from "./helpers/sandbox";

const exercise = allExercises.find((item) => item.id === "hooks-event-bus")!;
const client = toClientExercise(exercise);

function byId(evaluation: Awaited<ReturnType<typeof evaluateCode>>) {
  return Object.fromEntries(evaluation.checks.map((check) => [check.id, check.passed]));
}

it("starter delivers emit but fails unsubscribe and cleanup", async () => {
  const evaluation = await evaluateCode(babel, client, exercise.starterCode, jsdomRunner);
  expect(evaluation.verdict).not.toBe("pass");
  expect(byId(evaluation)).toMatchObject({
    bus: true,
    unsubscribe: false,
    app: true,
    "has-cleanup": false,
  });
});

it("an Inbox that inlines useEffect still passes", async () => {
  const code = `import { useEffect, useState } from 'react';

export function createBus() {
  const listeners = new Map();
  function subscribe(event, listener) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(listener);
    return () => listeners.get(event).delete(listener);
  }
  function emit(event, payload) {
    for (const listener of [...(listeners.get(event) ?? [])]) listener(payload);
  }
  return { subscribe, emit };
}

function Publisher({ bus }) {
  return <button onClick={() => bus.emit('toast', 'Saved')}>Publish</button>;
}

function Inbox({ bus }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const unsubscribe = bus.subscribe('toast', setMessage);
    return unsubscribe;
  }, [bus]);
  return <p data-testid="inbox">{message}</p>;
}

export default function App() {
  const [bus] = useState(createBus);
  return (
    <div>
      <Publisher bus={bus} />
      <Inbox bus={bus} />
    </div>
  );
}
`;
  const evaluation = await evaluateCode(babel, client, code, jsdomRunner);
  expect(byId(evaluation)).toEqual({
    bus: true,
    unsubscribe: true,
    app: true,
    "has-cleanup": true,
  });
  expect(evaluation.verdict).toBe("pass");
});

it("subscribe without cleanup fails the static check", async () => {
  const code = `import { useEffect, useState } from 'react';

export function createBus() {
  const listeners = new Map();
  function subscribe(event, listener) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(listener);
    return () => listeners.get(event).delete(listener);
  }
  function emit(event, payload) {
    for (const listener of [...(listeners.get(event) ?? [])]) listener(payload);
  }
  return { subscribe, emit };
}

export default function App() {
  const [bus] = useState(createBus);
  const [message, setMessage] = useState('');
  useEffect(() => {
    bus.subscribe('toast', setMessage);
  }, [bus]);
  return (
    <div>
      <button onClick={() => bus.emit('toast', 'Saved')}>Publish</button>
      <p data-testid="inbox">{message}</p>
    </div>
  );
}
`;
  const evaluation = await evaluateCode(babel, client, code, jsdomRunner);
  expect(byId(evaluation)["has-cleanup"]).toBe(false);
  expect(evaluation.verdict).not.toBe("pass");
});
