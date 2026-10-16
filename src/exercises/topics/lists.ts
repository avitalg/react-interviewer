import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const listsExercises: Exercise[] = [
  {
    id: "lists-users",
    topic: "lists",
    title: "Render a list of users",
    difficulty: "Easy",
    solutionExplanation: `Map the array to \`<li>\` elements and set \`key={user.id}\` — never the index. The heading count is \`users.length\`, derived during render rather than stored in extra state.`,
    description: `Render an array of users as a list. Each list item needs a **key** so React can track items between renders.`,
    requirements: [
      { id: "list", text: "Render each user as an `<li>` inside a `<ul>`, showing their name and email." },
      { id: "keys", text: "Use `user.id` as the key (not the array index)." },
      { id: "count", text: "Change the heading to show how many users there are: `3 users`." },
    ],
    starterCode: `const users = [
  { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u2', name: 'Alan Turing', email: 'alan@example.com' },
  { id: 'u3', name: 'Grace Hopper', email: 'grace@example.com' },
];

export default function App() {
  return (
    <div>
      <h2>Users</h2>
      <ul>
        {/* TODO: render one <li> per user */}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `const users = [
  { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u2', name: 'Alan Turing', email: 'alan@example.com' },
  { id: 'u3', name: 'Grace Hopper', email: 'grace@example.com' },
];

export default function App() {
  return (
    <div>
      <h2>{users.length} users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> · {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
    checks: [
      {
        id: "items",
        requirementId: "list",
        label: "Renders one <li> per user with name and email",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const items = t.screen.$$("ul > li");
          t.expect(items.length, "Number of <li> inside the <ul>").toBe(3);
          const expected = [
            ["Ada Lovelace", "ada@example.com"],
            ["Alan Turing", "alan@example.com"],
            ["Grace Hopper", "grace@example.com"],
          ];
          expected.forEach(([name, email], i) => {
            const text = items[i].textContent ?? "";
            t.assert(text.includes(name) && text.includes(email), `Item ${i + 1} should show "${name}" and "${email}", got "${text.trim()}".`);
          });
        },
      },
      { id: "has-keys", requirementId: "keys", label: "List items have keys", kind: "static", rule: { rule: "listItemsHaveKeys" } },
      { id: "no-index", requirementId: "keys", label: "Keys are not array indexes", kind: "static", rule: { rule: "noIndexAsKey" } },
      {
        id: "count",
        requirementId: "count",
        label: "The heading shows the user count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByRole("heading").textContent?.trim(), "Heading").toBe("3 users");
        },
      },
    ],
  },
  {
    id: "lists-filter",
    topic: "lists",
    title: "Filterable list",
    difficulty: "Medium",
    solutionExplanation: `Keep only the search query in state and derive the visible list during render with \`filter\`. That way the source data never goes out of sync, and an empty result set can show \`No matches\` instead of a blank list.`,

    description: `Add a search box that filters a list of fruits as you type.

The starter code keeps the filtered list in a second piece of state and recomputes it from the **previous** query, so it's always one keystroke behind. Values you can compute from existing state or props should be computed during render instead.`,
    requirements: [
      { id: "filter", text: "Typing in the input (placeholder `Search fruits`) shows only fruits containing the text, case-insensitively." },
      { id: "empty", text: "When nothing matches, show `No matches` instead of the list." },
      { id: "count", text: "Show `Showing N of M` in `data-testid=\"count\"`." },
      { id: "derive", text: "Keep only the query in state (one `useState`) and derive the filtered list during render." },
    ],
    starterCode: `import { useState } from 'react';

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Pineapple', 'Strawberry'];

export default function App() {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(fruits);

  function handleChange(event) {
    setQuery(event.target.value);
    setFiltered(fruits.filter((fruit) => fruit.includes(query)));
  }

  return (
    <div>
      <input placeholder="Search fruits" value={query} onChange={handleChange} />
      <ul>
        {filtered.map((fruit) => (
          <li key={fruit}>{fruit}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Pineapple', 'Strawberry'];

export default function App() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const filtered = fruits.filter((fruit) => fruit.toLowerCase().includes(normalized));

  return (
    <div>
      <input placeholder="Search fruits" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p data-testid="count">
        Showing {filtered.length} of {fruits.length}
      </p>
      {filtered.length === 0 ? (
        <p>No matches</p>
      ) : (
        <ul>
          {filtered.map((fruit) => (
            <li key={fruit}>{fruit}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
`,
    checks: [
      {
        id: "filter",
        requirementId: "filter",
        label: "Filters case-insensitively as you type",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const items = () => t.screen.$$("li").map((li) => li.textContent?.trim());
          t.expect(items().length, "All fruits are shown initially").toBe(8);
          const input = t.screen.getByPlaceholderText("Search fruits");
          await t.type(input, "an");
          t.expect(items(), 'Fruits matching "an"').toEqual(["Banana", "Mango", "Orange"]);
          await t.clear(input);
          await t.type(input, "AP");
          t.expect(items(), 'Fruits matching "AP"').toEqual(["Apple", "Grape", "Pineapple"]);
        },
      },
      {
        id: "empty",
        requirementId: "empty",
        label: "Shows \"No matches\"",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByText("No matches"), '"No matches" should not show while there are results.');
          await t.type(t.screen.getByPlaceholderText("Search fruits"), "xyz");
          t.assert(t.screen.queryByText("No matches"), 'Show "No matches" when nothing matches.');
          t.expect(t.screen.$$("li").length, "List items").toBe(0);
        },
      },
      {
        id: "count",
        requirementId: "count",
        label: "Shows \"Showing N of M\"",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("count").textContent?.replace(/\s+/g, " ").trim(), "Count").toBe("Showing 8 of 8");
          await t.type(t.screen.getByPlaceholderText("Search fruits"), "berry");
          t.expect(t.screen.getByTestId("count").textContent?.replace(/\s+/g, " ").trim(), 'Count for "berry"').toBe("Showing 1 of 8");
        },
      },
      { id: "derive", requirementId: "derive", label: "Uses a single piece of state", kind: "static", rule: { rule: "usesHook", hook: "useState", min: 1, max: 1 } },
    ],
  },
  {
    id: "lists-sortable-table",
    topic: "lists",
    title: "Sortable table",
    difficulty: "Hard",
    solutionExplanation: `Sort a copy (\`[...employees].sort(...)\`) so the original array stays intact. Store the active column and direction; clicking the same header toggles direction, clicking another column starts ascending.`,

    description: `Make a table sortable by clicking its column headers.

The starter code sorts with \`employees.sort()\`, which sorts the shared array **in place**. Sorting should produce a new array and leave the original data alone.`,
    requirements: [
      { id: "sort", text: "Clicking the **Name** or **Age** header button sorts the rows by that column, ascending." },
      { id: "toggle", text: "Clicking the same header again toggles between ascending and descending." },
      { id: "indicator", text: "The active header shows `▲` for ascending or `▼` for descending." },
      { id: "immutable", text: "Don't mutate `employees`: sort a copy. Re-mounting the table shows the original order." },
    ],
    starterCode: `import { useState } from 'react';

const employees = [
  { id: 1, name: 'Grace', age: 45 },
  { id: 2, name: 'Ada', age: 36 },
  { id: 3, name: 'Linus', age: 28 },
  { id: 4, name: 'Margaret', age: 52 },
];

export default function App() {
  const [sortKey, setSortKey] = useState(null);

  function sortBy(key) {
    employees.sort((a, b) => (a[key] > b[key] ? 1 : -1));
    setSortKey(key);
  }

  return (
    <table>
      <thead>
        <tr>
          <th><button onClick={() => sortBy('name')}>Name</button></th>
          <th><button onClick={() => sortBy('age')}>Age</button></th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => (
          <tr key={employee.id}>
            <td>{employee.name}</td>
            <td>{employee.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

const employees = [
  { id: 1, name: 'Grace', age: 45 },
  { id: 2, name: 'Ada', age: 36 },
  { id: 3, name: 'Linus', age: 28 },
  { id: 4, name: 'Margaret', age: 52 },
];

export default function App() {
  const [sort, setSort] = useState({ key: null, direction: 'asc' });

  function sortBy(key) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  const rows = sort.key
    ? [...employees].sort((a, b) => {
        const order = a[sort.key] < b[sort.key] ? -1 : a[sort.key] > b[sort.key] ? 1 : 0;
        return sort.direction === 'asc' ? order : -order;
      })
    : employees;

  const arrow = (key) => (sort.key === key ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <table>
      <thead>
        <tr>
          <th><button onClick={() => sortBy('name')}>Name{arrow('name')}</button></th>
          <th><button onClick={() => sortBy('age')}>Age{arrow('age')}</button></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((employee) => (
          <tr key={employee.id}>
            <td>{employee.name}</td>
            <td>{employee.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
`,
    checks: [
      {
        id: "sort",
        requirementId: "sort",
        label: "Sorts by name and by age",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const names = () => t.screen.$$("tbody tr").map((tr) => tr.querySelector("td")?.textContent?.trim());
          t.expect(names(), "Initial order").toEqual(["Grace", "Ada", "Linus", "Margaret"]);
          await t.click(t.screen.getByRole("button", { name: /^Name/ }));
          t.expect(names(), "Sorted by name").toEqual(["Ada", "Grace", "Linus", "Margaret"]);
          await t.click(t.screen.getByRole("button", { name: /^Age/ }));
          t.expect(names(), "Sorted by age").toEqual(["Linus", "Ada", "Grace", "Margaret"]);
        },
      },
      {
        id: "toggle",
        requirementId: "toggle",
        label: "Clicking again reverses the order",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const names = () => t.screen.$$("tbody tr").map((tr) => tr.querySelector("td")?.textContent?.trim());
          await t.click(t.screen.getByRole("button", { name: /^Name/ }));
          await t.click(t.screen.getByRole("button", { name: /^Name/ }));
          t.expect(names(), "Name, descending").toEqual(["Margaret", "Linus", "Grace", "Ada"]);
          await t.click(t.screen.getByRole("button", { name: /^Name/ }));
          t.expect(names(), "Name, ascending again").toEqual(["Ada", "Grace", "Linus", "Margaret"]);
        },
      },
      {
        id: "indicator",
        requirementId: "indicator",
        label: "The active header shows ▲ or ▼",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const nameButton = () => t.screen.getByRole("button", { name: /^Name/ });
          const ageButton = () => t.screen.getByRole("button", { name: /^Age/ });
          await t.click(nameButton());
          t.assert(nameButton().textContent?.includes("▲"), "After sorting by name ascending, the Name header should show ▲.");
          t.assert(!/[▲▼]/.test(ageButton().textContent ?? ""), "Only the active column should show an arrow.");
          await t.click(nameButton());
          t.assert(nameButton().textContent?.includes("▼"), "After sorting by name descending, the Name header should show ▼.");
        },
      },
      {
        id: "fresh-mount",
        requirementId: "immutable",
        label: "Sorting doesn't change the original data",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: /^Age/ }));
          await t.unmount();
          await t.render();
          const names = t.screen.$$("tbody tr").map((tr) => tr.querySelector("td")?.textContent?.trim());
          t.expect(names, "Order after re-mounting (employees was sorted in place)").toEqual(["Grace", "Ada", "Linus", "Margaret"]);
        },
      },
      { id: "no-mutation", requirementId: "immutable", label: "Doesn't sort the shared array in place", kind: "static", rule: { rule: "noStateMutation" } },
    ],
  },
];
