import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const stateExercises: Exercise[] = [
  {
    id: "state-counter",
    topic: "state",
    title: "Counter",
    difficulty: "Easy",
    description: `The classic warm-up. The starter code keeps the count in a plain variable, so clicking does nothing visible. Fix it with state.`,
    requirements: [
      { id: "display", text: "Show the count (starting at `0`) in an element with `data-testid=\"count\"`." },
      { id: "inc-dec", text: "**Increment** adds 1 and **Decrement** subtracts 1." },
      { id: "min", text: "The count never goes below 0: **Decrement** is `disabled` when the count is 0." },
      { id: "reset", text: "**Reset** sets the count back to 0." },
      { id: "state", text: "Keep the count in React state with `useState`." },
    ],
    starterCode: `export default function App() {
  let count = 0;

  // TODO: this doesn't re-render. Use state instead.
  return (
    <div>
      <p data-testid="count">{count}</p>
      <button onClick={() => { count = count + 1; }}>Increment</button>
      <button onClick={() => { count = count - 1; }}>Decrement</button>
      <button>Reset</button>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p data-testid="count">{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <button onClick={() => setCount((c) => c - 1)} disabled={count === 0}>
        Decrement
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "starts-at-zero",
        requirementId: "display",
        label: "The count starts at 0",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("count").textContent?.trim(), 'data-testid="count"').toBe("0");
        },
      },
      {
        id: "increment-decrement",
        requirementId: "inc-dec",
        label: "Increment and Decrement update the count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const increment = t.screen.getByRole("button", { name: "Increment" });
          await t.click(increment);
          await t.click(increment);
          await t.click(increment);
          t.expect(t.screen.getByTestId("count").textContent?.trim(), "After 3 increments").toBe("3");
          await t.click(t.screen.getByRole("button", { name: "Decrement" }));
          t.expect(t.screen.getByTestId("count").textContent?.trim(), "After decrementing").toBe("2");
        },
      },
      {
        id: "never-negative",
        requirementId: "min",
        label: "Decrement is disabled at 0",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const decrement = t.screen.getByRole("button", { name: "Decrement" }) as HTMLButtonElement;
          t.assert(decrement.disabled, "Decrement should be disabled when the count is 0.");
          await t.click(decrement);
          t.expect(t.screen.getByTestId("count").textContent?.trim(), "The count").toBe("0");
          await t.click(t.screen.getByRole("button", { name: "Increment" }));
          t.assert(!decrement.disabled, "Decrement should be enabled once the count is above 0.");
        },
      },
      {
        id: "reset",
        requirementId: "reset",
        label: "Reset sets the count to 0",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const increment = t.screen.getByRole("button", { name: "Increment" });
          await t.click(increment);
          await t.click(increment);
          await t.click(t.screen.getByRole("button", { name: "Reset" }));
          t.expect(t.screen.getByTestId("count").textContent?.trim(), "After Reset").toBe("0");
        },
      },
      { id: "use-state", requirementId: "state", label: "Uses useState", kind: "static", rule: { rule: "usesHook", hook: "useState" } },
    ],
  },
  {
    id: "state-todo-list",
    topic: "state",
    title: "Todo list",
    difficulty: "Medium",
    description: `Build a small todo list. The starter code has a bug that interviewers love: it **mutates state**, so React doesn't re-render. Fix it and add the missing features.`,
    requirements: [
      { id: "add", text: "Typing in the input (placeholder `Add a todo`) and clicking **Add** (or pressing Enter) adds the todo to the list, then clears the input." },
      { id: "empty", text: "Empty or whitespace-only todos are not added." },
      { id: "toggle", text: "Each todo has a checkbox that toggles whether it's done." },
      { id: "delete", text: "Each todo has a **Delete** button that removes it." },
      { id: "remaining", text: "Show `N left` (todos not done) in an element with `data-testid=\"remaining\"`." },
      { id: "immutable", text: "Update state immutably (no `push`/`splice` on state) and give each `<li>` a stable `key` (not the index)." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  function addTodo() {
    todos.push({ text: text, done: false });
    setTodos(todos);
  }

  return (
    <div>
      <input placeholder="Add a todo" value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

let nextId = 1;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  function addTodo() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos([...todos, { id: nextId++, text: trimmed, done: false }]);
    setText('');
  }

  function toggleTodo(id) {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }

  function deleteTodo(id) {
    setTodos(todos.filter((todo) => todo.id !== id));
  }

  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTodo();
        }}
      >
        <input placeholder="Add a todo" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
              {todo.text}
            </label>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <p data-testid="remaining">{remaining} left</p>
    </div>
  );
}
`,
    checks: [
      {
        id: "adds",
        requirementId: "add",
        label: "Adding a todo shows it and clears the input",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Add a todo") as HTMLInputElement;
          await t.type(input, "Buy milk");
          await t.click(t.screen.getByRole("button", { name: "Add" }));
          t.assert(t.screen.queryByText(/Buy milk/), 'After adding "Buy milk" it should appear in the list.');
          t.expect(input.value, "The input should be cleared after adding").toBe("");
          await t.type(input, "Walk dog");
          await t.keyDown(input, "Enter");
          t.assert(t.screen.queryByText(/Walk dog/), "Pressing Enter in the input should add the todo too.");
          t.expect(t.screen.$$("li").length, "Number of todos").toBe(2);
        },
      },
      {
        id: "no-empty",
        requirementId: "empty",
        label: "Blank todos are ignored",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Add a todo");
          await t.type(input, "   ");
          await t.click(t.screen.getByRole("button", { name: "Add" }));
          t.expect(t.screen.$$("li").length, "A whitespace-only todo should not be added; list length").toBe(0);
        },
      },
      {
        id: "toggle",
        requirementId: "toggle",
        label: "A checkbox toggles a todo",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Add a todo"), "Buy milk");
          await t.click(t.screen.getByRole("button", { name: "Add" }));
          const item = t.screen.getByText(/Buy milk/).closest("li");
          t.assert(item, "Each todo should be an <li>.");
          const checkbox = t.within(item).getByRole("checkbox") as HTMLInputElement;
          t.assert(!checkbox.checked, "New todos should start not done.");
          await t.click(checkbox);
          t.assert((t.within(t.screen.getByText(/Buy milk/).closest("li")!).getByRole("checkbox") as HTMLInputElement).checked, "Clicking the checkbox should mark the todo done.");
        },
      },
      {
        id: "delete",
        requirementId: "delete",
        label: "Delete removes a todo",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Add a todo");
          for (const text of ["One", "Two", "Three"]) {
            await t.type(input, text);
            await t.click(t.screen.getByRole("button", { name: "Add" }));
          }
          const two = t.screen.getByText(/Two/).closest("li");
          t.assert(two, "Each todo should be an <li>.");
          await t.click(t.within(two).getByRole("button", { name: "Delete" }));
          t.assert(!t.screen.queryByText(/Two/), '"Two" should be removed.');
          t.expect(t.screen.$$("li").length, "Remaining todos").toBe(2);
        },
      },
      {
        id: "remaining",
        requirementId: "remaining",
        label: "Shows how many todos are left",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Add a todo");
          for (const text of ["One", "Two"]) {
            await t.type(input, text);
            await t.click(t.screen.getByRole("button", { name: "Add" }));
          }
          t.expect(t.screen.getByTestId("remaining").textContent?.trim(), "remaining").toBe("2 left");
          const one = t.screen.getByText(/One/).closest("li")!;
          await t.click(t.within(one).getByRole("checkbox"));
          t.expect(t.screen.getByTestId("remaining").textContent?.trim(), "remaining after completing one").toBe("1 left");
        },
      },
      { id: "no-mutation", requirementId: "immutable", label: "State is not mutated", kind: "static", rule: { rule: "noStateMutation" } },
      { id: "keys", requirementId: "immutable", label: "List items have keys", kind: "static", rule: { rule: "listItemsHaveKeys" } },
      { id: "stable-keys", requirementId: "immutable", label: "Keys are not array indexes", kind: "static", rule: { rule: "noIndexAsKey" } },
    ],
  },
  {
    id: "state-undo-redo",
    topic: "state",
    title: "Counter with undo and redo",
    difficulty: "Hard",
    description: `Add **undo/redo** to a counter. A common approach keeps three pieces of state: the \`past\` values, the \`present\` value and the \`future\` values (or one object holding all three).`,
    requirements: [
      { id: "change", text: "**+1** and **-1** change the count (starting at `0`), shown in `data-testid=\"count\"`." },
      { id: "undo", text: "**Undo** restores the previous value and can be pressed repeatedly back to the start. It's `disabled` when there's nothing to undo." },
      { id: "redo", text: "**Redo** re-applies an undone change. It's `disabled` when there's nothing to redo." },
      { id: "branch", text: "Making a new change after undoing clears the redo history." },
      { id: "immutable", text: "Keep history in state and update it immutably." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  // TODO: track history so Undo and Redo work
  return (
    <div>
      <p data-testid="count">{count}</p>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button>Undo</button>
      <button>Redo</button>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

export default function App() {
  const [history, setHistory] = useState({ past: [], present: 0, future: [] });
  const { past, present, future } = history;

  function change(delta) {
    setHistory({ past: [...past, present], present: present + delta, future: [] });
  }

  function undo() {
    if (past.length === 0) return;
    setHistory({ past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] });
  }

  function redo() {
    if (future.length === 0) return;
    setHistory({ past: [...past, present], present: future[0], future: future.slice(1) });
  }

  return (
    <div>
      <p data-testid="count">{present}</p>
      <button onClick={() => change(-1)}>-1</button>
      <button onClick={() => change(1)}>+1</button>
      <button onClick={undo} disabled={past.length === 0}>Undo</button>
      <button onClick={redo} disabled={future.length === 0}>Redo</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "change",
        requirementId: "change",
        label: "+1 and -1 change the count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const count = () => t.screen.getByTestId("count").textContent?.trim();
          t.expect(count(), "Initial count").toBe("0");
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "-1" }));
          t.expect(count(), "After +1, +1, -1").toBe("1");
        },
      },
      {
        id: "undo",
        requirementId: "undo",
        label: "Undo walks back through history",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const count = () => t.screen.getByTestId("count").textContent?.trim();
          const undo = t.screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement;
          t.assert(undo.disabled, "Undo should be disabled before any change.");
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(undo);
          t.expect(count(), "After one undo").toBe("2");
          await t.click(undo);
          await t.click(undo);
          t.expect(count(), "After undoing everything").toBe("0");
          t.assert(undo.disabled, "Undo should be disabled at the start of history.");
        },
      },
      {
        id: "redo",
        requirementId: "redo",
        label: "Redo re-applies undone changes",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const count = () => t.screen.getByTestId("count").textContent?.trim();
          const redo = t.screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement;
          t.assert(redo.disabled, "Redo should be disabled before anything is undone.");
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "Undo" }));
          await t.click(t.screen.getByRole("button", { name: "Undo" }));
          await t.click(redo);
          t.expect(count(), "After one redo").toBe("1");
          await t.click(redo);
          t.expect(count(), "After two redos").toBe("2");
          t.assert(redo.disabled, "Redo should be disabled when there's nothing left to redo.");
        },
      },
      {
        id: "branch",
        requirementId: "branch",
        label: "A new change clears the redo history",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "+1" }));
          await t.click(t.screen.getByRole("button", { name: "Undo" }));
          await t.click(t.screen.getByRole("button", { name: "-1" }));
          const redo = t.screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement;
          t.assert(redo.disabled, "After undoing and then making a new change, Redo should be disabled.");
          t.expect(t.screen.getByTestId("count").textContent?.trim(), "Count").toBe("0");
        },
      },
      { id: "no-mutation", requirementId: "immutable", label: "History is not mutated", kind: "static", rule: { rule: "noStateMutation" } },
    ],
  },
];
