import type { Article } from "../types";

export const post: Article = {
  slug: "react-interview-in-the-ai-era",
  title: "Why learn React in the AI era?",
  description:
    "AI can write React in seconds. Learning it still matters because you have to judge the result: state, re-renders, fetching, and whether the code is actually good.",
  date: "2026-10-14",
  tags: ["AI", "interview", "fundamentals"],
  relatedExercises: [
    "lists-filter",
    "fetch-users",
    "perf-usememo-filter",
    "hooks-use-toggle",
    "ctx-theme",
    "jsx-split-components",
  ],
  faq: [
    {
      question: "Why learn React if AI can already write React code?",
      answer:
        "AI can generate a component quickly. You still need to know whether the state model, fetching, re-renders, and structure are right. Without that, generated code can look fine while hiding bugs, slowness, or extra complexity.",
    },
    {
      question: "Does AI replace the need to understand React fundamentals?",
      answer:
        "No. Fundamentals are how you judge the output: local vs server state, when to fetch, why a list re-renders, whether Context is appropriate, and when to extract a hook or split a component.",
    },
    {
      question: "What should I practice if I already use AI to write React?",
      answer:
        "Practice the parts generated code still gets wrong: lists and keys, data fetching with loading and error states, expensive filters, custom hooks, and Context. Then compare the model's draft with yours.",
    },
  ],
  body: `AI can write React code in seconds.

It can create a component, generate a form, add a modal, connect an API, and even build an entire small application from a simple description.

So a reasonable question is:

**Why should I spend time learning React when AI can already write React for me?**

The answer is not that AI will never replace developers.

The more important answer is this:

**Knowing how to build software is becoming less about typing code and more about understanding what the code should do, why it should work that way, and whether the result is actually good.**

And that requires knowledge.

## AI can generate code. It doesn't automatically give you understanding.

Imagine asking an AI: "Build a React component that displays a list of products."

It can probably do it.

But what happens when the requirements become less obvious?

- Should the list use local state or server state?
- Should the data be [fetched](/exercise/fetch-users) on every render?
- What happens when the user [changes the filter](/exercise/lists-filter)?
- Why is the component rendering five times?
- Why does the UI feel slow with 10,000 items?
- Should this logic be moved into a [custom hook](/exercise/hooks-use-toggle)?
- Is [Context](/exercise/ctx-theme) the right solution, or would it create unnecessary re-renders?
- Should this component be [split](/exercise/jsx-split-components), or would that make the code harder to understand?

AI can suggest answers.

But **you need enough knowledge to judge those answers.**

Without that knowledge, AI-generated code can look convincing while quietly creating bugs, performance problems, security issues, or unnecessary complexity.

## React is not just syntax

Learning React isn't really about memorizing \`className\`, hook names, or the shape of a \`useEffect\` call.

It is about a **mental model**: UI as a function of state, lists with stable identity, effects as a sync with the outside world, and composition instead of a pile of copy-pasted JSX.

That is what lets you read a generated component and say "this fetch belongs in an effect with cleanup," or "this filtered list should be derived, not stored," or "this Context value will re-render the whole tree."

Those are the same questions [React interviews](/blog/react-interview-questions) still ask. A model can emit the first draft. You are the one who has to keep it honest.

A practical way to build that judgment: solve a small exercise yourself, then ask AI for a version and **diff** them. Keep what is clearer. Reject what hides state or skips a loading and error path.

Start here:

1. [Filter a list](/exercise/lists-filter)
2. [Fetch with loading and error states](/exercise/fetch-users)
3. [Memoize an expensive filter](/exercise/perf-usememo-filter)
4. [Extract a custom hook](/exercise/hooks-use-toggle)

When those feel obvious, you can use AI as a tool instead of a substitute. More on that in [how to prepare for a React coding interview](/blog/react-coding-interview-prep).
`,
}
