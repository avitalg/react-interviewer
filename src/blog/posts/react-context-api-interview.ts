import type { Article } from "../types";

export const post: Article = {
  slug: "react-context-api-interview",
  title: "React Context API interview guide: prop drilling, providers, and useContext",
  description:
    "When to use React Context in interviews, how to write a provider and a useAuth hook, and how Context relates to useReducer.",
  date: "2026-10-02",
  tags: ["context", "useContext", "prop drilling"],
  relatedExercises: ["ctx-theme", "ctx-auth", "ctx-cart-reducer"],
  body: `Context questions are really architecture questions. The API is small. The judgment is: **is this value needed deep in the tree, and does it change often?**

## Prop drilling vs Context

Prop drilling is passing props through components that do not use them. It is not automatically wrong. Three levels of \`user\` is still clear.

Context wins when many distant children need the same value (theme, current user, locale) and threading it would noise up every signature.

Context loses when:

- Only one child needs the data — pass a prop.
- The value is a large object that changes every render — you will re-render a wide subtree.
- You are avoiding a cleaner composition (a slot, \`children\`, or lifting state one level).

## The pieces you should be able to write from memory

1. \`createContext\` with a sensible default or \`null\`.
2. A provider that holds state and passes **value + updater**.
3. Consumers that call \`useContext\`.
4. Optionally a custom hook that throws if the provider is missing.

Theme is the teaching example. A boolean and a toggle, a \`data-theme\` attribute, no props through intermediate layout. Implement [theme context](/exercise/ctx-theme).

## useAuth and the throw

Interviews like a provider that is required:

\`\`\`
function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
\`\`\`

The error message should mention the provider. That is a kindness and a test assertion. See [auth context](/exercise/ctx-auth): login, logout, and the hook.

Split the value if you are asked about extra re-renders: a stable \`dispatch\` context and a \`state\` context, so buttons that only dispatch do not re-render when state changes. Mention it; do not build it unless asked.

## Context + useReducer

A cart, a wizard, or undoable editor is a reducer whose state is provided. Children dispatch actions instead of calling a handful of setters.

Rules:

- Reducer is pure and does not mutate.
- Adding the same product increments quantity.
- Derived totals are computed in render, not stored twice.

The [cart reducer](/exercise/ctx-cart-reducer) is built for that conversation.

## Common follow-ups

- Does Context replace Redux? For app-wide client state that is not server cache, often yes. For server data, a fetching library is a better story in 2026.
- Will every consumer re-render? Yes, when the provider \`value\` identity changes. Memoize the value object or split contexts if that becomes a problem.
- Can I put the fetched user in Context? Yes, but still handle loading and error at the boundary that fetches.

## What to say, then what to build

"I drill props until it gets noisy, then I provide a narrow value. I wrap it in a hook that fails loudly outside the provider. If updates are event-like, I pair Context with \`useReducer\`."

Practice path: [theme](/exercise/ctx-theme) → [auth](/exercise/ctx-auth) → [cart](/exercise/ctx-cart-reducer).
`,
};
