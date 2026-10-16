import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const propsExercises: Exercise[] = [
  {
    id: "props-button-variants",
    topic: "props",
    title: "Button with variants",
    difficulty: "Easy",
    solutionExplanation: `One \`Button\` takes \`children\` as the label, a \`variant\` that defaults to \`primary\`, and a forwarded \`onClick\`. Class names are \`btn btn-<variant>\`. \`App\` then uses three instances (Save, Cancel, Delete) instead of copying markup.`,
    description: `Design systems usually have one **Button** component with a few visual variants. Build one and use it three times.`,
    requirements: [
      { id: "children", text: "`Button` renders a `<button>` that uses `children` as its label." },
      { id: "variant", text: "It sets `className` to `btn btn-<variant>`, where `variant` is `primary` (default), `secondary` or `danger`." },
      { id: "onclick", text: "It forwards the `onClick` prop to the `<button>`." },
      { id: "usage", text: "`App` renders **Save** (default variant), **Cancel** (`secondary`) and **Delete** (`danger`). Clicking **Save** shows `Saved!`." },
    ],
    starterCode: `import { useState } from 'react';

function Button(props) {
  // TODO: use children, variant (default "primary") and onClick
  return <button>Button</button>;
}

export default function App() {
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button>Save</Button>
      <Button>Cancel</Button>
      <Button>Delete</Button>
      {saved && <p>Saved!</p>}
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

function Button({ variant = 'primary', onClick, children }) {
  return (
    <button className={'btn btn-' + variant} onClick={onClick}>
      {children}
    </button>
  );
}

export default function App() {
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button onClick={() => setSaved(true)}>Save</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Delete</Button>
      {saved && <p>Saved!</p>}
    </div>
  );
}
`,
    checks: [
      { id: "defines", requirementId: "children", label: "Defines a Button component", kind: "static", rule: { rule: "definesComponent", name: "Button" } },
      {
        id: "labels",
        requirementId: "children",
        label: "Buttons show their children as labels",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          for (const name of ["Save", "Cancel", "Delete"]) {
            t.assert(t.screen.queryByRole("button", { name }), `Expected a button labelled "${name}".`);
          }
        },
      },
      {
        id: "classes",
        requirementId: "variant",
        label: "Each button has the right btn-<variant> class",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const expected = { Save: "btn-primary", Cancel: "btn-secondary", Delete: "btn-danger" } as Record<string, string>;
          for (const name of Object.keys(expected)) {
            const button = t.screen.queryByRole("button", { name });
            t.assert(button, `Expected a button labelled "${name}".`);
            t.assert(
              button.classList.contains("btn") && button.classList.contains(expected[name]),
              `"${name}" should have className "btn ${expected[name]}", got "${button.className}".`,
            );
          }
        },
      },
      {
        id: "click",
        requirementId: "onclick",
        label: "Clicking Save shows \"Saved!\"",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByText("Saved!"), '"Saved!" should not show before clicking.');
          await t.click(t.screen.getByRole("button", { name: "Save" }));
          t.assert(t.screen.queryByText("Saved!"), 'Clicking "Save" should show "Saved!". Is onClick forwarded to the <button>?');
        },
      },
      { id: "three", requirementId: "usage", label: "App renders three Buttons", kind: "static", rule: { rule: "usesComponent", name: "Button", min: 3 } },
    ],
  },
  {
    id: "props-card-children",
    topic: "props",
    title: "Card with children and a footer slot",
    difficulty: "Medium",
    solutionExplanation: `Treat \`Card\` as a shell: put \`title\` in a heading, render \`children\` in the body, and only output a \`<footer>\` when the \`footer\` prop is passed. That slot pattern lets the same Card wrap different content.`,

    description: `Composition beats configuration: instead of passing strings for every part of a card, let callers pass **JSX**. \`children\` is the main slot, and a \`footer\` prop is an optional second slot.`,
    requirements: [
      { id: "title", text: "`Card` renders a `<section className=\"card\">` with its `title` prop in an `<h3>`." },
      { id: "children", text: "Whatever is passed as `children` renders inside a `<div className=\"card-body\">`." },
      { id: "footer", text: "If a `footer` prop is passed, render it inside a `<footer>`. Otherwise render no `<footer>` at all." },
      { id: "usage", text: "`App` renders a **Profile** card (body `<p>Ada Lovelace</p>`, footer `<button>Edit</button>`) and a **Stats** card (a list with `42 posts` and `7 drafts`, no footer)." },
    ],
    starterCode: `function Card({ title }) {
  // TODO: render children inside .card-body and an optional footer
  return (
    <section className="card">
      <h3>{title}</h3>
    </section>
  );
}

export default function App() {
  return (
    <div>
      <Card title="Profile" />
      <Card title="Stats" />
    </div>
  );
}
`,
    referenceSolution: `function Card({ title, children, footer }) {
  return (
    <section className="card" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

export default function App() {
  return (
    <div>
      <Card title="Profile" footer={<button>Edit</button>}>
        <p>Ada Lovelace</p>
      </Card>
      <Card title="Stats">
        <ul>
          <li>42 posts</li>
          <li>7 drafts</li>
        </ul>
      </Card>
    </div>
  );
}
`,
    checks: [
      {
        id: "titles",
        requirementId: "title",
        label: "Cards show their titles in <h3>",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const cards = t.screen.$$("section.card");
          t.expect(cards.length, 'Expected two <section className="card"> elements').toBe(2);
          const titles = cards.map((card) => card.querySelector("h3")?.textContent?.trim());
          t.expect(titles, "Card titles").toEqual(["Profile", "Stats"]);
        },
      },
      {
        id: "children",
        requirementId: "children",
        label: "Children render inside .card-body",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const bodies = t.screen.$$(".card-body");
          t.expect(bodies.length, "Expected a .card-body in each card").toBe(2);
          t.assert(/Ada Lovelace/.test(bodies[0].textContent ?? ""), 'The Profile card body should contain "Ada Lovelace".');
          t.assert(/42 posts/.test(bodies[1].textContent ?? "") && /7 drafts/.test(bodies[1].textContent ?? ""), 'The Stats card body should list "42 posts" and "7 drafts".');
        },
      },
      {
        id: "footer",
        requirementId: "footer",
        label: "Footer renders only when passed",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const cards = t.screen.$$("section.card");
          t.expect(cards.length, "Expected two cards").toBe(2);
          const footer = cards[0].querySelector("footer");
          t.assert(footer, "The Profile card should have a <footer>.");
          t.assert(t.within(footer).queryByRole("button", { name: "Edit" }), 'The Profile footer should contain an "Edit" button.');
          t.assert(!cards[1].querySelector("footer"), "The Stats card has no footer prop, so it shouldn't render a <footer>.");
        },
      },
      { id: "two-cards", requirementId: "usage", label: "App renders two Cards", kind: "static", rule: { rule: "usesComponent", name: "Card", min: 2 } },
    ],
  },
  {
    id: "props-compound-tabs",
    topic: "props",
    title: "Compound Tabs component",
    difficulty: "Hard",
    solutionExplanation: `\`Tabs\` owns the selected index. \`Children.map\` reads each \`Tab\`'s \`label\` and \`default\` without rendering them as-is, then you draw the tablist and only the active panel. Compound components share state through the parent, not props on every child.`,

    description: `Build an accessible **Tabs** component with a compound API: the caller describes tabs as \`<Tab label="…">content</Tab>\` children, and \`Tabs\` decides what to render.

Hint: \`Children.toArray(children)\` gives you an array of the \`<Tab>\` elements, and each one has its \`label\` in \`.props\`.`,
    requirements: [
      { id: "tablist", text: "Render an element with `role=\"tablist\"` containing one `<button role=\"tab\">` per `<Tab>`, labelled with its `label` prop." },
      { id: "panel", text: "Only the active tab's content is shown, inside an element with `role=\"tabpanel\"`." },
      { id: "select", text: "Clicking a tab makes it active. The active tab has `aria-selected=\"true\"` and the others `aria-selected=\"false\"`." },
      { id: "default", text: "`Tabs` accepts a `defaultIndex` prop (default `0`). `App` passes `defaultIndex={1}`, so **Features** starts active." },
    ],
    starterCode: `function Tab({ label, children }) {
  return <div>{children}</div>;
}

function Tabs({ children, defaultIndex = 0 }) {
  // TODO: render a tablist with a button per <Tab>, and show only the active panel
  return <div>{children}</div>;
}

export default function App() {
  return (
    <Tabs defaultIndex={1}>
      <Tab label="Overview">React is a UI library.</Tab>
      <Tab label="Features">Hooks, Context, Suspense.</Tab>
      <Tab label="Pricing">Free and open source.</Tab>
    </Tabs>
  );
}
`,
    referenceSolution: `import { Children, useState } from 'react';

function Tab({ children }) {
  return children;
}

function Tabs({ children, defaultIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const tabs = Children.toArray(children);

  return (
    <div>
      <div role="tablist" style={{ display: 'flex', gap: 4 }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.props.label}
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ padding: 12 }}>
        {tabs[activeIndex]}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Tabs defaultIndex={1}>
      <Tab label="Overview">React is a UI library.</Tab>
      <Tab label="Features">Hooks, Context, Suspense.</Tab>
      <Tab label="Pricing">Free and open source.</Tab>
    </Tabs>
  );
}
`,
    checks: [
      {
        id: "tablist",
        requirementId: "tablist",
        label: "Renders a tablist with three tabs",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const tablist = t.screen.getByRole("tablist");
          const tabs = t.within(tablist).queryAllByRole("tab");
          t.expect(tabs.map((tab) => tab.textContent?.trim()), "Tab labels").toEqual(["Overview", "Features", "Pricing"]);
          t.assert(tabs.every((tab) => tab.tagName === "BUTTON"), "Each tab should be a <button>.");
        },
      },
      {
        id: "panel",
        requirementId: "panel",
        label: "Only the active panel is shown",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const panel = t.screen.getByRole("tabpanel");
          t.expect(panel.textContent?.trim(), "Active panel content").toBe("Hooks, Context, Suspense.");
          t.assert(!t.screen.queryByText("React is a UI library."), "Inactive panels should not be rendered.");
          t.assert(!t.screen.queryByText("Free and open source."), "Inactive panels should not be rendered.");
        },
      },
      {
        id: "select",
        requirementId: "select",
        label: "Clicking a tab activates it and updates aria-selected",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("tab", { name: "Pricing" }));
          t.expect(t.screen.getByRole("tabpanel").textContent?.trim(), "Panel after clicking Pricing").toBe("Free and open source.");
          const selected = t.screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"));
          t.expect(selected, "aria-selected values").toEqual(["false", "false", "true"]);
          await t.click(t.screen.getByRole("tab", { name: "Overview" }));
          t.expect(t.screen.getByRole("tabpanel").textContent?.trim(), "Panel after clicking Overview").toBe("React is a UI library.");
        },
      },
      {
        id: "default",
        requirementId: "default",
        label: "defaultIndex={1} starts on Features",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const features = t.screen.getByRole("tab", { name: "Features" });
          t.expect(features.getAttribute("aria-selected"), 'The "Features" tab should start selected').toBe("true");
        },
      },
      { id: "state", requirementId: "select", label: "Keeps the active tab in state", kind: "static", rule: { rule: "usesHook", hook: "useState" } },
    ],
  },
];
