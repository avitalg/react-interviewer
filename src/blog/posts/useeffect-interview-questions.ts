import type { Article } from "../types";

export const post: Article = {
  slug: "useeffect-interview-questions",
  title: "useEffect interview questions: deps, cleanup, and infinite loops",
  description:
    "Answer useEffect interview questions with a clear model: after-paint sync, dependency arrays, cleanup, and how infinite loops actually start.",
  date: "2026-10-10",
  tags: ["useEffect", "hooks", "lifecycle"],
  relatedExercises: ["effects-document-title", "effects-countdown", "effects-stopwatch", "fetch-search-abort"],
  faq: [
    {
      question: "When should I use useEffect?",
      answer:
        "Use useEffect to synchronize with something outside React: the document, a timer, a subscription, or a network request. If you can calculate the next UI from props and state during render, you do not need an effect.",
    },
    {
      question: "What does the dependency array do?",
      answer:
        "It lists the reactive values the effect reads. React re-runs the effect when one of those values changes. An empty array means run after mount (and clean up on unmount). Omitting the array means run after every render.",
    },
    {
      question: "How do I stop an infinite useEffect loop?",
      answer:
        "The effect is setting state that changes a dependency every time it runs. Fix the deps, avoid putting unstable objects in the array, or move the work out of the effect if it belongs in an event handler.",
    },
  ],
  body: `\`useEffect\` is the hook that produces the most interview follow-ups. The API looks small. The mistakes are not.

Keep one sentence in your head: **effects synchronize React with a system React does not own.** Everything else (deps, cleanup, Strict Mode double-mount) follows from that.

## The model interviewers want to hear

Render should be a pure function of props and state. After the browser paints, effects run:

1. React renders the UI.
2. The browser paints.
3. Effects run.
4. If deps change later, React **cleans up the previous effect**, then runs it again.
5. On unmount, cleanup runs one last time.

If a candidate says "useEffect is componentDidMount", an interviewer will poke until the candidate talks about **re-runs** and **cleanup**.

## Question: empty array vs no array vs deps

- \`useEffect(fn)\` — after every render. Almost never what you want.
- \`useEffect(fn, [])\` — after mount, cleanup on unmount. Right for a subscription you set up once, if the effect truly reads no reactive values.
- \`useEffect(fn, [count])\` — after mount and whenever \`count\` changes.

The dependency array is not a performance knob. It is a correctness list: **every reactive value the effect reads**.

Practice this on [sync the document title](/exercise/effects-document-title). The title must track the click count, so \`count\` belongs in the array. Leaving it empty is a stale-closure bug; omitting it updates the title more often than needed.

## Question: what goes in cleanup?

Cleanup is for **undoing the previous effect**:

- \`clearInterval\` / \`clearTimeout\`
- \`removeEventListener\`
- aborting a fetch
- unsubscribing from a store

It is not "destructor for the component" in the class sense. It runs before the next effect too, which is why a countdown can restart its interval when the delay changes.

Build the [countdown](/exercise/effects-countdown) and the [stopwatch](/exercise/effects-stopwatch). If you create \`setInterval\` in render, you will spawn extra timers. If you create it in an effect and forget cleanup, the timer outlives the component (and Strict Mode will make that obvious).

## Question: why did this loop forever?

An infinite loop is almost always:

\`\`\`
useEffect(() => {
  setItems([...items, extra]);
}, [items]);
\`\`\`

Each run produces a **new** \`items\` array, which changes the dep, which runs the effect again.

Fixes interviewers like:

- Do the update in an event handler, not an effect.
- Store a primitive (an id, a count) instead of a new object every time.
- If you must sync, compare before setting, or depend on a stable id.

"I wrapped it in \`useMemo\`" is not a complete answer. You have to say **which value was new every render**.

## Question: fetching in useEffect

Yes, interviews still ask you to fetch in an effect. A complete answer includes:

- a loading flag
- an error flag
- ignoring or aborting a stale response when the query changes or the component unmounts

The stale-response bug is the interesting one. Request A starts, then the user types and request B starts, then A finishes last and overwrites B. Cleanup with \`AbortController\` (or an ignored flag) is the expected fix.

Practice that in [search and abort](/exercise/fetch-search-abort). For the simpler mount-only case, use [fetch users](/exercise/fetch-users).

## Question: Strict Mode runs effects twice

In development, React mounts, unmounts, and remounts to surface missing cleanup. If your effect is correct, the extra run is a no-op: setup, cleanup, setup. If you see double fetches in dev, that is expected unless you cache; if you see **double intervals in production**, cleanup is missing.

## What not to put in useEffect

These usually should not be effects:

- Deriving a filtered list from \`items\` and \`query\` — compute it during render.
- Resetting state when a prop changes — often you want a \`key\` on the component, or adjust state in the event that caused the change.
- Responding to a button click — that is an event handler.

If you can point to the user action that caused the work, it probably does not belong in \`useEffect\`.

## Practice set

Do these in order and explain each out loud:

1. [Sync the document title](/exercise/effects-document-title)
2. [Countdown with cleanup](/exercise/effects-countdown)
3. [Stopwatch](/exercise/effects-stopwatch)
4. [Search fetch with abort](/exercise/fetch-search-abort)

When those four feel boring, you are ready for the \`useEffect\` round.
`,
};
