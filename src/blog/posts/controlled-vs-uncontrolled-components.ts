import type { Article } from "../types";

export const post: Article = {
  slug: "controlled-vs-uncontrolled-components",
  title: "Controlled vs uncontrolled components in React interviews",
  description:
    "How to explain controlled and uncontrolled inputs in React, when each is appropriate, and how to build forms interviewers expect to see.",
  date: "2026-09-20",
  tags: ["forms", "controlled inputs", "events"],
  relatedExercises: ["forms-live-greeting", "forms-signup", "forms-guest-list"],
  body: `Form questions look simple and then grow a validation rule, a character counter, and a submit button that should stay disabled. The fork at the start is: **is React the source of truth for this input?**

## Controlled: React owns the value

A controlled input has \`value\` (or \`checked\`) **and** \`onChange\`. State lives in React. The UI is a function of that state: the greeting, the remaining characters, whether submit is enabled.

\`\`\`
const [name, setName] = useState("");

<input
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
\`\`\`

This is the default interview answer. You can derive everything else: \`Hello, ${"${name || \"stranger\"}"}!\`, \`${"${name.length}"}/20\`, \`disabled={name.trim() === ""}\`.

Build that in [live greeting](/exercise/forms-live-greeting). Then a [signup form](/exercise/forms-signup) with more fields and a clear invalid/valid story.

## Uncontrolled: the DOM owns the value

An uncontrolled input uses \`defaultValue\` and a ref if you need to read it on submit. React does not re-render on every keystroke.

Useful when:

- You are wrapping a non-React widget.
- The field is write-once until submit (a file input is the honest example).
- You are integrating a legacy form.

Interviewers still want you to **prefer controlled** for text fields in app UI, because validation and sibling UI stay in sync.

If you only attach \`onChange\` and never set \`value\`, you have an uncontrolled input with a listener — easy to get out of sync. If you set \`value\` without \`onChange\`, the input is read-only and React will warn.

## Lifting state

When two components need the same draft (an input and a preview), the state lives in the nearest parent. That is not a new API; it is the same controlled pattern one level up.

A [guest list](/exercise/forms-guest-list) is the next step: one input, a list of submitted names, prevent duplicates, keep the input controlled after submit (usually clear it).

## Checkboxes, radios, and selects

Same rule. Checkboxes use \`checked\` + \`onChange\` with \`event.target.checked\`. Selects use \`value\` + \`onChange\`. Do not mix \`defaultChecked\` with later \`checked\` updates.

## Validation without a library

Interviews almost never want Formik. They want:

- Derive \`errors\` from current state during render, or
- Show errors after \`submitAttempted\` is true.

Either is fine. Say which UX you chose. Disable submit when the derived form is invalid if that matches the prompt.

## The answer to give

"I use controlled inputs so the value, the validation, and the rest of the UI share one state. Uncontrolled is for DOM-only fields or third-party widgets. I never mutate the input through the DOM when React is driving it."

Then complete [live greeting](/exercise/forms-live-greeting) and [signup](/exercise/forms-signup) under a timer.
`,
};
