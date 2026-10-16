import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const formsExercises: Exercise[] = [
  {
    id: "forms-live-greeting",
    topic: "forms",
    title: "Live greeting input",
    difficulty: "Easy",
    solutionExplanation: `Make the input controlled: \`value\` and \`onChange\` both come from one piece of state. The greeting, character count, and Clear button all derive from that string — no extra state needed.`,
    description: `Turn the input into a **controlled input**: React state is the single source of truth for its value, and the UI derives everything else from that state.`,
    requirements: [
      { id: "label", text: "The input is labelled `Name` (with a `<label>`)." },
      { id: "greeting", text: "Below it, show `Hello, <name>!` as you type, or `Hello, stranger!` when the input is empty." },
      { id: "counter", text: "Show a character counter like `3/20`, and limit the name to 20 characters (`maxLength`)." },
      { id: "clear", text: "A **Clear** button empties the input." },
      { id: "controlled", text: "The input is controlled: it has both `value` and `onChange`." },
    ],
    starterCode: `export default function App() {
  let name = '';

  return (
    <div>
      <label>
        Name <input onChange={(e) => { name = e.target.value; }} />
      </label>
      <p>Hello, {name}!</p>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

const MAX_LENGTH = 20;

export default function App() {
  const [name, setName] = useState('');

  return (
    <div>
      <label>
        Name{' '}
        <input value={name} maxLength={MAX_LENGTH} onChange={(e) => setName(e.target.value)} />
      </label>
      <button onClick={() => setName('')}>Clear</button>
      <p>Hello, {name.trim() || 'stranger'}!</p>
      <p>{name.length}/{MAX_LENGTH}</p>
    </div>
  );
}
`,
    checks: [
      {
        id: "label",
        requirementId: "label",
        label: "The input is labelled Name",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.queryByLabelText("Name");
          t.assert(input && input.tagName === "INPUT", 'Expected an <input> labelled "Name".');
        },
      },
      {
        id: "greeting",
        requirementId: "greeting",
        label: "The greeting follows the input",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByText("Hello, stranger!"), 'With an empty input, show "Hello, stranger!".');
          await t.type(t.screen.getByLabelText("Name"), "Ada");
          t.assert(t.screen.queryByText("Hello, Ada!"), 'After typing "Ada", show "Hello, Ada!".');
        },
      },
      {
        id: "counter",
        requirementId: "counter",
        label: "Shows N/20 and limits to 20 characters",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByLabelText("Name") as HTMLInputElement;
          t.assert(t.screen.queryByText("0/20"), 'Show a "0/20" counter for an empty input.');
          await t.type(input, "Ada");
          t.assert(t.screen.queryByText("3/20"), 'After typing "Ada", the counter should read "3/20".');
          t.expect(input.maxLength, "The input's maxLength").toBe(20);
        },
      },
      {
        id: "clear",
        requirementId: "clear",
        label: "Clear empties the input",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const input = t.screen.getByLabelText("Name") as HTMLInputElement;
          await t.type(input, "Grace");
          await t.click(t.screen.getByRole("button", { name: "Clear" }));
          t.expect(input.value, "Input value after Clear").toBe("");
          t.assert(t.screen.queryByText("Hello, stranger!"), 'After Clear, the greeting should go back to "Hello, stranger!".');
        },
      },
      { id: "controlled", requirementId: "controlled", label: "Inputs are controlled", kind: "static", rule: { rule: "controlledInputs" } },
    ],
  },
  {
    id: "forms-tip-calculator",
    topic: "forms",
    title: "Live tip calculator",
    difficulty: "Easy",
    solutionExplanation: `Keep bill and tip percent in state and compute tip and total during render. There is no Calculate button — \`onChange\` is enough because a re-render already has the new values.`,
    description: `Read the inputs as the user types and show the tip and total immediately. No submit or Calculate button.`,
    requirements: [
      { id: "fields", text: "Controlled inputs labelled `Bill` and `Tip %`." },
      { id: "live", text: "As you type, show `Tip: $1.50` and `Total: $11.50` for a $10 bill and 15% tip (two decimal places). Empty or invalid numbers count as 0." },
      { id: "no-button", text: "No button — the amounts come from the inputs alone." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [bill, setBill] = useState('');
  const [tip, setTip] = useState('');
  const [total, setTotal] = useState(null);

  function calculate() {
    const amount = Number(bill);
    const percent = Number(tip);
    setTotal(amount + (amount * percent) / 100);
  }

  return (
    <div>
      <label>
        Bill <input value={bill} onChange={(e) => setBill(e.target.value)} />
      </label>
      <label>
        Tip % <input value={tip} onChange={(e) => setTip(e.target.value)} />
      </label>
      <button onClick={calculate}>Calculate</button>
      {total != null && <p>Total: \${total.toFixed(2)}</p>}
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function App() {
  const [bill, setBill] = useState('');
  const [tip, setTip] = useState('');

  const amount = money(bill);
  const percent = money(tip);
  const tipAmount = (amount * percent) / 100;
  const total = amount + tipAmount;

  return (
    <div>
      <label>
        Bill <input value={bill} onChange={(e) => setBill(e.target.value)} />
      </label>
      <label>
        Tip % <input value={tip} onChange={(e) => setTip(e.target.value)} />
      </label>
      <p>Tip: \${tipAmount.toFixed(2)}</p>
      <p>Total: \${total.toFixed(2)}</p>
    </div>
  );
}
`,
    checks: [
      {
        id: "fields",
        requirementId: "fields",
        label: "Has labelled Bill and Tip % inputs",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByLabelText("Bill"), 'Expected an input labelled "Bill".');
          t.assert(t.screen.queryByLabelText("Tip %"), 'Expected an input labelled "Tip %".');
        },
      },
      {
        id: "live",
        requirementId: "live",
        label: "Tip and total update as you type",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const bill = t.screen.getByLabelText("Bill");
          const tip = t.screen.getByLabelText("Tip %");
          await t.type(bill, "10");
          await t.type(tip, "15");
          t.assert(t.screen.queryByText("Tip: $1.50"), 'A $10 bill at 15% should show "Tip: $1.50".');
          t.assert(t.screen.queryByText("Total: $11.50"), 'A $10 bill at 15% should show "Total: $11.50".');
        },
      },
      {
        id: "no-button",
        requirementId: "no-button",
        label: "There is no Calculate or submit button",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByRole("button"), "Don't use a button — derive tip and total from the inputs.");
        },
      },
      { id: "controlled", requirementId: "fields", label: "Inputs are controlled", kind: "static", rule: { rule: "controlledInputs" } },
    ],
  },
  {
    id: "forms-temperature",
    topic: "forms",
    title: "Celsius / Fahrenheit converter",
    difficulty: "Medium",
    solutionExplanation: `Keep both fields in state. On each \`onChange\`, write the field the user typed and convert the other (\`C × 9/5 + 32\` and \`(F − 32) × 5/9\`). An empty string clears both so you are not converting \`NaN\`.`,
    description: `Convert between Celsius and Fahrenheit as the user types. No Convert button — each input is the source of the other value.`,
    requirements: [
      { id: "fields", text: "Controlled inputs labelled `Celsius` and `Fahrenheit`." },
      { id: "convert", text: "Typing a number in one field updates the other immediately (`C × 9/5 + 32`, `(F − 32) × 5/9`). Clearing one field clears the other." },
      { id: "no-button", text: "No Convert or submit button." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [celsius, setCelsius] = useState('');
  const [fahrenheit, setFahrenheit] = useState('');

  function convert() {
    setFahrenheit(String(Number(celsius) * (9 / 5) + 32));
  }

  return (
    <div>
      <label>
        Celsius <input value={celsius} onChange={(e) => setCelsius(e.target.value)} />
      </label>
      <button onClick={convert}>Convert</button>
      <label>
        Fahrenheit <input value={fahrenheit} readOnly />
      </label>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

function toFahrenheit(celsius) {
  return Number(celsius) * (9 / 5) + 32;
}

function toCelsius(fahrenheit) {
  return ((Number(fahrenheit) - 32) * 5) / 9;
}

export default function App() {
  const [celsius, setCelsius] = useState('');
  const [fahrenheit, setFahrenheit] = useState('');

  function onCelsius(event) {
    const next = event.target.value;
    setCelsius(next);
    setFahrenheit(next === '' ? '' : String(toFahrenheit(next)));
  }

  function onFahrenheit(event) {
    const next = event.target.value;
    setFahrenheit(next);
    setCelsius(next === '' ? '' : String(toCelsius(next)));
  }

  return (
    <div>
      <label>
        Celsius <input value={celsius} onChange={onCelsius} />
      </label>
      <label>
        Fahrenheit <input value={fahrenheit} onChange={onFahrenheit} />
      </label>
    </div>
  );
}
`,
    checks: [
      {
        id: "fields",
        requirementId: "fields",
        label: "Has labelled Celsius and Fahrenheit inputs",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByLabelText("Celsius"), 'Expected an input labelled "Celsius".');
          t.assert(t.screen.queryByLabelText("Fahrenheit"), 'Expected an input labelled "Fahrenheit".');
        },
      },
      {
        id: "convert",
        requirementId: "convert",
        label: "Each input updates the other as you type",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const celsius = t.screen.getByLabelText("Celsius") as HTMLInputElement;
          const fahrenheit = t.screen.getByLabelText("Fahrenheit") as HTMLInputElement;
          await t.type(celsius, "100");
          t.expect(fahrenheit.value, "Fahrenheit after typing 100°C").toBe("212");
          await t.clear(celsius);
          t.expect(celsius.value, "Celsius after clear").toBe("");
          t.expect(fahrenheit.value, "Fahrenheit after clearing Celsius").toBe("");
          await t.type(fahrenheit, "32");
          t.expect(celsius.value, "Celsius after typing 32°F").toBe("0");
        },
      },
      {
        id: "no-button",
        requirementId: "no-button",
        label: "There is no Convert or submit button",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByRole("button"), "Don't use a button — convert in onChange.");
        },
      },
      { id: "controlled", requirementId: "fields", label: "Inputs are controlled", kind: "static", rule: { rule: "controlledInputs" } },
    ],
  },
  {
    id: "forms-signup",
    topic: "forms",
    title: "Sign-up form with validation",
    difficulty: "Medium",
    solutionExplanation: `Keep the fields in one state object and handle \`onSubmit\` on the form (with \`preventDefault\`) so Enter works. Validate email, password length, and match on submit, and show only the errors that apply.`,

    description: `Build a sign-up form that validates on submit and shows clear error messages next to the fields.`,
    requirements: [
      { id: "fields", text: "A `<form>` with inputs labelled `Email`, `Password` and `Confirm password` (password inputs use `type=\"password\"`), and a **Sign up** submit button." },
      { id: "prevent", text: "Submitting does not reload the page (`event.preventDefault()`)." },
      { id: "errors", text: "On submit, show `Enter a valid email` for an invalid email, `Password must be at least 8 characters`, and `Passwords do not match`, as applicable. Only show errors that apply." },
      { id: "success", text: "When everything is valid, show `Welcome, <email>!` instead of any errors." },
    ],
    starterCode: `export default function App() {
  function handleSubmit(event) {
    // TODO: validate the fields
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email <input type="email" />
      </label>
      <label>
        Password <input type="password" />
      </label>
      <button>Sign up</button>
    </form>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

function validate({ email, password, confirm }) {
  const errors = {};
  if (!/^\\S+@\\S+\\.\\S+$/.test(email)) errors.email = 'Enter a valid email';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (confirm !== password) errors.confirm = 'Passwords do not match';
  return errors;
}

export default function App() {
  const [values, setValues] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0 ? values.email : null);
  }

  if (submitted) return <p>Welcome, {submitted}!</p>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Email <input name="email" type="email" value={values.email} onChange={handleChange} />
      </label>
      {errors.email && <p role="alert">{errors.email}</p>}
      <label>
        Password <input name="password" type="password" value={values.password} onChange={handleChange} />
      </label>
      {errors.password && <p role="alert">{errors.password}</p>}
      <label>
        Confirm password <input name="confirm" type="password" value={values.confirm} onChange={handleChange} />
      </label>
      {errors.confirm && <p role="alert">{errors.confirm}</p>}
      <button type="submit">Sign up</button>
    </form>
  );
}
`,
    checks: [
      {
        id: "fields",
        requirementId: "fields",
        label: "Has labelled Email, Password and Confirm password fields",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByLabelText("Email"), 'Expected an input labelled "Email".');
          const password = t.screen.queryByLabelText("Password") as HTMLInputElement | null;
          const confirm = t.screen.queryByLabelText("Confirm password") as HTMLInputElement | null;
          t.assert(password, 'Expected an input labelled "Password".');
          t.assert(confirm, 'Expected an input labelled "Confirm password".');
          t.assert(password.type === "password" && confirm.type === "password", 'Password fields should use type="password".');
          const button = t.screen.getByRole("button", { name: "Sign up" });
          t.assert(button.closest("form"), 'The "Sign up" button should be inside a <form>.');
        },
      },
      {
        id: "prevent",
        requirementId: "prevent",
        label: "Submitting doesn't reload the page",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Sign up" }));
          t.expect(t.submitsWithoutPreventDefault, "Form submissions that would reload the page").toBe(0);
        },
      },
      {
        id: "errors",
        requirementId: "errors",
        label: "Shows only the errors that apply",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Sign up" }));
          t.assert(t.screen.queryByText("Enter a valid email"), 'An empty email should show "Enter a valid email".');
          t.assert(t.screen.queryByText("Password must be at least 8 characters"), 'An empty password should show "Password must be at least 8 characters".');
          await t.type(t.screen.getByLabelText("Email"), "ada@example.com");
          await t.type(t.screen.getByLabelText("Password"), "analytical");
          await t.type(t.screen.getByLabelText("Confirm password"), "analytics");
          await t.click(t.screen.getByRole("button", { name: "Sign up" }));
          t.assert(t.screen.queryByText("Passwords do not match"), 'Different passwords should show "Passwords do not match".');
          t.assert(!t.screen.queryByText("Enter a valid email"), "The email error should disappear once the email is valid.");
          t.assert(!t.screen.queryByText("Password must be at least 8 characters"), "The length error should disappear once the password is long enough.");
        },
      },
      {
        id: "success",
        requirementId: "success",
        label: "A valid form shows the welcome message",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByLabelText("Email"), "ada@example.com");
          await t.type(t.screen.getByLabelText("Password"), "analytical");
          await t.type(t.screen.getByLabelText("Confirm password"), "analytical");
          await t.click(t.screen.getByRole("button", { name: "Sign up" }));
          t.assert(t.screen.queryByText("Welcome, ada@example.com!"), 'A valid submission should show "Welcome, ada@example.com!".');
          t.assert(!t.screen.queryByText("Passwords do not match"), "No errors should be shown after a valid submission.");
        },
      },
    ],
  },
  {
    id: "forms-guest-list",
    topic: "forms",
    title: "Dynamic guest list",
    difficulty: "Hard",
    solutionExplanation: `Store rows as \`{id, name}[]\` with a stable id as the \`key\` — not the array index, or values jump when you remove a row. Add and remove immutably so the other inputs keep what the user typed.`,

    description: `Build a form with a **dynamic number of fields**: one text input per guest, with buttons to add and remove rows.

The starter code uses array indexes as keys and mutates state, two bugs that show up as soon as rows can be removed.`,
    requirements: [
      { id: "rows", text: "Start with one row. Each row is an `<li>` with an input (placeholder `Guest name`) and a **Remove** button." },
      { id: "add", text: "**Add guest** adds a new empty row at the end." },
      { id: "remove", text: "**Remove** deletes that row and keeps the other rows' values intact." },
      { id: "summary", text: "Show `Guests: A, C` (non-empty names in order, comma-separated) in `data-testid=\"summary\"`, or `Guests: none`." },
      { id: "immutable", text: "Give each row a stable id for its `key` (not the index), and update the array immutably." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [guests, setGuests] = useState(['']);

  function updateGuest(index, name) {
    guests[index] = name;
    setGuests([...guests]);
  }

  return (
    <div>
      <ul>
        {guests.map((guest, index) => (
          <li key={index}>
            <input placeholder="Guest name" value={guest} onChange={(e) => updateGuest(index, e.target.value)} />
          </li>
        ))}
      </ul>
      <button onClick={() => setGuests([...guests, ''])}>Add guest</button>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

let nextId = 2;

export default function App() {
  const [guests, setGuests] = useState([{ id: 1, name: '' }]);

  function updateGuest(id, name) {
    setGuests(guests.map((guest) => (guest.id === id ? { ...guest, name } : guest)));
  }

  function addGuest() {
    setGuests([...guests, { id: nextId++, name: '' }]);
  }

  function removeGuest(id) {
    setGuests(guests.filter((guest) => guest.id !== id));
  }

  const names = guests.map((guest) => guest.name.trim()).filter(Boolean);

  return (
    <div>
      <ul>
        {guests.map((guest) => (
          <li key={guest.id}>
            <input placeholder="Guest name" value={guest.name} onChange={(e) => updateGuest(guest.id, e.target.value)} />
            <button onClick={() => removeGuest(guest.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={addGuest}>Add guest</button>
      <p data-testid="summary">Guests: {names.length > 0 ? names.join(', ') : 'none'}</p>
    </div>
  );
}
`,
    checks: [
      {
        id: "rows",
        requirementId: "rows",
        label: "Starts with one row with an input and Remove",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const inputs = t.screen.$$('input[placeholder="Guest name"]');
          t.expect(inputs.length, "Rows on first render").toBe(1);
          const row = inputs[0].closest("li");
          t.assert(row, "Each row should be an <li>.");
          t.assert(t.within(row).queryByRole("button", { name: "Remove" }), 'Each row needs a "Remove" button.');
        },
      },
      {
        id: "add",
        requirementId: "add",
        label: "Add guest appends an empty row",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.$$('input[placeholder="Guest name"]')[0], "Ada");
          await t.click(t.screen.getByRole("button", { name: "Add guest" }));
          const inputs = t.screen.$$('input[placeholder="Guest name"]') as HTMLInputElement[];
          t.expect(inputs.map((input) => input.value), "Row values").toEqual(["Ada", ""]);
        },
      },
      {
        id: "remove",
        requirementId: "remove",
        label: "Remove deletes the right row",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const add = t.screen.getByRole("button", { name: "Add guest" });
          await t.click(add);
          await t.click(add);
          const inputs = t.screen.$$('input[placeholder="Guest name"]');
          await t.type(inputs[0], "Ada");
          await t.type(inputs[1], "Brendan");
          await t.type(inputs[2], "Charles");
          const second = inputs[1].closest("li");
          t.assert(second, "Each row should be an <li>.");
          await t.click(t.within(second).getByRole("button", { name: "Remove" }));
          const remaining = t.screen.$$('input[placeholder="Guest name"]') as HTMLInputElement[];
          t.expect(remaining.map((input) => input.value), "Row values after removing the second row").toEqual(["Ada", "Charles"]);
        },
      },
      {
        id: "summary",
        requirementId: "summary",
        label: "The summary lists non-empty names",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.getByTestId("summary").textContent?.trim(), "Summary with no names").toBe("Guests: none");
          const add = t.screen.getByRole("button", { name: "Add guest" });
          await t.click(add);
          await t.click(add);
          const inputs = t.screen.$$('input[placeholder="Guest name"]');
          await t.type(inputs[0], "Ada");
          await t.type(inputs[2], "Charles");
          t.expect(t.screen.getByTestId("summary").textContent?.trim(), "Summary").toBe("Guests: Ada, Charles");
        },
      },
      { id: "no-mutation", requirementId: "immutable", label: "State is not mutated", kind: "static", rule: { rule: "noStateMutation" } },
      { id: "stable-keys", requirementId: "immutable", label: "Keys are not array indexes", kind: "static", rule: { rule: "noIndexAsKey" } },
    ],
  },
];
