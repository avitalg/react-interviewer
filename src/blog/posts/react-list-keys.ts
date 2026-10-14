import type { Article } from "../types";

export const post: Article = {
  slug: "react-list-keys",
  title: "React list keys: why index as key fails interviews",
  description:
    "Why React keys matter, when an array index is the wrong key, and how to render, filter, and sort lists the way interviewers expect.",
  date: "2026-09-28",
  tags: ["lists", "keys", "reconciliation"],
  relatedExercises: ["lists-users", "lists-filter", "lists-sortable-table"],
  body: `If you only memorize one React interview soundbite, make it this: **a key is an identity, not a position.**

When React re-renders a list, it matches old children to new children by key. The right key reuses the instance and its state. The wrong key resets state, mis-animates, or wires a checkbox to the wrong row.

## What a key is for

Keys are not for your CSS. They are for React's reconciler.

- Stable across renders for the same item.
- Unique among siblings (not globally unique across the app).
- Taken from data: a database id, a slug, a UUID you created when the item was born.

\`\`\`
{users.map((user) => (
  <li key={user.id}>
    {user.name}
  </li>
))}
\`\`\`

The [user list](/exercise/lists-users) exercise checks that you use \`user.id\`, not the index.

## Why index as key looks fine until it doesn't

Index keys work for a **static list that never reorders, filters, or inserts in the middle**. A footer of three icon links is fine.

They break as soon as the list is alive:

- You delete item 0. Every surviving row inherits the next row's index, so React thinks identity shifted. Local state (an open accordion, an input) slides to the wrong item.
- You sort. Same problem: identity followed the position, not the record.
- You filter. Items appear to "change" because their indexes changed.

Interviewers will ask you to add a filter or a delete button after you used \`key={i}\`. That is the trap. Start with a real id.

## Filtering and empty states

A filtered list is still the same items, with a subset shown. Filter during render, keep the original array in state:

\`\`\`
const visible = fruits.filter((fruit) =>
  fruit.name.toLowerCase().includes(query.toLowerCase()),
);
\`\`\`

When \`visible.length === 0\`, render an explicit empty message, not a blank \`<ul>\`. Count copy like "Showing 2 of 5" is a nice extra and shows you did not lose the source list. Practice that in [filter a list](/exercise/lists-filter).

## Sorting without mutating

\`array.sort()\` mutates. In React that is a state bug. Copy first:

\`\`\`
const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
\`\`\`

Keep the sort field in state (\`name\` vs \`email\`, asc vs desc) and derive the displayed rows. The [sortable table](/exercise/lists-sortable-table) is the interview version of this: click a header, invert direction, do not scramble keys.

## Nested lists and fragments

Each \`map\` needs keys on **its** children. A fragment used as the mapped parent can take a key:

\`\`\`
{groups.map((group) => (
  <Fragment key={group.id}>
    <h2>{group.title}</h2>
    <ul>
      {group.items.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  </Fragment>
))}
\`\`\`

Inner keys only need to be unique among their siblings, so two groups may both contain \`item.id === "a"\`.

## How to answer in one breath

"I use a stable id from the data as the key. Index is only for static lists. Filter and sort by deriving a new array during render, never by mutating state in place."

Then open [Render a list of users](/exercise/lists-users) and prove it.
`,
};
