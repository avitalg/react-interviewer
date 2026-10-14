import type { Article } from "../types";

export const post: Article = {
  slug: "react-coding-interview-prep",
  title: "How to prepare for a React coding interview",
  description:
    "A practical prep plan for React coding interviews: what to practice, how to talk while you code, and a topic-by-topic drill list.",
  date: "2026-10-14",
  tags: ["interview prep", "study plan"],
  relatedExercises: ["state-counter", "effects-countdown", "forms-signup", "lists-filter", "fetch-users"],
  faq: [
    {
      question: "How long should I practice for a React interview?",
      answer:
        "If you already use React at work, two weeks of daily timed exercises is enough to cover hooks, lists, forms, effects, and fetching. If you are newer, plan a month and finish at least one exercise per topic.",
    },
    {
      question: "What should I build in a 45-minute React interview?",
      answer:
        "A small interactive widget: a filtered list, a form with validation, a fetch with loading and error, or a component with a custom hook. Scope state first, then UI, then edge cases.",
    },
    {
      question: "Do I need to memorize React source internals?",
      answer:
        "No. You need a working model of render, state, effects, keys, and re-renders. Internals questions are rare compared with 'make this list filter and keep keys stable'.",
    },
  ],
  body: `A React coding interview is a short, noisy environment. You will not remember a blog post. You will remember **reps**: the same shapes of problems, solved out loud, under a clock.

This is a prep plan you can actually follow, mapped to live exercises on React Interviewer.

## What the hour usually looks like

1. Five minutes of intros and a prompt on a CoderPad, CodeSandbox, or a shared editor.
2. Thirty to forty minutes of building.
3. Five to ten minutes of "what would you do next?" — accessibility, performance, tests, data libraries.

They are not hoping for a design system. They want a component that works, state that makes sense, and a candidate who notices edge cases.

## Week plan

### Days 1–2: JSX, props, state

Write components that take props, compose with \`children\`, and store a number or a list. No effects yet.

- [Profile card](/exercise/jsx-profile-card)
- [Button variants](/exercise/props-button-variants)
- [Counter](/exercise/state-counter)
- [Todo list](/exercise/state-todo-list)

Goal: immutable updates and no "why isn't it re-rendering?" panic.

### Days 3–4: lists and forms

- [List of users with keys](/exercise/lists-users)
- [Filterable list](/exercise/lists-filter)
- [Controlled greeting](/exercise/forms-live-greeting)
- [Signup form](/exercise/forms-signup)

Goal: \`key={id}\`, controlled inputs, derived validation.

### Days 5–6: effects and refs

- [Document title](/exercise/effects-document-title)
- [Countdown](/exercise/effects-countdown)
- [Focus input](/exercise/refs-focus-input)
- [Outside click](/exercise/refs-dropdown-outside-click)

Goal: cleanup, dependency arrays, no timers in render. Read [useEffect interview questions](/blog/useeffect-interview-questions) if a prompt still feels fuzzy.

### Days 7–8: hooks, context, fetching, performance

- [useToggle](/exercise/hooks-use-toggle)
- [Theme context](/exercise/ctx-theme)
- [Fetch users](/exercise/fetch-users)
- [Abortable search](/exercise/fetch-search-abort)
- [memo / useMemo / useCallback trio](/blog/react-memo-usememo-usecallback)

Goal: name the four fetch states; do not invent races.

## How to practice each exercise

Set a 20-minute timer. Do not peek at a solution in the first 12 minutes.

1. Restate the prompt and list the state you need.
2. Render the happy path.
3. Add empty, disabled, and error cases.
4. Only then tidy names.

If you finish early, add one thing they might ask: keyboard support, a11y attributes, or a tiny custom hook.

## How to talk while you code

Silence reads as stuck. Narrate decisions:

- "I'll keep \`query\` in state and derive the filtered list."
- "This timer belongs in an effect so I can clear it."
- "Index as key would break when we delete, so I'm using \`user.id\`."

If you change your mind, say so. Interviewers are scoring the revision.

## Things that cost offers

- Mutating arrays and objects in state.
- Fetching in render.
- Missing keys, or keys that change.
- Effects that loop because the dep is a new object every time.
- Uncontrolled inputs that you then try to validate from React state.

The [question bank](/blog/react-interview-questions) is a checklist of those traps.

## Day before the interview

Do not cram ten new APIs. Re-run three exercises you already passed: a form, an effect with cleanup, and a fetch. Sleep.

On the day, start from the [practice homepage](/) and pick the topic you feel weakest on for one last 15-minute drill. Then stop.
`,
};
