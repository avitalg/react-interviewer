import type { Article } from "../types";

export const post: Article = {
  slug: "react-memo-usememo-usecallback",
  title: "React.memo vs useMemo vs useCallback (interview cheat sheet)",
  description:
    "Clear differences between React.memo, useMemo, and useCallback, when they help in interviews, and when they are a smell.",
  date: "2026-10-08",
  tags: ["performance", "React.memo", "useMemo", "useCallback"],
  relatedExercises: ["perf-memo-row", "perf-usememo-filter", "perf-usecallback"],
  body: `Performance questions in React interviews are less about micro-benchmarks and more about **whether you know what is being re-created**. \`memo\`, \`useMemo\`, and \`useCallback\` are three tools for three different values.

If you cannot say which one you need in one sentence, do not add any of them.

## React.memo wraps a component

\`React.memo(Row)\` skips re-rendering \`Row\` when its **props are shallow-equal** to the last render.

Use it when:

- The parent re-renders often (a keystroke, a tick).
- The child is meaningful work (a row, a chart, a tree node).
- Props are stable, or you have a plan to stabilize them.

\`memo\` does nothing if the parent passes a **new object or function every time**:

\`\`\`
<Row onToggle={() => toggle(id)} />  // new function every render
\`\`\`

That is why \`useCallback\` exists. Practice skipping row re-renders in [memoized rows](/exercise/perf-memo-row). Keep the \`console.log\` so you can see the skip — interviewers like evidence.

## useMemo wraps a value

\`useMemo(() => compute(a, b), [a, b])\` remembers the last result until \`a\` or \`b\` change.

Use it for:

- Expensive calculations (large filters, derived charts).
- Referential stability of an object you pass to a memoized child.

Do not \`useMemo\` a cheap string concatenation. The hook itself has a cost, and it signals you might be cargo-culting.

The [slow filter](/exercise/perf-usememo-filter) exercise is the canonical demo: typing should refilter; toggling dark mode should **not** call the slow function again, because the filtered list does not depend on the theme.

## useCallback wraps a function

\`useCallback(fn, deps)\` is \`useMemo(() => fn, deps)\` for functions. You want it when the function is:

- passed to a \`memo\` child, or
- listed in an effect / hook dependency array.

A pattern interviewers like: functional updates so the callback does **not** depend on the current array:

\`\`\`
const onToggle = useCallback((id) => {
  setTodos((todos) => todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo,
  ));
}, []);
\`\`\`

Because the setter is stable and you read \`todos\` from the updater, the callback can stay empty-deps. See [useCallback with a todo list](/exercise/perf-usecallback): typing in an unrelated field must not re-render every row.

## The sentence that ties them together

- \`memo\` — skip a **component** render.
- \`useMemo\` — skip a **calculation** (or keep an object identity).
- \`useCallback\` — keep a **function** identity so \`memo\` and effects are not lied to.

They stack: memoized child + stable callback + maybe a memoized extra prop.

## When the answer is 'don't'

Premature memoization is a smell. If the list has ten cheap rows, a parent re-render is fine. If you memoize everything, you now have a stale-deps surface area.

A senior-sounding close: "I would profile or at least have a reason — a known expensive child, or a callback that is a dependency. I would not wrap every handler."

Then prove the reason in [memo rows](/exercise/perf-memo-row), [useMemo filter](/exercise/perf-usememo-filter), and [useCallback todos](/exercise/perf-usecallback).
`,
};
