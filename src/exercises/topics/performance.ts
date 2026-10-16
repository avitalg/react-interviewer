import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const performanceExercises: Exercise[] = [
  {
    id: "perf-memo-row",
    topic: "performance",
    title: "Skip re-rendering rows with memo",
    difficulty: "Easy",
    solutionExplanation: `Wrap \`Row\` in \`memo\` so it skips a re-render when its props are unchanged. Incrementing a parent counter then won't log \`render Row …\` for every row — only a real prop change will.`,
    description: `Every time the counter changes, \`App\` re-renders, and so does every \`Row\`, even though their props didn't change. Open the console to see the \`render Row …\` logs.

Wrap \`Row\` in \`memo\` so it only re-renders when its props change.`,
    requirements: [
      { id: "memo", text: "Wrap `Row` with `React.memo` (or `memo` from `react`)." },
      { id: "skip", text: "Clicking **Increment** updates the count without re-rendering any `Row` (no new `render Row …` logs)." },
      { id: "logs", text: "Keep the `console.log('render Row ' + id)` line so re-renders stay visible." },
    ],
    starterCode: `import { useState } from 'react';

const items = [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Bravo' },
  { id: 3, label: 'Charlie' },
];

function Row({ id, label }) {
  console.log('render Row ' + id);
  return <li>{label}</li>;
}

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <p>Count: {count}</p>
      <ul>
        {items.map((item) => (
          <Row key={item.id} id={item.id} label={item.label} />
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { memo, useState } from 'react';

const items = [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Bravo' },
  { id: 3, label: 'Charlie' },
];

const Row = memo(function Row({ id, label }) {
  console.log('render Row ' + id);
  return <li>{label}</li>;
});

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <p>Count: {count}</p>
      <ul>
        {items.map((item) => (
          <Row key={item.id} id={item.id} label={item.label} />
        ))}
      </ul>
    </div>
  );
}
`,
    checks: [
      { id: "memo", requirementId: "memo", label: "Row is wrapped in memo", kind: "static", rule: { rule: "usesReactMemo" } },
      {
        id: "logs",
        requirementId: "logs",
        label: "Rows log when they render",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.countLogs("render Row"), '"render Row …" logs on first render').toBe(3);
        },
      },
      {
        id: "skip",
        requirementId: "skip",
        label: "Increment doesn't re-render rows",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.clearLogs();
          await t.click(t.screen.getByRole("button", { name: "Increment" }));
          await t.click(t.screen.getByRole("button", { name: "Increment" }));
          t.assert(t.screen.queryByText("Count: 2"), 'The count should still update ("Count: 2").');
          t.expect(t.countLogs("render Row"), "Row re-renders after clicking Increment twice").toBe(0);
        },
      },
    ],
  },
  {
    id: "perf-usememo-filter",
    topic: "performance",
    title: "Memoize an expensive filter",
    difficulty: "Medium",
    solutionExplanation: `Wrap the filtered list in \`useMemo\` with \`[items, query]\` as dependencies. Toggling unrelated state (like a theme) then won't rerun the slow filter, because those inputs didn't change.`,

    description: `\`slowFilter\` is expensive (imagine thousands of items). Right now it runs on **every** render, including when you only toggle dark mode.

Use \`useMemo\` so the list is only re-filtered when the query changes.`,
    requirements: [
      { id: "filter", text: "Typing in the `Search products` input filters the list (case-insensitive)." },
      { id: "memo", text: "Toggling the **Dark mode** checkbox does not call `slowFilter` again (no new `filtering` log)." },
      { id: "usememo", text: "Wrap the `slowFilter` call in `useMemo` with the right dependencies." },
    ],
    starterCode: `import { useState } from 'react';

const products = Array.from({ length: 100 }, (_, i) => 'Product ' + (i + 1));

function slowFilter(items, query) {
  console.log('filtering');
  return items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(false);
  const visible = slowFilter(products, query);

  return (
    <div style={{ background: dark ? '#111' : '#fff', color: dark ? '#eee' : '#111', padding: 12 }}>
      <label>
        <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode
      </label>
      <input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>{visible.length} results</p>
      <ul>
        {visible.slice(0, 10).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { useMemo, useState } from 'react';

const products = Array.from({ length: 100 }, (_, i) => 'Product ' + (i + 1));

function slowFilter(items, query) {
  console.log('filtering');
  return items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(false);
  const visible = useMemo(() => slowFilter(products, query), [query]);

  return (
    <div style={{ background: dark ? '#111' : '#fff', color: dark ? '#eee' : '#111', padding: 12 }}>
      <label>
        <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode
      </label>
      <input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>{visible.length} results</p>
      <ul>
        {visible.slice(0, 10).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    checks: [
      {
        id: "filter",
        requirementId: "filter",
        label: "Typing filters the list",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search products"), "product 99");
          t.expect(t.screen.$$("li").map((li) => li.textContent), "Visible products").toEqual(["Product 99"]);
          t.assert(t.screen.queryByText("1 results"), 'Show "1 results" for "product 99".');
        },
      },
      {
        id: "memo",
        requirementId: "memo",
        label: "Dark mode doesn't re-filter",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search products"), "7");
          t.clearLogs();
          const toggle = t.screen.getByLabelText("Dark mode");
          await t.click(toggle);
          await t.click(toggle);
          t.expect(t.countLogs("filtering"), "slowFilter calls while toggling dark mode").toBe(0);
          await t.type(t.screen.getByPlaceholderText("Search products"), "7");
          t.assert(t.countLogs("filtering") >= 1, "Changing the query should still re-run the filter.");
        },
      },
      { id: "usememo", requirementId: "usememo", label: "Uses useMemo", kind: "static", rule: { rule: "usesHook", hook: "useMemo" } },
    ],
  },
  {
    id: "perf-usecallback",
    topic: "performance",
    title: "Stable callbacks for memoized children",
    difficulty: "Hard",
    solutionExplanation: `\`memo\` compares props by reference, so a new inline function on every render defeats it. Wrap the row handler in \`useCallback\` (updater form, empty deps) so memoized children see a stable \`onDelete\`.`,

    description: `\`TodoItem\` is already wrapped in \`memo\`, yet typing in the **Note** field re-renders every item. Why? \`App\` creates a new \`onToggle\` function on every render, so \`memo\` sees a changed prop.

Make \`onToggle\` stable with \`useCallback\`. To keep it stable even when \`todos\` changes, use a **functional state update**.`,
    requirements: [
      { id: "note", text: "Typing in the input labelled `Note` doesn't re-render any `TodoItem`." },
      { id: "toggle", text: "Toggling a todo's checkbox updates it and re-renders **only** that item." },
      { id: "usecallback", text: "Define `onToggle` with `useCallback` and a functional update (`setTodos(prev => …)`) so it never needs `todos` as a dependency." },
    ],
    starterCode: `import { memo, useState } from 'react';

const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  console.log('render ' + todo.title);
  return (
    <li>
      <label>
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} /> {todo.title}
      </label>
    </li>
  );
});

export default function App() {
  const [note, setNote] = useState('');
  const [todos, setTodos] = useState([
    { id: 1, title: 'Write tests', done: false },
    { id: 2, title: 'Fix bug', done: false },
    { id: 3, title: 'Ship it', done: false },
  ]);

  const handleToggle = (id) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  return (
    <div>
      <label>
        Note <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { memo, useCallback, useState } from 'react';

const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  console.log('render ' + todo.title);
  return (
    <li>
      <label>
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} /> {todo.title}
      </label>
    </li>
  );
});

export default function App() {
  const [note, setNote] = useState('');
  const [todos, setTodos] = useState([
    { id: 1, title: 'Write tests', done: false },
    { id: 2, title: 'Fix bug', done: false },
    { id: 3, title: 'Ship it', done: false },
  ]);

  const handleToggle = useCallback((id) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }, []);

  return (
    <div>
      <label>
        Note <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
        ))}
      </ul>
    </div>
  );
}
`,
    checks: [
      {
        id: "note",
        requirementId: "note",
        label: "Typing a note doesn't re-render items",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.clearLogs();
          await t.type(t.screen.getByLabelText("Note"), "hi");
          t.expect(t.countLogs(/^render /), "TodoItem renders while typing a note").toBe(0);
        },
      },
      {
        id: "toggle",
        requirementId: "toggle",
        label: "Toggling re-renders only that item",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.clearLogs();
          const item = t.screen.getByText(/Fix bug/).closest("li");
          t.assert(item, "Each todo should be an <li>.");
          const checkbox = t.within(item).getByRole("checkbox") as HTMLInputElement;
          await t.click(checkbox);
          t.assert(checkbox.checked, "Clicking the checkbox should mark the todo done.");
          t.expect(t.logs.filter((line) => line.startsWith("render ")), "Items re-rendered after toggling \"Fix bug\"").toEqual(["render Fix bug"]);
          t.clearLogs();
          await t.click(t.within(t.screen.getByText(/Ship it/).closest("li")!).getByRole("checkbox"));
          t.expect(t.logs.filter((line) => line.startsWith("render ")), "Items re-rendered after toggling \"Ship it\"").toEqual(["render Ship it"]);
        },
      },
      { id: "usecallback", requirementId: "usecallback", label: "Uses useCallback", kind: "static", rule: { rule: "usesHook", hook: "useCallback" } },
    ],
  },
];
