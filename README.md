# React Interviewer

Live site: [reactinterviewer.com](https://www.reactinterviewer.com/)

Practice React interview exercises in the browser: write code in a live editor, watch it run, and submit for automated feedback on every requirement. When AI review is configured, you also get qualitative notes and a one-click minimal fix.

## Features

- **43 exercises** across 12 topics, from JSX through data fetching
- **Live editor and preview** — CodeMirror plus a sandboxed React 18 iframe
- **Automated checks** — static AST rules (hooks, keys, effects, mutation) and runtime tests that click, type, and assert like a real UI test
- **Feedback you can act on** — pass / partial / not-yet per requirement, plus a suggested fix you can apply in one click
- **Optional AI review** via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) (Claude by default); checks still run without it
- **Progress in this browser** — drafts and solved status live in `localStorage`

## Topics

| Topic | Exercises |
| --- | --- |
| JSX & Components | Profile card, split a page, star rating |
| Props & Composition | Button variants, card slots, compound Tabs |
| State (`useState`) | Counter, todo list, undo/redo |
| Effects & Lifecycle | Document title, countdown, stopwatch with laps |
| Events & Forms | Live input, sign-up validation, dynamic guest list |
| Lists & Keys | Render, filter, sortable table |
| Conditional Rendering | Login view, accordion, accessible modal |
| Refs (`useRef`) | Focus input, `usePrevious`, outside-click dropdown |
| Context API | Theme, auth provider, cart with `useReducer` |
| Custom Hooks | `useToggle`, `useLocalStorage`, `useDebounce` |
| Performance | `memo`, `useMemo`, `useCallback` |
| Data Fetching | Loading/error, pagination, abort on search |

## Getting started

Node 20.9+ (CI uses Node 24).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The sandbox runtime is built automatically on `npm install`, `npm run dev`, and `npm run build`.

The sitemap is at `/sitemap.xml` and is advertised in `/robots.txt`. Canonical URLs, Open Graph, and the sitemap use `https://www.reactinterviewer.com`. Override with `NEXT_PUBLIC_SITE_URL` only if you need a different origin.

## AI reviews

Automated checks always run. AI review is extra: on submit it comments on what works, what’s missing, and proposes the smallest line edits that satisfy the failing requirements.

Enable it with one of:

- `AI_GATEWAY_API_KEY` — a [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key
- Linking the project with the Vercel CLI, which supplies `VERCEL_OIDC_TOKEN` locally

Optional:

```bash
# defaults to anthropic/claude-sonnet-5.5
REVIEW_MODEL=anthropic/claude-sonnet-5.5
```

Without a key, the workspace still grades submissions and can offer built-in quick fixes. The header shows **AI review on/off**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js app |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Run Vitest (exercise solutions, harness, static rules) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run check` | Lint, typecheck, and test (also the pre-commit hook and Vercel build) |
| `npm run sandbox` | Rebuild `public/sandbox` (React 18 UMD + bundled runtime) |

## How it works

```
src/exercises/          Exercise data: starter, requirements, checks, reference solution
src/lib/compile.ts      Babel Standalone compiles user JSX in the browser
src/lib/checks/         Static rules on the AST
src/sandbox/            Iframe runtime: preview, mocked fetch, runtime tests
src/lib/review/         Merge check results with optional AI feedback
src/app/api/review/     Server route for the AI reviewer
```

User code never runs on the host page. The preview iframe is an opaque origin with a tight CSP (`allow-scripts` only — no same-origin access). Runtime checks are serialized as source and executed inside that frame; they must be self-contained (`run(t)` may use only the `t` test API, no outer variables).

The host app is Next.js 16 / React 19. The sandbox is React 18, matching a typical interview environment.

Reference solutions stay on the server. After the first submit, the **Solution** tab shows a short walkthrough and the reference code (`/api/solution/[id]`).

## Adding an exercise

1. Add an `Exercise` to the matching file under `src/exercises/topics/` (it is already re-exported from `src/exercises/all.ts`).
2. Give it unique `id`s for the exercise, each requirement, and each check.
3. Point every check at a `requirementId`. Use `kind: "static"` for AST rules and `kind: "runtime"` for UI tests.
4. Add a `solutionExplanation`: a few sentences on the approach, shown in the Solution tab after the first submit.
5. Keep `run` self-contained. Use `t.render()`, `t.screen.getByRole` / `getByTestId`, `t.click`, `t.type`, `t.expect`, and `t.mockFetch` as needed — see `src/sandbox/types.ts` (`TestApi`) and existing exercises.
6. The suite asserts that starter code does **not** pass and that the reference solution **does**. Run:

```bash
npm test -- tests/exercises.test.ts
```

Each topic should keep at least three exercises.

## License

Private project (`"private": true` in `package.json`).
