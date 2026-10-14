import type { Article } from "../types";

export const post: Article = {
  slug: "react-interview-questions",
  title: "React interview questions (with live coding practice)",
  description:
    "The React interview questions hiring teams actually ask, grouped by topic, with live exercises you can solve in the browser.",
  date: "2026-10-12",
  tags: ["interview", "hooks", "fundamentals"],
  relatedExercises: ["state-counter", "effects-document-title", "lists-users", "hooks-use-toggle", "fetch-users"],
  faq: [
    {
      question: "What React topics come up most often in interviews?",
      answer:
        "Hooks (useState, useEffect, custom hooks), lists and keys, controlled forms, Context, data fetching with loading and error states, and performance with memo, useMemo, and useCallback.",
    },
    {
      question: "Are React interviews mostly trivia or coding?",
      answer:
        "Most mid-level interviews mix a short conceptual round with a timed coding exercise. You are expected to write working components, not just name APIs.",
    },
    {
      question: "How should I practice for a React coding interview?",
      answer:
        "Solve small, timed exercises that match interview prompts: a counter, a filtered list, a form, an effect with cleanup, and a fetch with loading and error states. Practice explaining tradeoffs as you code.",
    },
  ],
  body: `React interviews rarely stay on trivia. You will be asked to **build a small UI**, then explain why it works. The questions below are the ones that show up again and again, grouped the way interviewers actually probe them.

This guide is a map, not a flashcard deck. Each section points to a live exercise on React Interviewer so you can write the code, not just reread it.

## What interviewers are really testing

A typical React interview checks four things:

- You can model UI as **state + events**, not as a pile of DOM queries.
- You know when a value belongs in \`useState\`, \`useRef\`, or derived data.
- You can synchronize with the outside world in \`useEffect\` without leaks or extra runs.
- You can talk about keys, re-renders, and data fetching without hand-waving.

If you can do those four, the named APIs (Context, memo, custom hooks) are mostly variations.

## Fundamentals they still ask

Expect a warm-up that looks easy and then a follow-up:

- What is the difference between a component and an element?
- Why does JSX use \`className\` instead of \`class\`?
- When should you split a component?
- How do props flow, and what is composition with \`children\`?

A strong answer is concrete. Build a [profile card](/exercise/jsx-profile-card), then a [button with variants](/exercise/props-button-variants). Interviewers care that you pass data down and keep the parent in charge of behavior.

## State questions

Almost every live coding round starts with state:

- Why doesn't mutating a variable re-render the UI?
- What does \`useState\` return, and why is the setter stable?
- When should you pass an updater function (\`setCount(c => c + 1)\`) instead of the next value?
- How do you keep related values in one state object vs several \`useState\` calls?

Practice the [counter](/exercise/state-counter) until increment, decrement, and a floor of zero are muscle memory. Then do the [todo list](/exercise/state-todo-list): add, toggle, and delete without mutating the array.

A common trap is treating derived values as state. If you can compute it from existing state (filtered items, a total, a disabled flag), compute it during render.

## \`useEffect\` questions

This is where interviews get sharp. You should be able to explain:

- Effects run **after paint**, to sync with something React does not own.
- The dependency array is a list of reactive values the effect reads.
- Cleanup runs before the next effect and on unmount.
- An effect with missing deps, or with deps that change every render, is a bug waiting to happen.

Walk through [syncing \`document.title\`](/exercise/effects-document-title), then a [countdown](/exercise/effects-countdown) and a [stopwatch](/exercise/effects-stopwatch). If you cannot explain why the interval is created in an effect and cleared in cleanup, keep practicing that pair.

## Lists, keys, and forms

Two classics:

- Why shouldn't you use the array index as a \`key\` when the list can reorder, filter, or delete?
- What is a controlled input, and why do \`value\` and \`onChange\` go together?

Keys tell React which child is which across renders. Indexes lie when items move. Practice [rendering users with stable ids](/exercise/lists-users) and a [filterable list](/exercise/lists-filter).

For forms, start with a [controlled greeting input](/exercise/forms-live-greeting) and a [signup form](/exercise/forms-signup). Interviewers often ask you to disable submit until the form is valid, or to lift the value up so a sibling can display it.

## Hooks, context, and performance

Once the basics are solid, expect:

- When do you extract a **custom hook**? (reuse stateful logic, not JSX)
- When is Context better than prop drilling, and when is it worse?
- What problem do \`React.memo\`, \`useMemo\`, and \`useCallback\` each solve?

Good follow-up exercises: [useToggle](/exercise/hooks-use-toggle), a [theme context](/exercise/ctx-theme), and [memoized rows](/exercise/perf-memo-row). Do not sprinkle memoization on every function. Use it when a child is expensive or when a callback is a dependency of \`memo\` or an effect.

## Data fetching

A mid-level interview often ends with fetch:

- Show loading and error UI.
- Fetch in an effect (or explain a data library) and clean up.
- Avoid race conditions when the query changes quickly.

The [user list fetch](/exercise/fetch-users) covers loading, error, and retry. The [search-with-abort](/exercise/fetch-search-abort) exercise is the one that separates people who have shipped search boxes from people who have only read about them.

## How to answer in the room

Talk while you type. Name the state. Say why the effect has those deps. If you skip a key or mutate an array, correct it out loud. Interviewers hire the debugging process, not a memorized snippet.

When you are ready, start from the [exercise list](/) and work topic by topic. For a longer plan, see [how to prepare for a React coding interview](/blog/react-coding-interview-prep).
`,
};
