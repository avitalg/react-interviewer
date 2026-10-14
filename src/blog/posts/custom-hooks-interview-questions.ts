import type { Article } from "../types";

export const post: Article = {
  slug: "custom-hooks-interview-questions",
  title: "Custom hooks interview questions (useToggle, useDebounce, and friends)",
  description:
    "How to design custom React hooks in interviews: naming, return values, stable callbacks, cleanup, and the hooks people are asked to write on a whiteboard.",
  date: "2026-10-06",
  tags: ["custom hooks", "useToggle", "useDebounce"],
  relatedExercises: ["hooks-use-toggle", "hooks-use-local-storage", "hooks-use-debounce", "refs-previous-value"],
  body: `Custom hooks are how you show that you can **reuse stateful logic** without copying and pasting \`useState\` + \`useEffect\` between components. Interviews either ask you to write one, or they watch whether you extract one without being told.

## What a custom hook is (and is not)

A custom hook is a function whose name starts with \`use\` that calls other hooks. It shares **behavior**, not UI. If you are returning JSX, you want a component.

Rules interviewers listen for:

- Only call hooks at the top level of the hook (same rules as components).
- The hook owns the state; the component owns how it looks.
- Return a small, stable API: a value and a function, or a tiny object.

## useToggle

The hello-world of hook design. You want \`[value, toggle]\` where:

- \`toggle()\` flips.
- \`toggle(true)\` / \`toggle(false)\` set explicitly.
- A click event passed by accident (\`onClick={toggle}\`) still flips, because the event is not a boolean.
- \`toggle\` is wrapped in \`useCallback\` so it keeps identity.

That last point is not decoration. If a child is memoized, or an effect depends on \`toggle\`, an unstable function re-runs work for no reason.

Implement it in [useToggle](/exercise/hooks-use-toggle), including the **Show details** / **Hide details** button so you prove the hook is usable, not just exported.

## useLocalStorage

This one tests edge cases:

- Read JSON on first render (or after mount, and say why you chose that).
- Write on change, including updater functions \`set(n => n + 1)\`.
- Corrupt JSON must not crash the app.

SSR follow-up: \`localStorage\` is not on the server. A careful answer is "read a default on the server, then hydrate from storage in an effect" **or** "this hook is client-only". Do not pretend \`window\` exists in a Server Component.

Practice [useLocalStorage](/exercise/hooks-use-local-storage).

## useDebounce

Debouncing is an effects-and-cleanup problem wearing a hook costume.

- Return the current value immediately on first render.
- After the value changes, wait \`delay\` ms of quiet before updating the returned value.
- Every change **restarts** the timer.
- Clear the timeout on unmount.

If you forget cleanup, you will set state on an unmounted component or apply a stale query. Pair this with a search input, as in [useDebounce](/exercise/hooks-use-debounce).

## usePrevious

Refs plus an effect: store the previous render's value. First render returns \`undefined\` (or a sentinel). See [previous value](/exercise/refs-previous-value).

This is a good moment to say: the ref update runs in an effect, so during render \`ref.current\` is still the previous value. That is the trick.

## Design questions they ask after you code

- Why not put this logic in a helper that isn't a hook? (Because it needs state or effects.)
- Could this be a component instead? (If the UI is always the same, maybe. If several screens need the behavior, a hook is right.)
- How do you test it? (Render a tiny harness component, or use \`renderHook\`.)

## A reusable answer

"I extract a hook when two components share the same state transitions. I keep the return value boring, stabilize callbacks, and put timers and listeners in effects with cleanup."

Then write [useToggle](/exercise/hooks-use-toggle), [useLocalStorage](/exercise/hooks-use-local-storage), and [useDebounce](/exercise/hooks-use-debounce) without looking at notes.
`,
};
