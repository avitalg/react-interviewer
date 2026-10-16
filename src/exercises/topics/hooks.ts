import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const hooksExercises: Exercise[] = [
  {
    id: "hooks-use-toggle",
    topic: "hooks",
    title: "useToggle",
    difficulty: "Easy",
    solutionExplanation: `\`useToggle\` is \`useState\` plus a \`toggle\` wrapped in \`useCallback\` so its identity stays stable. Pass a boolean to set it explicitly; any other argument (like a click event) just flips the value. Each caller gets its own state.`,
    description: `Write a reusable \`useToggle\` hook for boolean state: open/closed, shown/hidden, on/off.

The returned \`toggle\` function is often passed to child components or effects, so its identity should be **stable** across renders.`,
    requirements: [
      { id: "basic", text: "Export `useToggle(initialValue = false)` returning `[value, toggle]`. Calling `toggle()` flips the value." },
      { id: "explicit", text: "`toggle(true)` / `toggle(false)` set the value explicitly. Any non-boolean argument (like a click event) just flips it." },
      { id: "stable", text: "`toggle` keeps the same identity between renders (`useCallback`)." },
      { id: "app", text: "`App` uses it for a **Show details** button that reveals `Here are the details.` and then reads **Hide details**." },
    ],
    starterCode: `import { useState } from 'react';

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(!value);
  return [value, toggle];
}

export default function App() {
  const [open, toggle] = useToggle();

  return (
    <div>
      <button onClick={toggle}>Show details</button>
      {open && <p>Here are the details.</p>}
    </div>
  );
}
`,
    referenceSolution: `import { useCallback, useState } from 'react';

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback((next) => {
    setValue((current) => (typeof next === 'boolean' ? next : !current));
  }, []);
  return [value, toggle];
}

export default function App() {
  const [open, toggle] = useToggle();

  return (
    <div>
      <button onClick={toggle}>{open ? 'Hide details' : 'Show details'}</button>
      {open && <p>Here are the details.</p>}
    </div>
  );
}
`,
    checks: [
      {
        id: "basic",
        requirementId: "basic",
        label: "toggle() flips the value",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.useToggle === "function", "Export a `useToggle` hook.");
          const hook = await t.renderHook<[boolean, (next?: unknown) => void]>(() => t.exports.useToggle());
          t.expect(hook.result.current[0], "Default value").toBe(false);
          await t.act(() => hook.result.current[1]());
          t.expect(hook.result.current[0], "After toggle()").toBe(true);
          await t.act(() => hook.result.current[1]());
          t.expect(hook.result.current[0], "After a second toggle()").toBe(false);
          const initial = await t.renderHook<[boolean, unknown]>(() => t.exports.useToggle(true));
          t.expect(initial.result.current[0], "useToggle(true) initial value").toBe(true);
        },
      },
      {
        id: "explicit",
        requirementId: "explicit",
        label: "toggle(true/false) sets the value",
        kind: "runtime",
        async run(t: TestApi) {
          const hook = await t.renderHook<[boolean, (next?: unknown) => void]>(() => t.exports.useToggle());
          await t.act(() => hook.result.current[1](true));
          t.expect(hook.result.current[0], "After toggle(true)").toBe(true);
          await t.act(() => hook.result.current[1](true));
          t.expect(hook.result.current[0], "After toggle(true) again").toBe(true);
          await t.act(() => hook.result.current[1](false));
          t.expect(hook.result.current[0], "After toggle(false)").toBe(false);
          await t.act(() => hook.result.current[1]({ type: "click" }));
          t.expect(hook.result.current[0], "After toggle(event)").toBe(true);
        },
      },
      {
        id: "stable",
        requirementId: "stable",
        label: "toggle has a stable identity",
        kind: "runtime",
        async run(t: TestApi) {
          const hook = await t.renderHook<[boolean, () => void]>(() => t.exports.useToggle());
          const first = hook.result.current[1];
          await t.act(() => hook.result.current[1]());
          t.assert(hook.result.current[1] === first, "`toggle` changed identity after a re-render. Wrap it in useCallback.");
        },
      },
      {
        id: "app",
        requirementId: "app",
        label: "Show/Hide details works",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByText("Here are the details."), "Details should be hidden initially.");
          await t.click(t.screen.getByRole("button", { name: "Show details" }));
          t.assert(t.screen.queryByText("Here are the details."), 'Clicking "Show details" should reveal the details.');
          const hide = t.screen.queryByRole("button", { name: "Hide details" });
          t.assert(hide, 'Once open, the button should read "Hide details".');
          await t.click(hide);
          t.assert(!t.screen.queryByText("Here are the details."), 'Clicking "Hide details" should hide them again.');
        },
      },
    ],
  },
  {
    id: "hooks-use-hover",
    topic: "hooks",
    title: "useHover",
    difficulty: "Easy",
    solutionExplanation: `Return a ref and a boolean. After mount, attach \`mouseenter\` / \`mouseleave\` to \`ref.current\` and flip the boolean. The effect cleanup must remove those listeners so they don't leak after unmount.`,
    description: `Write \`useHover\`: it tells you whether the mouse is over a DOM node. Attach listeners to the node the caller points at with a ref — don't put \`onMouseEnter\` in the hook itself.`,
    requirements: [
      { id: "api", text: "Export `useHover()` returning `[ref, hovered]`. `hovered` starts `false`." },
      { id: "listen", text: "When `ref` is set on a node, `mouseenter` sets `hovered` to `true` and `mouseleave` sets it to `false`. Remove the listeners on unmount." },
      { id: "app", text: "`App` puts the ref on a `Hover me` box (`data-testid=\"pad\"`) and shows `Inside` or `Outside` in `data-testid=\"status\"`." },
    ],
    starterCode: `import { useRef, useState } from 'react';

export function useHover() {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  // TODO: listen for mouseenter / mouseleave on ref.current
  return [ref, hovered];
}

export default function App() {
  const [ref, hovered] = useHover();

  return (
    <div>
      <p data-testid="status">{hovered ? 'Inside' : 'Outside'}</p>
      <div ref={ref} data-testid="pad">
        Hover me
      </div>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useRef, useState } from 'react';

export function useHover() {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    return () => {
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
    };
  }, []);

  return [ref, hovered];
}

export default function App() {
  const [ref, hovered] = useHover();

  return (
    <div>
      <p data-testid="status">{hovered ? 'Inside' : 'Outside'}</p>
      <div ref={ref} data-testid="pad">
        Hover me
      </div>
    </div>
  );
}
`,
    checks: [
      {
        id: "api",
        requirementId: "api",
        label: "useHover returns [ref, false] at first",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.useHover === "function", "Export a `useHover` hook.");
          const hook = await t.renderHook<[ { current: unknown }, boolean ]>(() => t.exports.useHover());
          t.assert(hook.result.current[0] && "current" in hook.result.current[0], "The first value should be a ref (`{ current }`).");
          t.expect(hook.result.current[1], "hovered before the pointer enters").toBe(false);
        },
      },
      {
        id: "listen",
        requirementId: "listen",
        label: "mouseenter / mouseleave update hovered",
        kind: "runtime",
        async run(t: TestApi) {
          const React = t.React as { createElement: (...args: unknown[]) => unknown };
          const { MouseEvent } = t.window as unknown as typeof globalThis;
          function Probe() {
            const [ref, hovered] = t.exports.useHover();
            return React.createElement("div", { ref, "data-testid": "target" }, hovered ? "yes" : "no");
          }
          await t.render(Probe);
          const node = t.screen.getByTestId("target");
          t.expect(node.textContent, "Before enter").toBe("no");
          await t.act(() => {
            node.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false, view: t.window }));
          });
          t.expect(node.textContent, "After mouseenter").toBe("yes");
          await t.act(() => {
            node.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false, view: t.window }));
          });
          t.expect(node.textContent, "After mouseleave").toBe("no");
        },
      },
      {
        id: "app",
        requirementId: "app",
        label: "The Hover me box reports Inside / Outside",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("status").textContent?.trim(), "Status").toBe("Outside");
          const pad = t.screen.getByTestId("pad");
          t.assert(pad.textContent?.includes("Hover me"), 'The pad should say "Hover me".');
          const { MouseEvent } = t.window as unknown as typeof globalThis;
          await t.act(() => {
            pad.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false, view: t.window }));
          });
          t.expect(t.screen.getByTestId("status").textContent?.trim(), "Status while hovered").toBe("Inside");
          await t.act(() => {
            pad.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false, view: t.window }));
          });
          t.expect(t.screen.getByTestId("status").textContent?.trim(), "Status after leave").toBe("Outside");
        },
      },
      { id: "has-cleanup", requirementId: "listen", label: "The listener effect cleans up", kind: "static", rule: { rule: "effectHasCleanup" } },
    ],
  },
  {
    id: "hooks-use-local-storage",
    topic: "hooks",
    title: "useLocalStorage",
    difficulty: "Medium",
    solutionExplanation: `Initialize state from \`JSON.parse(localStorage.getItem(...))\`, and fall back to the default if the value is missing or corrupt. Write back in an effect whenever the value changes so a reload restores it.`,

    description: `Write a \`useLocalStorage(key, initialValue)\` hook that works like \`useState\` but persists the value in \`localStorage\` as JSON.

Read storage only once (pass a function to \`useState\` for lazy initialization), and don't crash on corrupt data.`,
    requirements: [
      { id: "read", text: "Export `useLocalStorage(key, initialValue)`. It starts from the JSON stored under `key`, or `initialValue` if nothing is stored." },
      { id: "write", text: "Setting a value updates state and writes `JSON.stringify(value)` to `localStorage`. Updater functions (`set(n => n + 1)`) work too." },
      { id: "corrupt", text: "Invalid JSON in storage falls back to `initialValue` instead of throwing." },
      { id: "app", text: "`App` stores the input labelled `Name` under the key `name`, so it survives a remount." },
    ],
    starterCode: `import { useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  // TODO: read from and write to localStorage
  return [value, setValue];
}

export default function App() {
  const [name, setName] = useLocalStorage('name', '');

  return (
    <label>
      Name <input value={name} onChange={(e) => setName(e.target.value)} />
    </label>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or disabled; keep working in memory.
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [name, setName] = useLocalStorage('name', '');

  return (
    <label>
      Name <input value={name} onChange={(e) => setName(e.target.value)} />
    </label>
  );
}
`,
    checks: [
      {
        id: "read",
        requirementId: "read",
        label: "Reads the stored value",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.useLocalStorage === "function", "Export a `useLocalStorage` hook.");
          t.localStorage.setItem("count", "5");
          const stored = await t.renderHook<[unknown, unknown]>(() => t.exports.useLocalStorage("count", 0));
          t.expect(stored.result.current[0], 'With "5" stored under "count"').toBe(5);
          const fresh = await t.renderHook<[unknown, unknown]>(() => t.exports.useLocalStorage("missing", "default"));
          t.expect(fresh.result.current[0], "With nothing stored").toBe("default");
        },
      },
      {
        id: "write",
        requirementId: "write",
        label: "Writes JSON on change, supports updaters",
        kind: "runtime",
        async run(t: TestApi) {
          const user = await t.renderHook<[{ name: string }, (v: unknown) => void]>(() => t.exports.useLocalStorage("user", { name: "Ada" }));
          await t.act(() => user.result.current[1]({ name: "Grace" }));
          t.expect(user.result.current[0], "State after setting").toEqual({ name: "Grace" });
          t.expect(t.localStorage.getItem("user"), 'localStorage "user"').toBe('{"name":"Grace"}');
          const counter = await t.renderHook<[number, (v: unknown) => void]>(() => t.exports.useLocalStorage("n", 1));
          await t.act(() => counter.result.current[1]((n: number) => n + 1));
          await t.act(() => counter.result.current[1]((n: number) => n + 1));
          t.expect(counter.result.current[0], "After two updater calls").toBe(3);
          t.expect(t.localStorage.getItem("n"), 'localStorage "n"').toBe("3");
        },
      },
      {
        id: "corrupt",
        requirementId: "corrupt",
        label: "Survives invalid JSON",
        kind: "runtime",
        async run(t: TestApi) {
          t.localStorage.setItem("broken", "{oops");
          const hook = await t.renderHook<[unknown, unknown]>(() => t.exports.useLocalStorage("broken", "fallback"));
          t.expect(hook.result.current[0], "Value when the stored JSON is invalid").toBe("fallback");
        },
      },
      {
        id: "app",
        requirementId: "app",
        label: "The Name input persists",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByLabelText("Name"), "Ada");
          t.expect(t.localStorage.getItem("name"), 'localStorage "name"').toBe('"Ada"');
          await t.unmount();
          await t.render();
          t.expect((t.screen.getByLabelText("Name") as HTMLInputElement).value, "Input value after remounting").toBe("Ada");
        },
      },
    ],
  },
  {
    id: "hooks-use-fetch",
    topic: "hooks",
    title: "useFetch",
    difficulty: "Medium",
    solutionExplanation: `Fetch inside an effect that depends on \`url\`. Track \`data\`, \`loading\`, and \`error\`, and set an \`ignore\` flag in the cleanup so a slow response cannot overwrite a newer request or land after unmount. \`fetch\` does not throw on 404/500 — check \`response.ok\`.`,
    description: `Extract data fetching into \`useFetch(url)\` so any component can load JSON with loading and error states.

The starter fetches once and never ignores stale responses, so a slow first request can overwrite a later one.`,
    requirements: [
      { id: "data", text: "Export `useFetch(url)` returning `{ data, loading, error }`. It fetches `url`, reads JSON into `data`, and sets `loading` to `true` while the request is in flight." },
      { id: "error", text: "If the response is not OK or `fetch` rejects, set `error` and stop loading. Don't keep the previous `data`." },
      { id: "stale", text: "If `url` changes or the component unmounts, ignore the previous response." },
      { id: "app", text: "`App` calls `useFetch('/api/user')` and shows the user's `name`, or `Loading…` / `Failed`." },
    ],
    mockApi: (url) => {
      if (url.pathname !== "/api/user") return { status: 404, body: { error: "Not found" } };
      return { delay: 200, body: { name: "Ada Lovelace" } };
    },
    starterCode: `import { useEffect, useState } from 'react';

export function useFetch(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then(setData);
  }, []);

  return { data, loading: false, error: null };
}

export default function App() {
  const { data } = useFetch('/api/user');
  return <p>{data ? data.name : '…'}</p>;
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((json) => {
        if (ignore) return;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err);
        setData(null);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [url]);

  return { data, loading, error };
}

export default function App() {
  const { data, loading, error } = useFetch('/api/user');
  if (loading) return <p>Loading…</p>;
  if (error) return <p>Failed</p>;
  return <p>{data.name}</p>;
}
`,
    checks: [
      {
        id: "data",
        requirementId: "data",
        label: "Fetches JSON and reports loading",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.useFetch === "function", "Export a `useFetch` hook.");
          t.mockFetch(() => ({ delay: 40, body: { name: "Ada" } }));
          const hook = await t.renderHook<{ data: { name: string } | null; loading: boolean; error: unknown }>(
            (url) => t.exports.useFetch(url),
            "/api/user",
          );
          t.expect(hook.result.current.loading, "loading just after mount").toBe(true);
          t.expect(hook.result.current.data, "data just after mount").toBe(null);
          await t.waitFor(() => t.expect(hook.result.current.data, "data after the response").toEqual({ name: "Ada" }));
          t.expect(hook.result.current.loading, "loading after the response").toBe(false);
          t.expect(t.fetchCalls.map((call) => call.url), "Requests").toEqual(["/api/user"]);
        },
      },
      {
        id: "error",
        requirementId: "error",
        label: "Non-OK responses set error",
        kind: "runtime",
        async run(t: TestApi) {
          t.mockFetch(() => ({ status: 500, body: { error: "nope" } }));
          const hook = await t.renderHook<{ data: unknown; loading: boolean; error: unknown }>(
            (url) => t.exports.useFetch(url),
            "/api/user",
          );
          await t.waitFor(() => t.assert(hook.result.current.error, "error should be set after a 500"));
          t.expect(hook.result.current.loading, "loading after the error").toBe(false);
          t.expect(hook.result.current.data, "data after the error").toBe(null);
        },
      },
      {
        id: "stale",
        requirementId: "stale",
        label: "Ignores a slower previous request",
        kind: "runtime",
        async run(t: TestApi) {
          t.mockFetch((url) =>
            url.pathname === "/slow" ? { delay: 80, body: { id: "slow" } } : { delay: 10, body: { id: "fast" } },
          );
          const hook = await t.renderHook<{ data: { id: string } | null; loading: boolean; error: unknown }>(
            (url) => t.exports.useFetch(url),
            "/slow",
          );
          await hook.rerender("/fast");
          await t.waitFor(() => t.expect(hook.result.current.data?.id, "data after switching url").toBe("fast"));
          await t.sleep(100);
          t.expect(hook.result.current.data?.id, "data after the slow response arrives").toBe("fast");
        },
      },
      {
        id: "app",
        requirementId: "app",
        label: "App shows the user, loading, or Failed",
        kind: "runtime",
        async run(t: TestApi) {
          t.mockFetch(() => ({ delay: 30, body: { name: "Ada Lovelace" } }));
          await t.render();
          t.assert(t.screen.queryByText(/Loading/), 'Show "Loading…" while fetching.');
          await t.waitFor(() => t.assert(t.screen.queryByText("Ada Lovelace"), "Show the user's name once loaded."));
          t.assert(!t.screen.queryByText(/Loading/), "Hide the loading state after success.");
        },
      },
    ],
  },
  {
    id: "hooks-use-debounce",
    topic: "hooks",
    title: "useDebounce",
    difficulty: "Hard",
    solutionExplanation: `Keep a delayed copy of the value in state. An effect starts a timeout to update it, and the cleanup clears that timeout — so each keystroke resets the timer and only the last value after a pause is published.`,

    description: `Write \`useDebounce(value, delay)\`: it returns \`value\` only after it has stopped changing for \`delay\` milliseconds. It's the standard way to avoid filtering or fetching on every keystroke.

Each change should cancel the pending timer and start a new one.`,
    requirements: [
      { id: "debounce", text: "Export `useDebounce(value, delay)`. It returns the initial value right away, then each new value only after `delay` ms without changes." },
      { id: "reset", text: "A change before the delay is over restarts the timer." },
      { id: "cleanup", text: "Clear the pending timeout in the effect cleanup, so nothing fires after unmount." },
      { id: "app", text: "`App` debounces the `Search` input by 300ms, shows the debounced value in `data-testid=\"debounced\"`, and filters the languages list with it." },
    ],
    starterCode: `import { useState } from 'react';

const languages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Ruby', 'Kotlin', 'Swift'];

export function useDebounce(value, delay) {
  // TODO: only update after \`delay\` ms without changes
  return value;
}

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const results = languages.filter((lang) => lang.toLowerCase().includes(debouncedQuery.toLowerCase()));

  return (
    <div>
      <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Searching for: <span data-testid="debounced">{debouncedQuery}</span></p>
      <ul>
        {results.map((lang) => (
          <li key={lang}>{lang}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

const languages = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Ruby', 'Kotlin', 'Swift'];

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const results = languages.filter((lang) => lang.toLowerCase().includes(debouncedQuery.toLowerCase()));

  return (
    <div>
      <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Searching for: <span data-testid="debounced">{debouncedQuery}</span></p>
      <ul>
        {results.map((lang) => (
          <li key={lang}>{lang}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    checks: [
      {
        id: "debounce",
        requirementId: "debounce",
        label: "Updates only after the delay",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.useDebounce === "function", "Export a `useDebounce` hook.");
          t.useFakeTimers();
          const hook = await t.renderHook<string>((value) => t.exports.useDebounce(value, 300), "a");
          t.expect(hook.result.current, "Initial value").toBe("a");
          await hook.rerender("ab");
          t.expect(hook.result.current, "Right after changing to \"ab\"").toBe("a");
          await t.advanceTimers(299);
          t.expect(hook.result.current, "299ms later").toBe("a");
          await t.advanceTimers(1);
          t.expect(hook.result.current, "300ms later").toBe("ab");
        },
      },
      {
        id: "reset",
        requirementId: "reset",
        label: "Changes restart the timer",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          const hook = await t.renderHook<string>((value) => t.exports.useDebounce(value, 300), "r");
          await hook.rerender("re");
          await t.advanceTimers(200);
          await hook.rerender("rea");
          await t.advanceTimers(200);
          t.expect(hook.result.current, "400ms after the first change, 200ms after the second").toBe("r");
          await t.advanceTimers(100);
          t.expect(hook.result.current, "300ms after the last change").toBe("rea");
        },
      },
      {
        id: "cleanup",
        requirementId: "cleanup",
        label: "No timer outlives the component",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          const hook = await t.renderHook<string>((value) => t.exports.useDebounce(value, 300), "a");
          await hook.rerender("b");
          await hook.rerender("c");
          await hook.rerender("d");
          t.assert(t.pendingTimers() <= 1, `${t.pendingTimers()} timers are pending after 3 quick changes; clear the previous timeout in the cleanup.`);
          await hook.unmount();
          t.expect(t.pendingTimers(), "Timers pending after unmount").toBe(0);
        },
      },
      {
        id: "app",
        requirementId: "app",
        label: "The search list is debounced",
        kind: "runtime",
        async run(t: TestApi) {
          t.useFakeTimers();
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search"), "py");
          t.expect(t.screen.getByTestId("debounced").textContent, "Debounced value right after typing").toBe("");
          t.expect(t.screen.$$("li").length, "Languages shown before the delay").toBe(8);
          await t.advanceTimers(300);
          t.expect(t.screen.getByTestId("debounced").textContent, "Debounced value after 300ms").toBe("py");
          t.expect(t.screen.$$("li").map((li) => li.textContent), "Languages shown").toEqual(["Python"]);
        },
      },
      { id: "has-cleanup", requirementId: "cleanup", label: "The effect returns a cleanup", kind: "static", rule: { rule: "effectHasCleanup" } },
    ],
  },
];
