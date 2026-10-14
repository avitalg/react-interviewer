import type { Article } from "../types";

export const post: Article = {
  slug: "top-5-react-interview",
  title: "Top 5 things you need to know before a React interview",
  description:
    "Most React coding interviews test the same five things: how you update state, use effects, render lists, handle forms, and fetch data. Practice each one live.",
  date: "2026-10-14",
  tags: ["interview prep", "fundamentals"],
  relatedExercises: [
    "state-counter",
    "state-todo-list",
    "effects-countdown",
    "lists-users",
    "forms-signup",
    "fetch-users",
  ],
  faq: [
    {
      question: "What do React coding interviews actually test?",
      answer:
        "Most rounds test the same five things: immutable state updates, useEffect with dependencies and cleanup, list keys, controlled forms, and data fetching with loading, error, and races. You do not need every API if you can do these under a clock and explain why.",
    },
    {
      question: "Why is mutating state a common interview fail?",
      answer:
        "React re-renders when it sees a new value. Pushing onto an array or editing an object in place keeps the same reference, so the UI does not update. Create a new array or object with spread, map, or filter, and use the updater form when the next value depends on the previous one.",
    },
    {
      question: "How should I practice these five React interview topics?",
      answer:
        "Pick one timed exercise per topic: a counter or todo list, an effect with cleanup, a keyed list, a form with validation, and a fetch with loading and error. Talk through decisions out loud, then move on to Context, custom hooks, and performance.",
    },
  ],
  body: `Most React coding interviews test the same five things: how you update state, how you use effects, how you render lists, how you handle forms, and how you fetch data.

You don't need to know every API.

You need to get these five right under time pressure, and explain why while you type.

Each section below covers what interviewers look for, the mistake that costs candidates the most, and an exercise you can practice it on in the live editor.

## 1. State updates must be immutable

React re-renders only when it sees a new value. If you mutate an array or object in place, the reference stays the same and the UI doesn't update.

\`\`\`
// Wrong: mutates the existing array
todos.push(newTodo);
setTodos(todos);

// Right: creates a new array
setTodos([...todos, newTodo]);
\`\`\`

The same rule applies to removing and editing: use \`filter\` and \`map\`, which return new arrays.

The second thing interviewers check is the updater form. When the next value depends on the previous one, pass a function:

\`\`\`
setCount(c => c + 1);
\`\`\`

This matters when several updates run in one event, or inside timers and effects where \`count\` may be stale. Be ready to explain why \`setCount(count + 1)\` called twice only adds 1.

Practice: [Counter](/exercise/state-counter), [Todo list](/exercise/state-todo-list), and for a harder one, [Counter with undo and redo](/exercise/state-undo-redo).

For a deeper comparison of \`useState\`, \`useReducer\`, and \`useRef\`, see [which state hook to reach for](/blog/usestate-vs-usereducer-vs-useref).

## 2. useEffect needs correct dependencies and a cleanup

\`useEffect\` is for syncing with things outside React: timers, subscriptions, the document title, network requests. Interviewers watch for two things.

First, the dependency array. Every value from the component that the effect reads belongs in it. Leaving one out gives you stale values; leaving the array off entirely runs the effect after every render.

Second, cleanup. If the effect starts something, it must stop it:

\`\`\`
useEffect(() => {
  const id = setInterval(() => setSeconds(s => s - 1), 1000);
  return () => clearInterval(id);
}, []);
\`\`\`

Without the cleanup, the interval keeps running after the component unmounts, and React's Strict Mode will start two of them in development.

A good answer also knows when **not** to use an effect. A value you can compute from props or state during render doesn't need an effect and an extra state variable.

Practice: [Sync the document title](/exercise/effects-document-title), [Countdown timer](/exercise/effects-countdown), [Stopwatch with laps](/exercise/effects-stopwatch).

The [useEffect interview questions](/blog/useeffect-interview-questions) guide walks through deps, cleanup, and the "don't use an effect" cases in more detail.

## 3. Lists need stable, unique keys

Every item you render with \`map\` needs a key, and it should come from the data, usually an id.

\`\`\`
{users.map(user => (
  <li key={user.id}>{user.name}</li>
))}
\`\`\`

Using the array index as a key looks fine until the list is reordered, filtered or has items removed. Then React matches the wrong components to the wrong data, and input values or local state end up on the wrong row. Be ready to explain this: "why not the index?" is one of the most common follow-up questions.

Also expect to filter and sort a list. Derive the visible list during render from the original data and the current filter, instead of storing a second filtered copy in state that can go out of sync. And sort a copy (\`[...items].sort(...)\`), since \`sort\` mutates.

Practice: [Render a list of users](/exercise/lists-users), [Filterable list](/exercise/lists-filter), [Sortable table](/exercise/lists-sortable-table).

If this is the one soundbite you want muscle memory for, read [why index as key fails interviews](/blog/react-list-keys).

## 4. Forms: controlled inputs and onSubmit

In a controlled input, React state is the single source of truth: the input shows \`value\` from state and updates it in \`onChange\`.

\`\`\`
const [email, setEmail] = useState('');

<form onSubmit={e => {
  e.preventDefault();
  if (!email.includes('@')) return setError('Enter a valid email');
  submit(email);
}}>
  <input value={email} onChange={e => setEmail(e.target.value)} />
  <button type="submit">Sign up</button>
</form>
\`\`\`

The details interviewers notice:

- Handle \`onSubmit\` on the form, not \`onClick\` on the button, so pressing Enter works.
- Call \`e.preventDefault()\`, or the page reloads.
- Show validation errors next to the field, and decide when: on submit, on blur, or as the user types.
- For several fields, one state object updated by \`name\` is cleaner than five \`useState\` calls, but either is fine if you can explain the choice.

Practice: [Live greeting input](/exercise/forms-live-greeting), [Sign-up form with validation](/exercise/forms-signup), [Dynamic guest list](/exercise/forms-guest-list).

See [controlled vs uncontrolled components](/blog/controlled-vs-uncontrolled-components) if you want the follow-up that often comes after a form.

## 5. Data fetching: loading, error, and races

Almost every take-home and live round includes "fetch this and show it." A complete answer handles three states, not one:

\`\`\`
useEffect(() => {
  const controller = new AbortController();
  setLoading(true);
  setError(null);

  fetch(\`/api/users?q=\${query}\`, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return res.json();
    })
    .then(setUsers)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    })
    .finally(() => setLoading(false));

  return () => controller.abort();
}, [query]);
\`\`\`

What this gets right:

- Loading and error are shown in the UI, not just logged.
- \`fetch\` doesn't reject on a 404 or 500, so the code checks \`res.ok\`.
- The cleanup aborts the old request when \`query\` changes. Without it, a slow earlier response can arrive last and overwrite the newer results. That race is a favorite senior-level question.

It's fine to say that in production you'd use a library such as TanStack Query. Interviewers still want to see that you can write it by hand.

Practice: [Fetch with loading and error states](/exercise/fetch-users), [Paginated posts](/exercise/fetch-pagination), [Search with request cancellation](/exercise/fetch-search-abort).

The longer [data fetching interview](/blog/react-data-fetching-interview) write-up covers pagination and abort in more depth.

## How to practice

Reading about these five won't make them automatic. Writing them will. Pick one exercise per topic above, set a 20-minute timer, and talk through your decisions out loud as you code, the way you would with an interviewer.

On React Interviewer, each exercise runs in a live editor with a preview next to it. When you submit, you get feedback on every requirement and a minimal fix you can apply to your own code.

Once these five feel easy, move on to [Context](/blog/react-context-api-interview), [custom hooks](/blog/custom-hooks-interview-questions) and [performance](/blog/react-memo-usememo-usecallback), which come up more in mid-level and senior rounds.

If you want a week-by-week plan instead of a checklist, use [How to prepare for a React coding interview](/blog/react-coding-interview-prep).
`,
};
