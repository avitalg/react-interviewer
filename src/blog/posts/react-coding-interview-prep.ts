import type { Article } from "../types";

export const post: Article = {
  slug: "react-coding-interview-prep",
  title: "How to prepare for a React coding interview",
  description:
    "A practical prep plan for React coding interviews: what to practice, how to think while you code, and how to use live exercises to build confidence.",
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
        "A small interactive widget: a filtered list, a form with validation, a fetch with loading and error, or a component with a custom hook. Understand the requirements, choose state, then add edge cases.",
    },
    {
      question: "Should I use AI to prepare for a React coding interview?",
      answer:
        "Yes, as a coach: try first, get stuck, ask for a hint, then review. Do not let it solve every exercise. You still need to produce the pattern yourself under a clock.",
    },
  ],
  body: `A React coding interview is a short, noisy environment.

You have limited time, an unfamiliar problem, someone watching you code, and often a few follow-up questions waiting at the end.

You don't need to memorize every React API.

You need to recognize the **common problem patterns**, understand why your solution works, and be able to explain your decisions while you build.

The best way to prepare is simple:

**Practice the same patterns repeatedly, out loud, under a clock.**

This is a prep plan you can actually follow, mapped to live exercises on React Interviewer.

## What the hour usually looks like

Every interview is different, but a typical React coding session may include:

1. A few minutes of introductions and explaining the task.
2. Thirty to forty minutes of implementation.
3. A few minutes of follow-up questions about your solution.
4. Questions such as: "What would you change?", "How would you test this?", "What happens with a large dataset?", or "How would you make this accessible?"

The interviewer usually isn't looking for a perfect architecture or a production-ready design system.

They want to see whether you can:

- Understand the requirements.
- Break a problem into components.
- Choose appropriate state.
- Handle user interactions.
- Update state correctly.
- Think about edge cases.
- Avoid common React mistakes.
- Explain your decisions.
- Recognize when your first approach isn't ideal.

The code matters.

**How you reason about the code matters just as much.**

## Week plan

### Days 1–2: JSX, props, and state

Start with the fundamentals.

Practice components that receive props, compose with \`children\`, and manage simple state.

- [Profile card](/exercise/jsx-profile-card)
- [Button variants](/exercise/props-button-variants)
- [Counter](/exercise/state-counter)
- [Todo list](/exercise/state-todo-list)

Focus on:

- Props vs. state
- Component composition
- \`children\`
- Event handlers
- Updating state immutably
- Understanding why a state update causes a re-render

**Goal:** You should be comfortable building a small interactive component without stopping to think about basic React syntax.

### Days 3–4: Lists and forms

Next, practice the patterns that appear constantly in real applications.

- [List of users with keys](/exercise/lists-users)
- [Filterable list](/exercise/lists-filter)
- [Controlled greeting](/exercise/forms-live-greeting)
- [Signup form](/exercise/forms-signup)

Focus on:

- Rendering arrays
- Choosing stable keys
- Controlled inputs
- Handling multiple form fields
- Validation
- Derived values
- Updating objects and arrays in state

Be able to explain why \`key={user.id}\` is usually preferable to using the array index when items can be added, removed, or reordered.

**Goal:** Build a small form or list without getting lost in state updates.

### Days 5–6: Effects and refs

Now move into the areas where React interviews often become more conceptual.

- [Document title](/exercise/effects-document-title)
- [Countdown](/exercise/effects-countdown)
- [Focus input](/exercise/refs-focus-input)
- [Outside click](/exercise/refs-dropdown-outside-click)

Focus on:

- When an effect is actually needed
- Dependency arrays
- Cleanup
- Timers and event listeners
- Synchronizing with browser APIs
- Using refs for values or DOM nodes that don't belong in React state

One important interview habit:

**Don't reach for \`useEffect\` automatically.**

First ask: "Am I synchronizing React with something outside React?"

If not, there may be a simpler solution.

Read [useEffect interview questions](/blog/useeffect-interview-questions) if this area still feels unclear.

### Days 7–8: Hooks, context, fetching, and performance

Once the fundamentals feel comfortable, practice combining them.

- [useToggle](/exercise/hooks-use-toggle)
- [Theme context](/exercise/ctx-theme)
- [Fetch users](/exercise/fetch-users)
- [Abortable search](/exercise/fetch-search-abort)
- [memo / useMemo / useCallback trio](/blog/react-memo-usememo-usecallback)

Focus on:

- Custom hooks
- Sharing logic without duplicating it
- Context and when it is appropriate
- Loading, success, empty, and error states
- Race conditions in asynchronous requests
- Cancelling outdated requests
- Understanding when memoization actually helps

Don't memorize rules such as "always use \`useMemo\`" or "always use \`useCallback\`".

Understand **what problem each tool solves**.

## How to practice each exercise

Set a 20-minute timer.

Don't look at the solution during the first 12 minutes.

For every exercise:

### 1. Restate the problem

Before writing code, make sure you understand what the component needs to do.

### 2. Identify the state

Ask:

- What information changes?
- Does it really need to be state?
- Can I derive it from existing state or props?

### 3. Build the happy path

Get the basic interaction working first.

Don't spend five minutes choosing the perfect variable name before anything renders.

### 4. Add edge cases

Think about:

- Empty values
- Empty lists
- Loading
- Errors
- Disabled actions
- Duplicate actions
- Rapid user interaction

### 5. Review the solution

Ask yourself: "If an interviewer asked me to change one requirement right now, would I know where to make the change?"

That's often a better test of your solution than whether the code looks clever.

If you finish early, add one realistic requirement:

- Keyboard support
- Accessibility attributes
- Loading or error state
- A custom hook
- Performance optimization
- Tests

## How to talk while you code

One of the hardest parts of a live coding interview is coding **and** communicating at the same time.

Don't narrate every keystroke.

Instead, explain decisions.

For example: "I'll keep the query in state and derive the filtered list from it rather than storing both."

Or: "This timer needs to be created as a side effect, and I'll return a cleanup function so we don't leave the interval running."

Or: "I'm using the user's ID as the key because the identity of the item is stable even if the list changes."

This gives the interviewer insight into your reasoning.

And if you realize your first approach isn't ideal, say so.

"Actually, I don't need state here. This value can be derived from the existing state, so I'll simplify it."

Changing your approach isn't a failure.

**Recognizing that a simpler solution is better is a positive signal.**

## Things that can hurt your interview

Some mistakes appear frequently in React coding exercises:

- Mutating arrays or objects stored in state.
- Performing side effects during render.
- Using unstable keys for dynamic lists.
- Adding \`useEffect\` when derived data would be simpler.
- Forgetting effect cleanup when subscribing to something or creating timers/listeners.
- Creating unnecessary state for values that can be derived.
- Ignoring loading, empty, or error states.
- Overengineering a small problem.
- Writing code you cannot explain.

One especially important mistake is blindly following a pattern you memorized without understanding why it exists.

For example, if you know that \`useMemo\` can prevent unnecessary calculations but don't understand when memoization is useful, you may end up making the code more complicated without improving performance.

The [question bank](/blog/react-interview-questions) is a useful checklist for reviewing these concepts.

## What about AI?

You can absolutely use AI while preparing.

In fact, you should.

But don't let AI solve every exercise for you.

If you immediately ask an AI to implement a problem, you may recognize the solution when you see it without being able to produce it yourself under interview pressure.

A better workflow is:

**Try → get stuck → think → ask for a hint → continue → review the solution.**

You can also ask AI to act as the interviewer: "Give me a React coding problem. Don't provide the solution. Ask follow-up questions like a real interviewer."

Then solve it while explaining your thinking.

The goal isn't to prove that you can code without AI.

The goal is to make sure **AI is helping you learn rather than replacing the learning process.**

For more on that, see [Why learn React in the AI era?](/blog/react-interview-in-the-ai-era).

## Day before the interview

Don't try to learn ten new APIs the night before.

Instead, re-run three exercises you've already practiced:

- A form
- An effect with cleanup
- A data-fetching exercise

Try to solve each one without looking at the previous implementation.

Then review the React concepts you're most likely to be asked about.

And stop.

Being rested is more useful than squeezing another three hours of memorization into the night.

## On the day

Start with something familiar.

Do one short 15-minute exercise on the topic you feel least comfortable with.

Don't turn it into a three-hour study session.

The purpose is to get your brain back into **React mode**, not to learn something new.

Then stop practicing.

Go into the interview expecting to think out loud, ask clarifying questions, and iterate on your solution.

You don't need to produce perfect code immediately.

You need to demonstrate that you can **reason your way toward a good solution.**

Start from the [practice homepage](/) if you want that last 15-minute drill.
`,
}
