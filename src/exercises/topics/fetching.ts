import type { Exercise } from "../types";
import type { MockResponse, TestApi } from "@/sandbox/types";

export const fetchingExercises: Exercise[] = [
  {
    id: "fetch-users",
    topic: "fetching",
    title: "Fetch with loading and error states",
    difficulty: "Easy",
    solutionExplanation: `Fetch once on mount in an effect. Track \`loading\`, \`error\`, and the list as three pieces of state, and check \`res.ok\` because \`fetch\` doesn't throw on 404/500. Retry clears the error and runs the request again.`,

    description: `Load a list of users from \`/api/users\` (a fake API that runs inside the preview). Real requests can be slow or fail, so handle all three states: **loading**, **error** and **success**.

Note that \`fetch\` only rejects on network errors. A \`500\` response resolves normally, so check \`response.ok\`.`,
    requirements: [
      { id: "fetch", text: "Fetch `/api/users` once when the component mounts and render each user's `name` in an `<li>`." },
      { id: "loading", text: "Show `Loading…` while the request is in flight." },
      { id: "error", text: "If the request fails or the response isn't OK, show `Something went wrong` instead of the list." },
      { id: "retry", text: "The error state has a **Retry** button that fetches again." },
    ],
    mockApi: (url) => {
      if (url.pathname !== "/api/users") return { status: 404, body: { error: "Not found" } };
      return {
        delay: 400,
        body: [
          { id: 1, name: "Ada Lovelace" },
          { id: 2, name: "Alan Turing" },
          { id: 3, name: "Grace Hopper" },
        ],
      };
    },
    starterCode: `import { useEffect, useState } from 'react';

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then((response) => response.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    fetch('/api/users')
      .then((response) => {
        if (!response.ok) throw new Error('Request failed with status ' + response.status);
        return response.json();
      })
      .then((data) => {
        if (ignore) return;
        setUsers(data);
        setStatus('success');
      })
      .catch(() => {
        if (!ignore) setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (status === 'loading') return <p>Loading…</p>;

  if (status === 'error') {
    return (
      <div>
        <p>Something went wrong</p>
        <button onClick={() => setAttempt(attempt + 1)}>Retry</button>
      </div>
    );
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
`,
    checks: [
      {
        id: "fetch",
        requirementId: "fetch",
        label: "Fetches /api/users once and shows names",
        kind: "runtime",
        async run(t: TestApi) {
          const users = [
            { id: 1, name: "Ada Lovelace" },
            { id: 2, name: "Alan Turing" },
          ];
          t.mockFetch(() => ({ body: users, delay: 20 }));
          await t.render();
          await t.waitFor(() => t.expect(t.screen.$$("li").length, "Users rendered").toBe(2));
          t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), "User names").toEqual(["Ada Lovelace", "Alan Turing"]);
          await t.sleep(50);
          t.expect(t.fetchCalls.map((call) => call.url), "Requests made").toEqual(["/api/users"]);
        },
      },
      {
        id: "loading",
        requirementId: "loading",
        label: "Shows Loading… while fetching",
        kind: "runtime",
        async run(t: TestApi) {
          t.mockFetch(() => ({ body: [{ id: 1, name: "Ada Lovelace" }], delay: 150 }));
          await t.render();
          t.assert(t.screen.queryByText(/Loading/), 'Show "Loading…" while the request is in flight.');
          await t.waitFor(() => t.assert(t.screen.queryByText("Ada Lovelace"), "The user list should appear once loaded."));
          t.assert(!t.screen.queryByText(/Loading/), 'Hide "Loading…" once the data has arrived.');
        },
      },
      {
        id: "error",
        requirementId: "error",
        label: "Shows an error for a failed response",
        kind: "runtime",
        async run(t: TestApi) {
          t.mockFetch(() => ({ status: 500, body: { error: "Internal error" } }));
          await t.render();
          await t.waitFor(() => t.assert(t.screen.queryByText("Something went wrong"), 'A 500 response should show "Something went wrong" (check response.ok).'));
          t.assert(!t.screen.queryByText(/Loading/), 'Hide "Loading…" once the request has failed.');
        },
      },
      {
        id: "retry",
        requirementId: "retry",
        label: "Retry fetches again",
        kind: "runtime",
        async run(t: TestApi) {
          let failing = true;
          t.mockFetch(() => (failing ? { status: 503 } : { body: [{ id: 1, name: "Ada Lovelace" }] }));
          await t.render();
          const retry = await t.waitFor(() => t.screen.getByRole("button", { name: "Retry" }), {
            message: 'After a failed request, show a "Retry" button.',
          });
          failing = false;
          await t.click(retry);
          await t.waitFor(() => t.assert(t.screen.queryByText("Ada Lovelace"), "After Retry succeeds, show the users."));
          t.expect(t.fetchCalls.length, "Requests made").toBe(2);
        },
      },
    ],
  },
  {
    id: "fetch-pagination",
    topic: "fetching",
    title: "Paginated posts",
    difficulty: "Medium",
    solutionExplanation: `Keep \`page\` in state and fetch \`/api/posts?page=\${page}\` in an effect that depends on it. Disable Previous on page 1 and Next on the last page using \`totalPages\` from the response, and show a loading state while a page is in flight.`,

    description: `Show posts from \`/api/posts?page=N\`, which responds with \`{ posts: [{ id, title }], totalPages }\`.

The starter code fetches only once, because its effect has an empty dependency array even though it uses \`page\`.`,
    requirements: [
      { id: "fetch", text: "Fetch `/api/posts?page=<page>` for the current page and render the post titles in `<li>` elements." },
      { id: "navigate", text: "**Next** and **Previous** change the page, and the posts update to match. Show `Page N of M` using `totalPages` from the response." },
      { id: "bounds", text: "**Previous** is disabled on the first page and **Next** on the last page." },
      { id: "loading", text: "Show `Loading…` while a page is loading." },
    ],
    mockApi: (url) => {
      if (url.pathname !== "/api/posts") return { status: 404, body: { error: "Not found" } };
      const page = Number(url.searchParams.get("page") ?? "1");
      if (!(page >= 1 && page <= 3)) return { status: 400, body: { error: "Invalid page" } };
      const posts = [1, 2, 3].map((i) => {
        const id = (page - 1) * 3 + i;
        return { id, title: "Post " + id };
      });
      return { delay: 120, body: { posts, totalPages: 3 } };
    },
    starterCode: `import { useEffect, useState } from 'react';

export default function App() {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/posts?page=' + page)
      .then((response) => response.json())
      .then((data) => setPosts(data.posts));
  }, []);

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={() => setPage(page - 1)}>Previous</button>
      <span> Page {page} of 3 </span>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ posts: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch('/api/posts?page=' + page)
      .then((response) => response.json())
      .then((result) => {
        if (ignore) return;
        setData(result);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data.posts.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
      <span> Page {page} of {data.totalPages} </span>
      <button onClick={() => setPage(page + 1)} disabled={page === data.totalPages}>Next</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "fetch",
        requirementId: "fetch",
        label: "Loads the first page",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.waitFor(() => t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), "Posts on page 1").toEqual(["Post 1", "Post 2", "Post 3"]));
          t.expect(t.fetchCalls[0]?.url, "First request").toBe("/api/posts?page=1");
        },
      },
      {
        id: "navigate",
        requirementId: "navigate",
        label: "Next and Previous load the right page",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 1"), "Page 1 should load."));
          await t.click(t.screen.getByRole("button", { name: "Next" }));
          await t.waitFor(() => t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), "Posts after clicking Next").toEqual(["Post 4", "Post 5", "Post 6"]));
          t.assert(t.screen.queryByText("Page 2 of 3"), 'Show "Page 2 of 3" on the second page.');
          await t.click(t.screen.getByRole("button", { name: "Previous" }));
          await t.waitFor(() => t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), "Posts after clicking Previous").toEqual(["Post 1", "Post 2", "Post 3"]));
        },
      },
      {
        id: "bounds",
        requirementId: "bounds",
        label: "Buttons are disabled at the ends",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 1"), "Page 1 should load."));
          const previous = () => t.screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement;
          const next = () => t.screen.getByRole("button", { name: "Next" }) as HTMLButtonElement;
          t.assert(previous().disabled, "Previous should be disabled on page 1.");
          await t.click(next());
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 4"), "Page 2 should load."));
          await t.click(next());
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 7"), "Page 3 should load."));
          t.assert(next().disabled, "Next should be disabled on the last page (3 of 3).");
          t.assert(!previous().disabled, "Previous should be enabled on the last page.");
        },
      },
      {
        id: "loading",
        requirementId: "loading",
        label: "Shows Loading… between pages",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByText(/Loading/), 'Show "Loading…" while the first page loads.');
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 1"), "Page 1 should load."));
          await t.click(t.screen.getByRole("button", { name: "Next" }));
          t.assert(t.screen.queryByText(/Loading/), 'Show "Loading…" while the next page loads.');
          await t.waitFor(() => t.assert(t.screen.queryByText("Post 4"), "Page 2 should load."));
        },
      },
      { id: "deps", requirementId: "fetch", label: "Effect dependencies are complete", kind: "static", rule: { rule: "effectDepsComplete" } },
    ],
  },
  {
    id: "fetch-search-abort",
    topic: "fetching",
    title: "Search with request cancellation",
    difficulty: "Hard",
    solutionExplanation: `Fetch in an effect that depends on the query, and skip empty input. Create an \`AbortController\` and abort it in the cleanup so a slow earlier response can't overwrite newer results. Ignore \`AbortError\` in the catch so cancelled requests don't look like failures.`,

    description: `Search \`/api/search?q=…\` (responds with \`{ results: string[] }\`) as the user types.

This fake API answers **shorter queries more slowly**, like a real search over more results. Without cancellation, the response for \`r\` can arrive after the one for \`rea\` and overwrite it: a **race condition**. Cancel stale requests with an \`AbortController\`.`,
    requirements: [
      { id: "search", text: "Typing in the input (placeholder `Search frameworks`) fetches `/api/search?q=<query>` and renders the results as `<li>` elements." },
      { id: "empty", text: "Don't send a request for an empty query." },
      { id: "abort", text: "Abort the previous request in the effect cleanup with `AbortController`, so only the latest query's results are shown." },
      { id: "states", text: "Show `No results` for an empty result list and `Something went wrong` for a failed request, but never show an error for an aborted request." },
    ],
    mockApi: (url): MockResponse => {
      if (url.pathname !== "/api/search") return { status: 404, body: { error: "Not found" } };
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const names = ["React", "Redux", "Remix", "Svelte", "Angular", "Vue", "Preact", "Ember"];
      return {
        delay: Math.max(60, 360 - query.length * 100),
        body: { results: names.filter((name) => name.toLowerCase().includes(query)) },
      };
    },
    starterCode: `import { useEffect, useState } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/search?q=' + query)
      .then((response) => response.json())
      .then((data) => setResults(data.results));
  }, [query]);

  return (
    <div>
      <input placeholder="Search frameworks" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {results.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ status: 'idle', results: [] });
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    setSearch((current) => ({ ...current, status: 'loading' }));

    fetch('/api/search?q=' + encodeURIComponent(trimmed), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Request failed with status ' + response.status);
        return response.json();
      })
      .then((data) => setSearch({ status: 'success', results: data.results }))
      .catch((error) => {
        if (error.name !== 'AbortError') setSearch({ status: 'error', results: [] });
      });

    return () => controller.abort();
  }, [trimmed]);

  return (
    <div>
      <input placeholder="Search frameworks" value={query} onChange={(e) => setQuery(e.target.value)} />
      {trimmed && search.status === 'loading' && <p>Searching…</p>}
      {trimmed && search.status === 'error' && <p>Something went wrong</p>}
      {trimmed && search.status === 'success' && search.results.length === 0 && <p>No results</p>}
      {trimmed && search.status === 'success' && (
        <ul>
          {search.results.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
`,
    checks: [
      {
        id: "search",
        requirementId: "search",
        label: "Shows results for the query",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search frameworks"), "re");
          await t.waitFor(() =>
            t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), 'Results for "re"').toEqual(["React", "Redux", "Remix", "Preact"]),
          );
          t.assert(t.fetchCalls.some((call) => call.url === "/api/search?q=re"), 'Expected a request to "/api/search?q=re".');
        },
      },
      {
        id: "empty",
        requirementId: "empty",
        label: "No request for an empty query",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.sleep(50);
          t.expect(t.fetchCalls.length, "Requests sent with an empty query").toBe(0);
        },
      },
      {
        id: "race",
        requirementId: "abort",
        label: "Only the latest query's results are shown",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search frameworks"), "rea");
          await t.sleep(500);
          t.expect(t.screen.$$("li").map((li) => li.textContent?.trim()), 'Results after typing "rea" (a slower, older response overwrote them)').toEqual(["React", "Preact"]);
          t.assert(!t.screen.queryByText("Something went wrong"), "Aborted requests must not show an error. Ignore AbortError.");
        },
      },
      {
        id: "aborted",
        requirementId: "abort",
        label: "Stale requests are aborted",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByPlaceholderText("Search frameworks"), "re");
          t.assert(t.fetchCalls.length >= 2, "Typing two characters should start a request for each query.");
          t.assert(t.fetchCalls[0].signal, "Pass `{ signal: controller.signal }` to fetch.");
          t.assert(t.fetchCalls[0].signal.aborted, 'The request for "r" should be aborted once the query changes to "re".');
        },
      },
      {
        id: "states",
        requirementId: "states",
        label: "Shows No results and errors",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Search frameworks");
          await t.type(input, "zzz");
          await t.waitFor(() => t.assert(t.screen.queryByText("No results"), 'Show "No results" when nothing matches.'));
          t.mockFetch(() => ({ status: 500, body: { error: "Internal error" } }));
          await t.clear(input);
          await t.type(input, "vue");
          await t.waitFor(() => t.assert(t.screen.queryByText("Something went wrong"), 'Show "Something went wrong" when the request fails.'));
        },
      },
    ],
  },
];
