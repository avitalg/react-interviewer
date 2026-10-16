import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const refsExercises: Exercise[] = [
  {
    id: "refs-focus-input",
    topic: "refs",
    title: "Focus an input",
    difficulty: "Easy",
    solutionExplanation: `Attach a \`useRef\` to the input and call \`ref.current.focus()\`. Do that once on mount with an effect, and again from the **Focus input** button. Don't look the element up with \`document.getElementById\`.`,

    description: `Focus an input from code. In React you don't look elements up with \`document.getElementById\`: you attach a **ref** and call methods on \`ref.current\`.`,
    requirements: [
      { id: "mount", text: "The input (placeholder `Type here`) is focused as soon as the component mounts." },
      { id: "button", text: "Clicking **Focus input** moves focus back to the input." },
      { id: "ref", text: "Use `useRef` instead of querying the DOM with `document.*`." },
    ],
    starterCode: `export default function App() {
  function focusInput() {
    document.getElementById('name-input').focus();
  }

  return (
    <div>
      <input id="name-input" placeholder="Type here" />
      <button onClick={focusInput}>Focus input</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useRef } from 'react';

export default function App() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <div>
      <input ref={inputRef} placeholder="Type here" />
      <button onClick={() => inputRef.current.focus()}>Focus input</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "mount",
        requirementId: "mount",
        label: "The input is focused on mount",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Type here");
          t.assert(t.document.activeElement === input, "The input should be focused right after the component mounts.");
        },
      },
      {
        id: "button",
        requirementId: "button",
        label: "Focus input focuses the input",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByPlaceholderText("Type here");
          input.blur();
          await t.click(t.screen.getByRole("button", { name: "Focus input" }));
          t.assert(t.document.activeElement === input, 'Clicking "Focus input" should focus the input.');
        },
      },
      { id: "use-ref", requirementId: "ref", label: "Uses useRef", kind: "static", rule: { rule: "usesHook", hook: "useRef" } },
      { id: "no-dom", requirementId: "ref", label: "Doesn't query the DOM directly", kind: "static", rule: { rule: "noDirectDom" } },
    ],
  },
  {
    id: "refs-forward-ref",
    topic: "refs",
    title: "Forward a ref through TextInput",
    difficulty: "Medium",
    solutionExplanation: `Function components don't receive \`ref\` as a prop. Wrap \`TextInput\` in \`forwardRef\` and put that ref on the real \`<input>\` — not the \`<label>\` — so \`inputRef.current.focus()\` reaches the DOM node.`,
    description: `\`App\` already has a ref and a **Focus name** button. \`TextInput\` swallows the ref because function components don't take \`ref\` as a normal prop.

Use \`forwardRef\` so the parent can focus the inner input.`,
    requirements: [
      { id: "field", text: "`TextInput` renders a `Name` labelled input (placeholder `Your name`)." },
      { id: "forward", text: "Wrap `TextInput` in `forwardRef` and attach the ref to the `<input>` (not the label)." },
      { id: "focus", text: "**Focus name** focuses that input via the ref. Don't query the DOM with `document.*`." },
    ],
    starterCode: `import { useRef } from 'react';

function TextInput({ label, ...props }) {
  return (
    <label>
      {label} <input {...props} />
    </label>
  );
}

export default function App() {
  const inputRef = useRef(null);

  return (
    <div>
      <TextInput ref={inputRef} label="Name" placeholder="Your name" />
      <button onClick={() => inputRef.current.focus()}>Focus name</button>
    </div>
  );
}
`,
    referenceSolution: `import { forwardRef, useRef } from 'react';

const TextInput = forwardRef(function TextInput({ label, ...props }, ref) {
  return (
    <label>
      {label} <input ref={ref} {...props} />
    </label>
  );
});

export default function App() {
  const inputRef = useRef(null);

  return (
    <div>
      <TextInput ref={inputRef} label="Name" placeholder="Your name" />
      <button onClick={() => inputRef.current.focus()}>Focus name</button>
    </div>
  );
}
`,
    checks: [
      {
        id: "field",
        requirementId: "field",
        label: "TextInput renders a Name field",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.queryByLabelText("Name") as HTMLInputElement | null;
          t.assert(input && input.tagName === "INPUT", 'Expected an <input> labelled "Name".');
          t.expect(input.getAttribute("placeholder"), "placeholder").toBe("Your name");
        },
      },
      {
        id: "focus",
        requirementId: "focus",
        label: "Focus name focuses the input",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByLabelText("Name") as HTMLInputElement;
          input.blur();
          await t.click(t.screen.getByRole("button", { name: "Focus name" }));
          t.assert(t.document.activeElement === input, 'Clicking "Focus name" should focus the Name input. Forward the ref onto the <input>, not the label.');
        },
      },
      { id: "defines", requirementId: "forward", label: "Defines TextInput", kind: "static", rule: { rule: "definesComponent", name: "TextInput" } },
      { id: "forwards", requirementId: "forward", label: "Uses forwardRef", kind: "static", rule: { rule: "usesIdentifier", name: "forwardRef" } },
      { id: "use-ref", requirementId: "focus", label: "Uses useRef", kind: "static", rule: { rule: "usesHook", hook: "useRef" } },
      { id: "no-dom", requirementId: "focus", label: "Doesn't query the DOM directly", kind: "static", rule: { rule: "noDirectDom" } },
    ],
  },
  {
    id: "refs-previous-value",
    topic: "refs",
    title: "usePrevious hook",
    difficulty: "Medium",
    solutionExplanation: `A ref holds the previous value because changing \`ref.current\` doesn't re-render. Return that value, then update the ref in an effect after render so the next call sees what was current this time.`,

    description: `Write a \`usePrevious(value)\` hook that returns the value from the **previous render**.

Refs are perfect for this: changing \`ref.current\` doesn't trigger a re-render, and the value survives between renders. Update it in an effect, which runs *after* the render has used the old value.`,
    requirements: [
      { id: "hook", text: "Define a `usePrevious(value)` custom hook using `useRef` and `useEffect`." },
      { id: "now", text: "Show the current count in `data-testid=\"now\"`; **Increment** adds 1." },
      { id: "before", text: "Show the previous count in `data-testid=\"before\"`, or `none` on the first render." },
    ],
    starterCode: `import { useState } from 'react';

// TODO: write usePrevious(value)

export default function App() {
  const [count, setCount] = useState(0);
  const previous = undefined;

  return (
    <div>
      <p>Now: <span data-testid="now">{count}</span></p>
      <p>Before: <span data-testid="before">{previous ?? 'none'}</span></p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useRef, useState } from 'react';

function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default function App() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count);

  return (
    <div>
      <p>Now: <span data-testid="now">{count}</span></p>
      <p>Before: <span data-testid="before">{previous ?? 'none'}</span></p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
`,
    checks: [
      { id: "defines", requirementId: "hook", label: "Defines usePrevious", kind: "static", rule: { rule: "definesFunction", name: "usePrevious" } },
      { id: "use-ref", requirementId: "hook", label: "Uses useRef", kind: "static", rule: { rule: "usesHook", hook: "useRef" } },
      { id: "use-effect", requirementId: "hook", label: "Uses useEffect", kind: "static", rule: { rule: "usesHook", hook: "useEffect" } },
      {
        id: "now",
        requirementId: "now",
        label: "Shows the current count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("now").textContent?.trim(), "now").toBe("0");
          await t.click(t.screen.getByRole("button", { name: "Increment" }));
          t.expect(t.screen.getByTestId("now").textContent?.trim(), "now after one click").toBe("1");
        },
      },
      {
        id: "before",
        requirementId: "before",
        label: "Shows the previous count",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("before").textContent?.trim(), "before on first render").toBe("none");
          const increment = t.screen.getByRole("button", { name: "Increment" });
          await t.click(increment);
          t.expect(t.screen.getByTestId("before").textContent?.trim(), "before after one click").toBe("0");
          await t.click(increment);
          await t.click(increment);
          t.expect(t.screen.getByTestId("now").textContent?.trim(), "now after three clicks").toBe("3");
          t.expect(t.screen.getByTestId("before").textContent?.trim(), "before after three clicks").toBe("2");
        },
      },
    ],
  },
  {
    id: "refs-dropdown-outside-click",
    topic: "refs",
    title: "Dropdown that closes on outside click",
    difficulty: "Hard",
    solutionExplanation: `Put a ref on the dropdown root. An effect adds a document \`mousedown\` listener: if the event target isn't inside that node, close the menu. Always remove the listener in the effect cleanup.`,

    description: `Build a dropdown menu that closes when you click anywhere outside it.

Attach a ref to the dropdown's wrapper, listen for \`mousedown\` on \`document\`, and close the menu when the event target isn't inside \`ref.current\`.`,
    requirements: [
      { id: "toggle", text: "The **Menu** button toggles a `role=\"menu\"` list with `role=\"menuitem\"` buttons: Profile, Settings, Log out." },
      { id: "select", text: "Choosing an item closes the menu and shows `Selected: <item>`." },
      { id: "outside", text: "A mousedown outside the dropdown (e.g. on `data-testid=\"outside\"`) closes the menu. Clicks inside it don't." },
      { id: "cleanup", text: "Use a ref for the \"inside\" test and remove the document listener in the effect cleanup." },
    ],
    starterCode: `import { useState } from 'react';

const items = ['Profile', 'Settings', 'Log out'];

function Dropdown({ onSelect }) {
  const [open, setOpen] = useState(false);

  // TODO: close the menu when clicking outside of it
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)}>Menu</button>
      {open && (
        <ul role="menu" style={{ position: 'absolute', listStyle: 'none', padding: 4, margin: 0, background: 'white', border: '1px solid #ccc' }}>
          {items.map((item) => (
            <li key={item}>
              <button role="menuitem" onClick={() => onSelect(item)}>{item}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <Dropdown onSelect={setSelected} />
      <p data-testid="outside">{selected ? 'Selected: ' + selected : 'Nothing selected'}</p>
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useRef, useState } from 'react';

const items = ['Profile', 'Settings', 'Log out'];

function Dropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event) {
      if (!wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)}>Menu</button>
      {open && (
        <ul role="menu" style={{ position: 'absolute', listStyle: 'none', padding: 4, margin: 0, background: 'white', border: '1px solid #ccc' }}>
          {items.map((item) => (
            <li key={item}>
              <button
                role="menuitem"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <Dropdown onSelect={setSelected} />
      <p data-testid="outside">{selected ? 'Selected: ' + selected : 'Nothing selected'}</p>
    </div>
  );
}
`,
    checks: [
      {
        id: "toggle",
        requirementId: "toggle",
        label: "Menu toggles the menu",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByRole("menu"), "The menu should start closed.");
          await t.click(t.screen.getByRole("button", { name: "Menu" }));
          const menu = t.screen.queryByRole("menu");
          t.assert(menu, 'Clicking "Menu" should show an element with role="menu".');
          t.expect(t.within(menu).queryAllByRole("menuitem").map((el) => el.textContent?.trim()), "Menu items").toEqual(["Profile", "Settings", "Log out"]);
          await t.click(t.screen.getByRole("button", { name: "Menu" }));
          t.assert(!t.screen.queryByRole("menu"), 'Clicking "Menu" again should close the menu.');
        },
      },
      {
        id: "select",
        requirementId: "select",
        label: "Selecting an item closes the menu",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Menu" }));
          await t.click(t.screen.getByRole("menuitem", { name: "Settings" }));
          t.assert(t.screen.queryByText("Selected: Settings"), 'Choosing "Settings" should show "Selected: Settings".');
          t.assert(!t.screen.queryByRole("menu"), "Choosing an item should close the menu.");
        },
      },
      {
        id: "outside",
        requirementId: "outside",
        label: "Outside mousedown closes, inside doesn't",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Menu" }));
          const { MouseEvent } = t.window as unknown as typeof globalThis;
          t.screen.getByRole("menu").dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          await t.sleep(0);
          t.assert(t.screen.queryByRole("menu"), "A mousedown inside the menu should not close it.");
          await t.click(t.screen.getByTestId("outside"));
          t.assert(!t.screen.queryByRole("menu"), "A mousedown outside the dropdown should close the menu.");
        },
      },
      {
        id: "listener-cleanup",
        requirementId: "cleanup",
        label: "Document listeners are removed",
        kind: "runtime",
        async run(t: TestApi) {
          let active = 0;
          const events = ["mousedown", "click", "pointerdown"];
          for (const target of [t.document, t.window] as EventTarget[]) {
            const add = target.addEventListener;
            const remove = target.removeEventListener;
            target.addEventListener = function (type: string, ...rest: unknown[]) {
              if (events.includes(type)) active++;
              return (add as (...args: unknown[]) => void).call(this, type, ...rest);
            };
            target.removeEventListener = function (type: string, ...rest: unknown[]) {
              if (events.includes(type)) active--;
              return (remove as (...args: unknown[]) => void).call(this, type, ...rest);
            };
          }
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Menu" }));
          t.assert(active > 0, "No mousedown/click listener was added on document while the menu is open.");
          await t.unmount();
          t.expect(active, "Document listeners left after unmounting (remove them in the effect cleanup)").toBe(0);
        },
      },
      { id: "use-ref", requirementId: "cleanup", label: "Uses useRef", kind: "static", rule: { rule: "usesHook", hook: "useRef" } },
      { id: "has-cleanup", requirementId: "cleanup", label: "The listener effect returns a cleanup", kind: "static", rule: { rule: "effectHasCleanup" } },
    ],
  },
];
