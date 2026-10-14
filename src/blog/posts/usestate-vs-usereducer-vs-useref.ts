import type { Article } from "../types";

export const post: Article = {
  slug: "usestate-vs-usereducer-vs-useref",
  title: "useState vs useReducer vs useRef: which one interviews want",
  description:
    "A practical guide to choosing useState, useReducer, or useRef in React interviews, with examples of derived state and when refs are the right tool.",
  date: "2026-09-24",
  tags: ["useState", "useReducer", "useRef"],
  relatedExercises: ["state-counter", "state-todo-list", "state-undo-redo", "ctx-cart-reducer", "refs-focus-input"],
  body: `Interviewers love this trio because the wrong choice still "works" in a demo and then falls apart under follow-up questions. You need a rule of thumb, then a few exceptions.

## Start with useState

\`useState\` is the default for **values that the UI should re-render from**. A count, a draft string, a boolean for an open modal, a selected id.

Use an updater function when the next value depends on the previous one:

\`\`\`
setCount((count) => count + 1)
\`\`\`

That matters inside timeouts, effects, and any handler that might fire with a stale closure. The [counter](/exercise/state-counter) is the warmup; the [todo list](/exercise/state-todo-list) is the real check: add, toggle, and delete with **immutable** updates (\`map\`, \`filter\`, spread). Mutating \`todos.push()\` is a classic fail.

If two pieces of state always change together (x and y of a point, width and height), one object is clearer than two hooks. If they change independently, keep them separate.

## Derived state is not state

This is the follow-up that catches people:

> I stored \`filteredTodos\` in state and updated it in an effect whenever \`todos\` or \`query\` changed.

That is extra renders and extra bugs. During render:

\`\`\`
const visible = todos.filter((todo) => todo.title.includes(query));
\`\`\`

No effect. No second \`useState\`. Interviewers are listening for that sentence.

## When useReducer is the better story

Reach for \`useReducer\` when **several updates share a vocabulary**: add item, change quantity, clear cart, undo. The component stops scattering \`setA\` / \`setB\` / \`setC\` and instead dispatches events.

A reducer must be pure. No mutations, no fetch, no \`Date.now()\` as a hidden input if you can pass it in. Return new objects.

Two exercises make this concrete:

- [Undo / redo](/exercise/state-undo-redo) — history is a stack of snapshots, not a tangle of flags.
- [Cart with context and a reducer](/exercise/ctx-cart-reducer) — the same actions are used from nested buttons.

A good interview line: "I would use \`useState\` until the updates are easier to name as events than as field writes. Then I extract a reducer."

## useRef is not 'state that does not re-render' first

Lead with the DOM case: **a ref holds a node**. Focus an input, measure a box, ignore clicks outside a dropdown. See [focus an input](/exercise/refs-focus-input) and [close a menu on outside click](/exercise/refs-dropdown-outside-click).

The second use is a mutable box that **survives renders without triggering them**: previous value, a timer id, an AbortController. [Keep the previous value](/exercise/refs-previous-value) is the standard hook question (\`usePrevious\`).

Do not put the visible count in a ref and then \`forceUpdate\`. If the user should see it, it is state.

## A decision cheat sheet

- The screen should change when it changes → \`useState\` (or reducer).
- Many related transitions with named actions → \`useReducer\`.
- You need the DOM node or a mutable box that is not UI → \`useRef\`.
- You can compute it from props/state → **nothing**. Derive it.

Say that out loud, then write the component. The choice is the interview as much as the syntax.
`,
};
