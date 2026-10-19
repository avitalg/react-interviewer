import type { Article } from "../types";

export const post: Article = {
  slug: "react-useeffect-cleanup-function",
  title: "useEffect Cleanup Function in React: Guide + Examples",
  headline: "React useEffect Cleanup Function: When, Why, and How to Use It",
  description:
    "Learn how the useEffect cleanup function works in React, with examples for timers, event listeners, fetch requests, and subscriptions. Avoid memory leaks.",
  date: "2026-10-19",
  tags: ["useEffect cleanup function", "useEffect", "hooks", "React 19"],
  relatedExercises: [
    "effects-countdown",
    "effects-stopwatch",
    "fetch-search-abort",
    "hooks-use-hover",
    "refs-dropdown-outside-click",
  ],
  faq: [
    {
      question: "Is the cleanup function required in useEffect?",
      answer:
        "No. Return a cleanup function only when the effect starts something that must be stopped: a timer, a listener, a fetch, or a subscription. Effects that only write a value (like document.title) usually need no cleanup.",
    },
    {
      question: "Can the cleanup function be async?",
      answer:
        "No. React calls the function you return and does not await it. Returning an async function returns a Promise, which is not a valid cleanup. Keep cleanup synchronous, and cancel in-flight work with AbortController or an ignore flag.",
    },
    {
      question: "Does cleanup run on every render?",
      answer:
        "No. Cleanup runs before the effect re-runs (when a dependency changes) and when the component unmounts. If the dependency array is empty, cleanup runs only on unmount. If you omit the array, the effect and its cleanup run after every render.",
    },
    {
      question: "What's the difference between cleanup in useEffect and componentWillUnmount?",
      answer:
        "componentWillUnmount ran once, when the class component left the tree. The useEffect cleanup function also runs before the next effect, whenever dependencies change. Think of it as undoing the previous effect, not only as an unmount destructor.",
    },
    {
      question: "How do I cancel a fetch in useEffect?",
      answer:
        "Create an AbortController in the effect, pass controller.signal to fetch, and call controller.abort() in the cleanup function. Ignore AbortError in the catch so a cancelled request does not look like a failure.",
    },
  ],
  body: `The **useEffect cleanup function** is the function you return from inside \`useEffect\`. React runs it before the effect re-runs and when the component unmounts. Use it to cancel timers, remove event listeners, abort fetch requests, and close subscriptions so they cannot leak or update unmounted state.

\`\`\`jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // useEffect return function
}, []);
\`\`\`

That return is the whole API. The rest of this guide is when it runs, why you need it, and copy-paste examples for the cases people search for: \`clearInterval\`, \`removeEventListener\`, abort fetch, and subscriptions. Examples were tested on **React 19**.

## What Is the useEffect Cleanup Function?

\`useEffect\` takes a setup function. If that setup starts something React does not own, return a function that stops it:

\`\`\`jsx
useEffect(() => {
  // setup: start the side effect
  const id = setTimeout(() => console.log("done"), 1000);

  return () => {
    // cleanup: undo the setup
    clearTimeout(id);
  };
}, [delay]);
\`\`\`

The **useEffect return function** is optional. Skip it when there is nothing to undo — writing \`document.title\` is the usual example. Return it when setup creates a timer, a listener, a request, or a connection. The [React docs on synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) call this pair *setup* and *cleanup*.

## When Does the useEffect Cleanup Function Run?

React runs cleanup in two situations:

1. **Before the effect re-runs**, whenever a value in the dependency array changes.
2. **When the component unmounts**, so the last setup is undone.

It does **not** run on every render unless you omitted the dependency array.

![useEffect cleanup function lifecycle diagram](/blog/useeffect-cleanup-lifecycle.svg)

Read the timeline as: mount → effect → deps change → cleanup → effect → unmount → cleanup. If \`delay\` goes from \`1000\` to \`500\`, React clears the old interval first, then starts a new one. That is why a [countdown](/exercise/effects-countdown) can change speed without stacking timers.

In development, [React Strict Mode](https://react.dev/reference/react/StrictMode) also runs an extra setup → cleanup → setup cycle after mount. That is covered below.

## Why Do You Need Cleanup? (Memory Leaks and Bugs)

Without a cleanup function, the previous effect keeps running after it is no longer relevant. That shows up as four bugs:

- **Memory leaks.** A \`setInterval\` or WebSocket outlives the component.
- **Stale state updates.** A fetch or timeout calls \`setState\` after unmount, or after the user already moved on.
- **Duplicate listeners.** Each re-run of the effect adds another \`window.addEventListener\` and never removes the last one.
- **Race conditions.** Request A starts, the query changes, request B starts, then A finishes last and overwrites B.

If you can see the leak in React DevTools or a "Can't perform a React state update on an unmounted component" warning, the fix is almost always a missing or incomplete cleanup. Many of these effects should not exist at all — see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) before you add one.

## useEffect Cleanup Examples

Each example has a wrong version and a right version. Copy the right one.

### Clearing a timer (setInterval / setTimeout)

A timer that is not cleared keeps firing after unmount. In development, missing \`clearInterval\` in useEffect looks like the counter jumps by two.

\`\`\`jsx
// ❌ Wrong — every mount (and Strict Mode remount) stacks another interval
useEffect(() => {
  setInterval(() => setCount((n) => n + 1), 1000);
}, []);
\`\`\`

\`\`\`jsx
// ✅ Correct
useEffect(() => {
  const id = setInterval(() => setCount((n) => n + 1), 1000);
  return () => clearInterval(id);
}, []);
\`\`\`

Put \`delay\` in the dependency array if it can change. Cleanup clears the old id; the next effect starts a new timer. Practice this on the [countdown](/exercise/effects-countdown) and the [stopwatch](/exercise/effects-stopwatch).

### Removing event listeners (window.addEventListener)

\`addEventListener\` does not replace the previous listener. You have to pass the **same function reference** to \`removeEventListener\`.

\`\`\`jsx
// ❌ Wrong — a new listener every time handler changes; never removed
useEffect(() => {
  window.addEventListener("keydown", handler);
}, [handler]);
\`\`\`

\`\`\`jsx
// ✅ Correct
useEffect(() => {
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [handler]);
\`\`\`

If you wrap the listener in an inner function, store that same function and remove *it*, not a freshly created arrow. See [addEventListener on MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener). The [outside-click dropdown](/exercise/refs-dropdown-outside-click) and [useHover](/exercise/hooks-use-hover) exercises both require this cleanup.

### Aborting a fetch request with AbortController

To abort fetch in useEffect, create an [\`AbortController\`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) in the effect, pass \`signal\`, and abort in cleanup. Ignore \`AbortError\` so cancelled requests do not look like failures.

\`\`\`jsx
// ❌ Wrong — a slow first response can overwrite a newer one
useEffect(() => {
  fetch("/api/search?q=" + query)
    .then((res) => res.json())
    .then(setResults);
}, [query]);
\`\`\`

\`\`\`jsx
// ✅ Correct
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/search?q=" + query, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    })
    .then(setResults)
    .catch((error) => {
      if (error.name !== "AbortError") setError(error);
    });

  return () => controller.abort();
}, [query]);
\`\`\`

Run this live in [search with request cancellation](/exercise/fetch-search-abort). For the interview model around loading, errors, and races, see [data fetching in interviews](/blog/react-data-fetching-interview).

### Unsubscribing from WebSockets and subscriptions

Treat connect/disconnect as a pair. Cleanup should leave the system as if the effect never ran.

\`\`\`jsx
// ❌ Wrong — the socket stays open after unmount
useEffect(() => {
  const socket = new WebSocket(url);
  socket.onmessage = (event) => setMessage(event.data);
}, [url]);
\`\`\`

\`\`\`jsx
// ✅ Correct
useEffect(() => {
  const socket = new WebSocket(url);
  socket.onmessage = (event) => setMessage(event.data);
  return () => socket.close();
}, [url]);
\`\`\`

The same shape applies to \`store.subscribe\`, Firebase listeners, and \`IntersectionObserver\`: subscribe in setup, unsubscribe in the return function.

### Ignoring stale responses (the ignore flag pattern for race conditions)

If you cannot abort, flip a flag in cleanup so a late response is ignored. This is the other standard way to clean up a useEffect fetch.

\`\`\`jsx
// ❌ Wrong — older responses still call setUser
useEffect(() => {
  fetch("/api/users/" + userId)
    .then((res) => res.json())
    .then(setUser);
}, [userId]);
\`\`\`

\`\`\`jsx
// ✅ Correct
useEffect(() => {
  let ignore = false;

  fetch("/api/users/" + userId)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) setUser(data);
    });

  return () => {
    ignore = true;
  };
}, [userId]);
\`\`\`

Abort is better when you want to stop the network work. The ignore flag is enough when you only need to ignore stale state updates. [useFetch](/exercise/hooks-use-fetch) expects this pattern.

## Why Does My Cleanup Run Twice? (React Strict Mode)

If your cleanup **runs twice** in development, that is usually React Strict Mode, not a bug in your return function.

In development, Strict Mode mounts the component, runs the effect, immediately runs cleanup, then runs the effect again. The extra cycle is a stress test: if cleanup mirrors setup, the user sees no difference between one run and setup → cleanup → setup. In production you get a single setup.

That is why a missing \`clearInterval\` looks like the counter increments twice in dev, and why a fetch without abort shows two requests. Do not disable Strict Mode to hide it. Implement cleanup so the double invoke is a no-op. The same extra cycle exists for React 19 [ref callback cleanups](https://react.dev/reference/react-dom/components/common#ref-callback).

For the interview version of this question — deps, loops, and Strict Mode — read [useEffect interview questions](/blog/useeffect-interview-questions).

## Common Mistakes with useEffect Cleanup

**Returning a non-function.** Cleanup must be a function. Returning a Promise, a timer id, or nothing useful means React has nothing to call.

**Making the effect callback itself async.** \`useEffect(async () => { ... })\` returns a Promise. React then warns that your effect returned a non-function. Keep the effect sync and put \`async\` work in an inner function, or use \`then\`.

\`\`\`jsx
// ❌ Wrong — the effect returns a Promise
useEffect(async () => {
  const data = await fetch(url).then((res) => res.json());
  setData(data);
}, [url]);

// ✅ Correct
useEffect(() => {
  let ignore = false;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) setData(data);
    });
  return () => {
    ignore = true;
  };
}, [url]);
\`\`\`

**Missing dependencies.** If the effect reads \`query\` but the array is \`[]\`, cleanup and setup close over a stale \`query\`. List every reactive value the effect reads. That is the same rule as in [useEffect interview questions](/blog/useeffect-interview-questions).

**Forgetting the same function reference in \`removeEventListener\`.** \`removeEventListener("keydown", (e) => ...)\` can never match the listener you added. Save the function, add it, remove it.

## useEffect Cleanup vs. Ref Callback Cleanup (React 19)

React 19 lets a **ref callback** return a cleanup function, the same idea as the useEffect cleanup function but tied to a DOM node instead of a dependency list.

\`\`\`jsx
<div
  ref={(node) => {
    if (!node) return;
    const onClick = () => console.log(node.tagName);
    node.addEventListener("click", onClick);
    return () => node.removeEventListener("click", onClick);
  }}
/>
\`\`\`

When the node attaches, React calls the callback with the element. When it detaches, React runs the returned cleanup. If you skip the return, React still calls the callback with \`null\` for backward compatibility — that path goes away in a future version, so return a function.

Use ref-callback cleanup when the work is "this node exists / this node is gone." Use the useEffect cleanup function when the work depends on reactive values (\`url\`, \`query\`, \`delay\`). Details are in the [ref callback docs](https://react.dev/reference/react-dom/components/common#ref-callback).

## Cleanup in Custom Hooks

Package the pattern once so every caller gets the return function for free. This is the usual shape for \`useEventListener\` or \`useInterval\`, and it is what interviewers want in a [custom hook](/blog/custom-hooks-interview-questions).

\`\`\`jsx
import { useEffect } from "react";

export function useEventListener(eventName, handler) {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, handler]);
}

export function useInterval(callback, delay) {
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}
\`\`\`

Keep \`handler\` / \`callback\` stable with \`useCallback\`, or the effect will tear down and set up on every render. [useHover](/exercise/hooks-use-hover) is the same idea: attach \`mouseenter\` / \`mouseleave\` on \`ref.current\`, remove them in cleanup.

## FAQ

**Is the cleanup function required in useEffect?** No. Return one only when setup starts something you must stop. Writing \`document.title\` does not need cleanup.

**Can the cleanup function be async?** No. React does not await it. Returning \`async () => {}\` gives React a Promise. Cancel with \`AbortController\` or an ignore flag instead.

**Does cleanup run on every render?** No. It runs before the next effect (when deps change) and on unmount. Omit the dependency array and it will run after every render — that is usually a mistake.

**What's the difference between cleanup in useEffect and componentWillUnmount?** Class \`componentWillUnmount\` ran once. The useEffect cleanup function also runs before the effect re-runs. It undoes the *previous effect*, not only the whole component.

**How do I cancel a fetch in useEffect?** \`const controller = new AbortController()\`, pass \`{ signal: controller.signal }\`, and \`return () => controller.abort()\`. Ignore \`AbortError\`.

## Conclusion and quick-reference cheat sheet

Return a function from \`useEffect\` whenever setup creates work React cannot see. React will call that **useEffect cleanup function** before the next run and on unmount. If cleanup "runs twice," check Strict Mode before you rewrite the effect.

| Side effect | Cleanup method |
| --- | --- |
| \`setInterval\` / \`setTimeout\` | \`clearInterval(id)\` / \`clearTimeout(id)\` |
| \`addEventListener\` | \`removeEventListener\` with the same function |
| \`fetch\` | \`AbortController.abort()\` or an ignore flag |
| WebSocket / store.subscribe | \`socket.close()\` / \`unsubscribe()\` |
| \`IntersectionObserver\` | \`observer.disconnect()\` |

Last updated October 19, 2026. Written by [React Interviewer](/) for React 19. For more on when *not* to reach for an effect, start with [10 React concepts](/blog/10-react-concepts) and the official [synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) guide.
`,
};