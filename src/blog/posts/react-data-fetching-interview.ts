import type { Article } from "../types";

export const post: Article = {
  slug: "react-data-fetching-interview",
  title: "Data fetching in React interviews: loading, errors, and race conditions",
  description:
    "How to fetch data in React interview exercises: useEffect, loading and error UI, pagination, retries, and AbortController for races.",
  date: "2026-10-04",
  tags: ["data fetching", "AbortController", "useEffect"],
  relatedExercises: ["fetch-users", "fetch-pagination", "fetch-search-abort"],
  body: `A data-fetching exercise is where interviews stop being "make a counter" and start looking like a real screen. You will be judged on **states**, not on whether \`fetch\` resolved.

The four states to name out loud: empty, loading, success, error. If the query can change, add a fifth: **stale in-flight request**.

## Fetch on mount

The baseline prompt: load a list when the component mounts, show \`Loading…\`, show an error with Retry.

\`\`\`
useEffect(() => {
  let cancelled = false;

  async function load() {
    setStatus("loading");
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (!cancelled) setUsers(data);
    } catch {
      if (!cancelled) setStatus("error");
    }
  }

  load();
  return () => {
    cancelled = true;
  };
}, []);
\`\`\`

A cancelled flag (or \`AbortController\`) avoids setting state after unmount. Retry simply runs the same load path again.

Do this in [fetch users](/exercise/fetch-users) until it is boring.

## Pagination

Keep \`page\` in state. The effect depends on \`page\`. Previous is disabled on page 1, Next on the last page, and the heading reads \`Page N of M\` from the response.

Pitfalls:

- Forgetting \`page\` in the dependency array (stale page).
- Allowing clicks past the bounds.
- Leaving the old list visible without a loading signal, or flashing empty so hard it looks broken. Either "show old data plus a spinner" or "replace with Loading" is fine if you are consistent. The [pagination](/exercise/fetch-pagination) exercise spells out which one it wants.

## Search and races

This is the senior-flavored variant. Each keystroke changes \`q\`. Request 1 for \`"re"\` is slow; request 2 for \`"react"\` is fast. If you ignore ordering, \`"re"\` can win and the list is wrong.

The expected tool is \`AbortController\` in the effect cleanup:

- Create a controller per run.
- Pass \`signal\` to \`fetch\`.
- Abort in cleanup.
- Do not treat abort as a user-facing error.

Also: do not fetch for an empty query. Show "No results" for an empty array, and a real error only for failed requests.

That is exactly [search with abort](/exercise/fetch-search-abort). Combine it with [useDebounce](/exercise/hooks-use-debounce) in conversation even if the prompt does not require it: you would debounce before fetching in production.

## Where this sits vs modern React

If they ask "would you still useEffect fetch in an app?", a strong 2026 answer is:

- In a **coding interview sandbox**, yes: \`useEffect\` + local state is the contract.
- In a **Next.js App Router** app, you might fetch in a Server Component, or use a cache library.
- You still need loading, error, and cancellation *somewhere*.

Do not dodge the exercise because "TanStack Query would do this." Implement the states, then mention the library.

## Checklist before you submit

- Loading is visible.
- Failure is visible and retryable if asked.
- Success renders a list with **stable keys**.
- Changing the query or page cannot apply an older response.
- Cleanup aborts or ignores.

Work the three fetching exercises in order: [users](/exercise/fetch-users), [pagination](/exercise/fetch-pagination), [abortable search](/exercise/fetch-search-abort).
`,
};
