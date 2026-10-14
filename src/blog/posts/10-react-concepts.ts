import type { Article } from "../types";

export const post: Article = {
  slug: "10-react-concepts",
  title: "10 React concepts you need to know",
  description:
    "Ten React ideas that cover most of a codebase and an interview: JSX, components, state, render, keys, effects, refs, context, custom hooks, and memoization.",
  date: "2026-10-11",
  tags: ["fundamentals", "interview"],
  relatedExercises: [
    "jsx-profile-card",
    "jsx-star-rating",
    "props-button-variants",
    "props-card-children",
    "props-compound-tabs",
    "state-counter",
    "state-todo-list",
    "lists-users",
    "lists-sortable-table",
    "effects-document-title",
    "effects-countdown",
    "fetch-users",
    "refs-focus-input",
    "refs-previous-value",
    "refs-dropdown-outside-click",
    "ctx-theme",
    "ctx-auth",
    "ctx-cart-reducer",
    "hooks-use-toggle",
    "hooks-use-local-storage",
    "hooks-use-debounce",
    "perf-memo-row",
    "perf-usememo-filter",
    "perf-usecallback",
  ],
  faq: [
    {
      question: "What React concepts should I learn first?",
      answer:
        "Start with JSX, components and props, then state and re-renders, then lists with keys and useEffect. Refs, Context, custom hooks, and memoization build on those. Most interview problems are combinations of these ten ideas.",
    },
    {
      question: "Is JSX the same as HTML?",
      answer:
        "No. JSX looks like HTML but compiles to JavaScript function calls that return objects describing the UI. That is why you use className instead of class, camelCase events like onClick, and JavaScript expressions inside curly braces.",
    },
    {
      question: "When should I use React.memo, useMemo, and useCallback?",
      answer:
        "Use them to skip work React would otherwise repeat: memo for an expensive child whose props usually stay the same, useMemo for a slow calculation, useCallback when a function is passed to a memoized child or used as an effect dependency. Do not add them everywhere; measure first.",
    },
  ],
  body: `React has a small core. Once you understand these ten ideas, most of what you see in a codebase or an interview is a combination of them. Each one comes with a short example, the mistake people usually make, and an exercise to practice it on.

## 1. JSX is JavaScript

JSX looks like HTML, but it compiles to function calls that return plain objects describing the UI. That's why you can put any JavaScript expression inside \`{}\`, store JSX in variables, and return it from functions.

\`\`\`
const greeting = <h1>Hello, {user.name}</h1>;
// compiles to roughly:
// jsx('h1', { children: ['Hello, ', user.name] })
\`\`\`

A few rules follow from this: use \`className\` instead of \`class\`, \`htmlFor\` instead of \`for\`, camelCase event names like \`onClick\`, and a component must return a single root (wrap siblings in a \`<>...</>\` fragment). Statements like \`if\` and \`for\` don't work inside \`{}\`; use a ternary, \`&&\`, or \`map\`.

Practice: [Profile card](/exercise/jsx-profile-card), [Star rating display](/exercise/jsx-star-rating).

## 2. Components, props and one-way data flow

A component is a function that takes props and returns JSX. Data flows down: a parent passes props to its children, and children never change their props.

When a child needs to change something, the parent passes a function down and the child calls it:

\`\`\`
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} onIncrement={() => setCount(c => c + 1)} />;
}
\`\`\`

When two siblings need the same data, move the state up to their closest common parent. This is called **lifting state up**, and it's the answer to most "how do these two components talk to each other?" questions.

The \`children\` prop lets you compose components like HTML tags, so a \`Card\` or \`Modal\` can wrap any content without knowing what it is.

Practice: [Button with variants](/exercise/props-button-variants), [Card with children and a footer slot](/exercise/props-card-children), [Compound Tabs component](/exercise/props-compound-tabs).

## 3. State and re-renders

State is data a component remembers between renders. Calling the setter tells React to render that component again with the new value. A regular variable won't work, because it resets on every render and changing it doesn't trigger one.

Two things to know about setters:

- **State is a snapshot.** Inside one render, \`count\` never changes, even right after \`setCount\`. The new value shows up on the next render.
- **React compares by reference.** Mutating an object or array and passing the same reference back won't re-render; create a new one with spread, \`map\` or \`filter\`.

\`\`\`
setUser({ ...user, name: 'Dana' });     // new object, re-renders
setCount(c => c + 1);                    // safe when based on previous value
\`\`\`

When a parent re-renders, its children re-render too by default. That's normal and usually fast; [concept 10](#10-memoization-memo-usememo-usecallback) covers when to stop it.

Practice: [Counter](/exercise/state-counter), [Todo list](/exercise/state-todo-list).

For when to reach for \`useState\`, \`useReducer\`, or \`useRef\`, see [which state hook to use](/blog/usestate-vs-usereducer-vs-useref).

## 4. Render and commit: how React updates the DOM

Every update goes through the same three steps:

1. **Trigger.** Something asks for an update: the first mount, or a state setter being called.
2. **Render.** React calls your component functions to get the new JSX. This is pure calculation; nothing on the screen changes yet.
3. **Commit.** React compares the new output with the previous one and changes only the DOM nodes that differ. Then effects run.

This explains several rules. Components must be **pure during render**: no fetching, no changing outside variables, no setting state at the top level, because React may render more than once (Strict Mode does it on purpose in development). Side effects belong in event handlers or effects, which run after commit.

It also means a re-render isn't the same as a DOM update. A component can render ten times and touch the DOM zero times if the output didn't change.

## 5. Keys and reconciliation

When React compares old and new output during commit, it needs to know which list item is which. The \`key\` prop is how it tells them apart.

\`\`\`
{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
\`\`\`

Keys should be stable and unique among siblings, usually an id from your data. The array index only works if the list never reorders, filters or removes items. Otherwise React reuses the wrong component for the wrong item, and its local state (a checkbox, a typed value) shows up on the wrong row.

Keys have a second use: changing a component's key makes React throw it away and mount a fresh one. \`<Profile key={userId} />\` is a clean way to reset all of a form's state when the user changes.

Practice: [Render a list of users](/exercise/lists-users), [Sortable table](/exercise/lists-sortable-table).

The follow-up interviewers love is "why not the index?" — [why list keys matter](/blog/react-list-keys) walks through that in more detail.

## 6. Effects and cleanup

\`useEffect\` runs code after commit to keep your component in sync with something outside React: a timer, a subscription, the document title, a network request.

\`\`\`
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
\`\`\`

The dependency array says when to re-run: \`[]\` once after mount, \`[a, b]\` when \`a\` or \`b\` change, and no array after every render. List every value the effect reads, or it will see stale ones.

The returned function is the **cleanup**. React runs it before the effect runs again and when the component unmounts. If you start something, stop it there.

The most common misuse is an effect that only computes a value from props or state and stores it in more state. Compute it during render instead.

Practice: [Sync the document title](/exercise/effects-document-title), [Countdown timer](/exercise/effects-countdown), [Fetch with loading and error states](/exercise/fetch-users).

See [useEffect interview questions](/blog/useeffect-interview-questions) for deps, cleanup, and the cases where you shouldn't use an effect at all.

## 7. Refs

\`useRef\` gives you a box (\`ref.current\`) that survives re-renders, and changing it doesn't cause one. It has two uses.

Reaching a DOM node, for focus, scrolling or measuring:

\`\`\`
const inputRef = useRef(null);
<input ref={inputRef} />
<button onClick={() => inputRef.current.focus()}>Focus</button>
\`\`\`

Keeping a value that isn't shown on screen, such as an interval id, the previous value of a prop, or a flag for whether a request is still current.

The rule of thumb: if changing the value should update the UI, use state. If not, use a ref. And don't read or write \`ref.current\` during render, since React doesn't track it.

Practice: [Focus an input](/exercise/refs-focus-input), [usePrevious hook](/exercise/refs-previous-value), [Dropdown that closes on outside click](/exercise/refs-dropdown-outside-click).

## 8. Context

Context passes a value to any component below a provider without threading it through every level as props. It's meant for data many components need: the current theme, the signed-in user, the locale.

\`\`\`
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  // ...
}
\`\`\`

Two things to know. Every component that reads a context re-renders when its value changes, so a large, fast-changing context can slow an app down. And context isn't a state manager by itself; it only delivers a value. Pair it with \`useState\` or \`useReducer\` for the logic, and wrap the \`useContext\` call in a custom hook such as \`useAuth()\`.

Practice: [Theme context instead of prop drilling](/exercise/ctx-theme), [Auth provider and useAuth hook](/exercise/ctx-auth), [Shopping cart with useReducer + context](/exercise/ctx-cart-reducer).

The longer [Context API interview](/blog/react-context-api-interview) guide covers providers, custom hooks, and when not to use context.

## 9. Custom hooks and the rules of hooks

A custom hook is a function whose name starts with \`use\` and that calls other hooks. It lets you pull stateful logic out of a component and reuse it.

\`\`\`
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(v => !v), []);
  return [on, toggle];
}
\`\`\`

Each component that calls a hook gets its own copy of the state. Hooks share **logic**, not data.

All hooks follow two rules:

- Call them only at the **top level** of a component or another hook, never inside conditions, loops or nested functions. React identifies each hook by its call order, and a skipped call shifts every hook after it.
- Call them only from React components or custom hooks, not from regular functions.

Practice: [useToggle](/exercise/hooks-use-toggle), [useLocalStorage](/exercise/hooks-use-local-storage), [useDebounce](/exercise/hooks-use-debounce).

More interview prompts live in [custom hooks interview questions](/blog/custom-hooks-interview-questions).

## 10. Memoization: memo, useMemo, useCallback

These three tools skip work React would otherwise repeat on every render:

- \`React.memo(Component)\` remembers a component's output. Use it when its props usually stay the same and it's expensive to render.
- \`useMemo(() => value, deps)\` remembers a computed value. Use it when the calculation is slow, or the value is passed to a memoized child.
- \`useCallback(fn, deps)\` remembers a function's identity. Use it when the function is passed to a memoized child or used as an effect dependency.

They work together. \`React.memo\` compares props by reference, so passing a new inline object or arrow function on every render defeats it. \`useMemo\` and \`useCallback\` keep those references stable.

\`\`\`
const handleDelete = useCallback(id => {
  setItems(items => items.filter(i => i.id !== id));
}, []);

return <Row onDelete={handleDelete} />; // Row is wrapped in React.memo
\`\`\`

Don't add them everywhere. Memoizing has its own cost, and most renders are fast. Measure first with the React DevTools Profiler, then fix the slow part. Newer projects using the React Compiler get much of this automatically, but interviewers still expect you to explain it.

Practice: [Skip re-rendering rows with memo](/exercise/perf-memo-row), [Memoize an expensive filter](/exercise/perf-usememo-filter), [Stable callbacks for memoized children](/exercise/perf-usecallback).

See [memo, useMemo, and useCallback](/blog/react-memo-usememo-usecallback) for the interview version of this.

## How to practice

You learn these concepts by writing them, not by reading about them. Work through them in order: each one builds on the ones before it, and concepts 4 and 5 explain why the rules in 3, 6 and 10 exist.

On React Interviewer, every exercise linked above runs in a live editor with a preview beside it. Submit your solution to get feedback on each requirement, plus a minimal fix you can apply to your own code.

If you want a tighter interview checklist instead of this map, start with [Top 5 things you need to know before a React interview](/blog/top-5-react-interview), then use [How to prepare for a React coding interview](/blog/react-coding-interview-prep) as a week-by-week plan.
`,
};
