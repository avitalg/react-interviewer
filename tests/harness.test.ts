import { describe, expect, it } from "vitest";
import type { Exercise } from "@/exercises/types";
import { runRuntimeChecks } from "./helpers/sandbox";

const counterCode = `
import { useState, useEffect } from 'react';
export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const [ticks, setTicks] = useState(0);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setTicks((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    fetch('/api/user').then((r) => r.json()).then(setUser);
  }, []);
  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <input placeholder="Name" value={text} onChange={(e) => setText(e.target.value)} />
      <p>Hello {text}</p>
      <p data-testid="ticks">{ticks}</p>
      {user && <p>User: {user.name}</p>}
    </div>
  );
}
`;

const exercise: Exercise = {
  id: "harness",
  topic: "state",
  title: "Harness",
  difficulty: "Easy",
  description: "",
  requirements: [{ id: "r1", text: "" }],
  starterCode: "",
  solutionExplanation: "",
  referenceSolution: "",
  mockApi: (url) => (url.pathname === "/api/user" ? { body: { name: "Ada" }, delay: 20 } : { status: 404 }),
  checks: [
    {
      id: "click",
      requirementId: "r1",
      label: "click",
      kind: "runtime",
      async run(t) {
        await t.render();
        await t.click(t.screen.getByRole("button", { name: "+" }));
        await t.click(t.screen.getByRole("button", { name: "+" }));
        t.expect(t.screen.getByTestId("count").textContent).toBe("Count: 2");
      },
    },
    {
      id: "type",
      requirementId: "r1",
      label: "type",
      kind: "runtime",
      run: async (t) => {
        await t.render();
        await t.type(t.screen.getByPlaceholderText("Name"), "Bob");
        t.screen.getByText("Hello Bob");
      },
    },
    {
      id: "timers",
      requirementId: "r1",
      label: "timers",
      kind: "runtime",
      async run(t) {
        t.useFakeTimers();
        await t.render();
        await t.advanceTimers(3000);
        t.expect(t.screen.getByTestId("ticks").textContent).toBe("3");
      },
    },
    {
      id: "fetch",
      requirementId: "r1",
      label: "fetch",
      kind: "runtime",
      async run(t) {
        await t.render();
        await t.waitFor(() => t.screen.getByText(/User: Ada/));
        t.expect(t.fetchCalls.length).toBe(1);
      },
    },
    {
      id: "fails",
      requirementId: "r1",
      label: "fails",
      kind: "runtime",
      async run(t) {
        await t.render();
        t.screen.getByText("Nope");
      },
    },
  ],
};

describe("sandbox harness", () => {
  it("runs interactions, fake timers and mock fetch", async () => {
    const run = await runRuntimeChecks(exercise, counterCode);
    expect(run.compiled).toBe(true);
    expect(run.smoke?.passed).toBe(true);
    const byId = Object.fromEntries(run.results.map((r) => [r.id, r]));
    expect(byId.click).toEqual({ id: "click", passed: true });
    expect(byId.type.passed).toBe(true);
    expect(byId.timers.passed).toBe(true);
    expect(byId.fetch.passed).toBe(true);
    expect(byId.fails.passed).toBe(false);
    expect(byId.fails.message).toContain('Could not find an element with the text "Nope"');
  });

  it("reports render crashes and syntax errors", async () => {
    const crash = await runRuntimeChecks(exercise, "export default function App() { const x = null; return <p>{x.y}</p>; }");
    expect(crash.smoke?.passed).toBe(false);
    expect(crash.smoke?.message).toMatch(/threw an error/);

    const syntax = await runRuntimeChecks(exercise, "export default function App() { return <p>; }");
    expect(syntax.compiled).toBe(false);
    expect(syntax.compileError).toMatch(/^[A-Z]/);
    expect(syntax.compileError).not.toMatch(/App\.jsx|\(\d+:\d+\)/);
  });
});

describe("sandbox message filtering", () => {
  it("accepts only sandbox postMessage types", async () => {
    const { isSandboxMessage } = await import("@/lib/sandbox-client");
    const { isParentToSandboxMessage, isSandboxEvent } = await import("@/sandbox/messages");
    expect(isSandboxMessage({ type: "error", runId: 1, error: { name: "Error", message: "x", phase: "runtime" } })).toBe(true);
    expect(isSandboxMessage({ type: "error", runId: 1 })).toBe(false);
    expect(isSandboxMessage({ type: "webpackInvalid" })).toBe(false);
    expect(isSandboxMessage({ type: "ready" })).toBe(true);
    expect(isParentToSandboxMessage({ type: "run", runId: 1, code: "exports.default = 1" })).toBe(true);
    expect(isParentToSandboxMessage({ type: "run", runId: 1 })).toBe(false);
    expect(isParentToSandboxMessage({ type: "test", runId: 1, code: "", checks: [{ id: "a", source: "1" }] })).toBe(true);
    expect(isParentToSandboxMessage({ type: "test", runId: 1, code: "", checks: [{ id: "a" }] })).toBe(false);
    const source = {} as MessageEventSource;
    expect(isSandboxEvent({ origin: "null", source, data: { type: "ready" } } as MessageEvent, source)).toBe(true);
    expect(isSandboxEvent({ origin: "https://evil.example", source, data: { type: "ready" } } as MessageEvent, source)).toBe(false);
  });

  it("ignores ResizeObserver, script, and wallet-extension noise", async () => {
    const { isBenignRuntimeError } = await import("@/sandbox/preview");
    expect(isBenignRuntimeError("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
    expect(isBenignRuntimeError("Script error.")).toBe(true);
    expect(isBenignRuntimeError("Failed to connect to MetaMask")).toBe(true);
    expect(
      isBenignRuntimeError(
        "Blocked form submission to '' because the form's frame is sandboxed and the 'allow-forms' permission is not set.",
      ),
    ).toBe(true);
    expect(isBenignRuntimeError("Cannot read properties of null")).toBe(false);
  });
});

describe("sandbox isolation", () => {
  it("does not grant same-origin, popups, or forms to the iframe", async () => {
    const { SANDBOX_PERMISSIONS } = await import("@/sandbox/csp");
    expect(SANDBOX_PERMISSIONS).toBe("allow-scripts allow-modals");
    expect(SANDBOX_PERMISSIONS).not.toMatch(/allow-same-origin|allow-popups|allow-forms|allow-top-navigation/);
  });

  it("neutralizes injected wallets and blocks network side channels", async () => {
    const { createJsdomEnv } = await import("./helpers/sandbox");
    const { env, dom } = createJsdomEnv((win) => {
      (win as unknown as { ethereum: { request: () => void } }).ethereum = { request: () => undefined };
    });
    try {
      expect(env.win.ethereum).toBeUndefined();
      env.win.ethereum = { request: () => undefined };
      expect(env.win.ethereum).toBeUndefined();
      await expect(env.win.fetch("https://example.com/secret")).rejects.toThrow(/no network access/);
      expect(() => new env.win.Worker("https://example.com/w.js")).toThrow(/not available/);
      expect(() => env.win.document.createElement("script")).toThrow(/not allowed/);
      expect(() => env.win.document.createElement("iframe")).toThrow(/not allowed/);
    } finally {
      dom.window.close();
    }
  });
});
