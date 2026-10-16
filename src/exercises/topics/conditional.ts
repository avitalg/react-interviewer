import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const conditionalExercises: Exercise[] = [
  {
    id: "cond-login",
    topic: "conditional",
    title: "Logged in / logged out",
    difficulty: "Easy",
    solutionExplanation: `A \`loggedIn\` boolean chooses which UI to render — don't show both. For the message count, use a ternary (\`count > 0 ? … : null\`) instead of \`count && …\`, which would print a stray \`0\` when the count is zero.`,
    description: `Show different UI depending on whether the user is logged in.

Watch out for the classic \`&&\` trap: \`{count && <p>…</p>}\` renders a stray **0** when \`count\` is 0.`,
    requirements: [
      { id: "logged-out", text: "When logged out (the initial state), show `Please log in` and a **Log in** button." },
      { id: "logged-in", text: "When logged in, show `Welcome back, Ada!` and a **Log out** button instead. Log out goes back to the logged-out view." },
      { id: "messages", text: "When logged in, show `You have 3 new messages` and a **Read all** button that sets the count to 0." },
      { id: "no-zero", text: "With 0 messages, render nothing for the messages line (no stray `0`)." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState(3);

  return (
    <div>
      <h2>Welcome back, Ada!</h2>
      <button onClick={() => setIsLoggedIn(!isLoggedIn)}>Log out</button>
      {messages && <p>You have {messages} new messages</p>}
      <button onClick={() => setMessages(0)}>Read all</button>
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState(3);

  if (!isLoggedIn) {
    return (
      <div>
        <h2>Please log in</h2>
        <button onClick={() => setIsLoggedIn(true)}>Log in</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome back, Ada!</h2>
      <button onClick={() => setIsLoggedIn(false)}>Log out</button>
      {messages > 0 && (
        <>
          <p>You have {messages} new messages</p>
          <button onClick={() => setMessages(0)}>Read all</button>
        </>
      )}
    </div>
  );
}
`,
    checks: [
      {
        id: "logged-out",
        requirementId: "logged-out",
        label: "Starts logged out",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByText("Please log in"), 'Initially show "Please log in".');
          t.assert(t.screen.queryByRole("button", { name: "Log in" }), 'Initially show a "Log in" button.');
          t.assert(!t.screen.queryByText("Welcome back, Ada!"), 'Don\'t show "Welcome back, Ada!" while logged out.');
        },
      },
      {
        id: "logged-in",
        requirementId: "logged-in",
        label: "Log in and Log out switch views",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Log in" }));
          t.assert(t.screen.queryByText("Welcome back, Ada!"), 'After logging in, show "Welcome back, Ada!".');
          t.assert(!t.screen.queryByText("Please log in"), 'Hide "Please log in" after logging in.');
          await t.click(t.screen.getByRole("button", { name: "Log out" }));
          t.assert(t.screen.queryByText("Please log in"), 'After logging out, show "Please log in" again.');
        },
      },
      {
        id: "messages",
        requirementId: "messages",
        label: "Shows unread messages when logged in",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByText(/new messages/), "Don't show messages while logged out.");
          await t.click(t.screen.getByRole("button", { name: "Log in" }));
          t.assert(t.screen.queryByText("You have 3 new messages"), 'Show "You have 3 new messages" when logged in.');
          await t.click(t.screen.getByRole("button", { name: "Read all" }));
          t.assert(!t.screen.queryByText(/new messages/), 'After "Read all", the messages line should disappear.');
        },
      },
      {
        id: "no-zero",
        requirementId: "no-zero",
        label: "No stray 0 with no messages",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Log in" }));
          await t.click(t.screen.getByRole("button", { name: "Read all" }));
          const text = t.document.body.textContent ?? "";
          t.assert(!/\b0\b/.test(text), `A stray "0" is rendered: "${text.trim()}". Use \`messages > 0 && …\` instead of \`messages && …\`.`);
        },
      },
    ],
  },
  {
    id: "cond-accordion",
    topic: "conditional",
    title: "Accordion (one open at a time)",
    difficulty: "Medium",
    solutionExplanation: `Store the open section's id (or \`null\` if none). Clicking the open one closes it; opening another replaces it. \`aria-expanded\` on each button should match that state so the accordion is usable with a screen reader.`,

    description: `Build an FAQ accordion where **only one** item can be open at a time.

In the starter code, each item keeps its own \`isOpen\` state, so several can be open at once. Lift the state up into the parent.`,
    requirements: [
      { id: "closed", text: "All items start closed: only the question buttons are shown." },
      { id: "toggle", text: "Clicking a question shows its answer. Clicking it again closes it." },
      { id: "single", text: "Opening one item closes any other open item." },
      { id: "aria", text: "Each question button has `aria-expanded` set to `true` or `false`." },
    ],
    starterCode: `import { useState } from 'react';

const faqs = [
  { id: 'react', question: 'What is React?', answer: 'A JavaScript library for building user interfaces.' },
  { id: 'jsx', question: 'What is JSX?', answer: 'A syntax extension that lets you write markup in JavaScript.' },
  { id: 'hooks', question: 'What are hooks?', answer: 'Functions that let components use state and other React features.' },
];

function AccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>{question}</button>
      {isOpen && <p>{answer}</p>}
    </div>
  );
}

export default function App() {
  return (
    <div>
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}
`,
    referenceSolution: `import { useState } from 'react';

const faqs = [
  { id: 'react', question: 'What is React?', answer: 'A JavaScript library for building user interfaces.' },
  { id: 'jsx', question: 'What is JSX?', answer: 'A syntax extension that lets you write markup in JavaScript.' },
  { id: 'hooks', question: 'What are hooks?', answer: 'Functions that let components use state and other React features.' },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div>
      <button aria-expanded={isOpen} onClick={onToggle}>
        {question}
      </button>
      {isOpen && <p>{answer}</p>}
    </div>
  );
}

export default function App() {
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.id}
          question={faq.question}
          answer={faq.answer}
          isOpen={openId === faq.id}
          onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
        />
      ))}
    </div>
  );
}
`,
    checks: [
      {
        id: "closed",
        requirementId: "closed",
        label: "All items start closed",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.expect(t.screen.queryAllByRole("button").length, "Question buttons").toBe(3);
          t.assert(!t.screen.queryByText(/A JavaScript library/), "Answers should be hidden initially.");
        },
      },
      {
        id: "toggle",
        requirementId: "toggle",
        label: "Clicking a question toggles its answer",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const question = t.screen.getByRole("button", { name: "What is JSX?" });
          await t.click(question);
          t.assert(t.screen.queryByText("A syntax extension that lets you write markup in JavaScript."), "Clicking a question should show its answer.");
          await t.click(t.screen.getByRole("button", { name: "What is JSX?" }));
          t.assert(!t.screen.queryByText(/A syntax extension/), "Clicking an open question again should close it.");
        },
      },
      {
        id: "single",
        requirementId: "single",
        label: "Only one item is open at a time",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "What is React?" }));
          await t.click(t.screen.getByRole("button", { name: "What are hooks?" }));
          t.assert(t.screen.queryByText(/Functions that let components/), "The clicked item should be open.");
          t.assert(!t.screen.queryByText(/A JavaScript library/), "Opening an item should close the previously open one.");
        },
      },
      {
        id: "aria",
        requirementId: "aria",
        label: "Buttons expose aria-expanded",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const expanded = () => t.screen.getAllByRole("button").map((b) => b.getAttribute("aria-expanded"));
          t.expect(expanded(), "aria-expanded before opening").toEqual(["false", "false", "false"]);
          await t.click(t.screen.getByRole("button", { name: "What is JSX?" }));
          t.expect(expanded(), "aria-expanded after opening the second item").toEqual(["false", "true", "false"]);
        },
      },
    ],
  },
  {
    id: "cond-modal",
    topic: "conditional",
    title: "Accessible modal",
    difficulty: "Hard",
    solutionExplanation: `Don't render the dialog at all when it's closed. Listen for Escape in an effect and remove the listener in cleanup. Backdrop clicks close the modal; clicks inside the dialog should not.`,

    description: `Build a modal dialog that opens from a button and can be dismissed three ways: the **Close** button, the **Escape** key, and clicking the backdrop.

Listening for Escape means adding a \`keydown\` listener on \`document\` while the modal is open, and removing it when it closes.`,
    requirements: [
      { id: "open", text: "**Open modal** shows the dialog: an element with `role=\"dialog\"` and `aria-modal=\"true\"`, containing the heading `Subscribe` and a **Close** button." },
      { id: "close", text: "**Close** hides the dialog." },
      { id: "escape", text: "Pressing Escape closes the dialog. Add the listener in an effect and remove it in the cleanup." },
      { id: "backdrop", text: "Clicking the backdrop (`data-testid=\"backdrop\"`) closes the dialog, but clicking inside the dialog does not." },
    ],
    starterCode: `import { useState } from 'react';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open modal</button>
      {open && (
        <div
          data-testid="backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}
        >
          <div style={{ background: 'white', padding: 24, borderRadius: 8 }}>
            <h2>Subscribe</h2>
            <p>One email a month. No spam.</p>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
`,
    referenceSolution: `import { useEffect, useState } from 'react';

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      data-testid="backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ background: 'white', padding: 24, borderRadius: 8 }}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open modal</button>
      {open && (
        <Modal title="Subscribe" onClose={() => setOpen(false)}>
          <p>One email a month. No spam.</p>
        </Modal>
      )}
    </div>
  );
}
`,
    checks: [
      {
        id: "open",
        requirementId: "open",
        label: "Open modal shows an accessible dialog",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(!t.screen.queryByText("Subscribe"), "The dialog should be closed initially.");
          await t.click(t.screen.getByRole("button", { name: "Open modal" }));
          const dialog = t.screen.queryByRole("dialog");
          t.assert(dialog, 'After clicking "Open modal", render an element with role="dialog".');
          t.expect(dialog.getAttribute("aria-modal"), 'The dialog\'s aria-modal attribute').toBe("true");
          t.assert(t.within(dialog).queryByRole("heading", { name: "Subscribe" }), 'The dialog should contain the heading "Subscribe".');
          t.assert(t.within(dialog).queryByRole("button", { name: "Close" }), 'The dialog should contain a "Close" button.');
        },
      },
      {
        id: "close",
        requirementId: "close",
        label: "Close hides the dialog",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Open modal" }));
          await t.click(t.screen.getByRole("button", { name: "Close" }));
          t.assert(!t.screen.queryByText("Subscribe"), "Clicking Close should hide the dialog.");
        },
      },
      {
        id: "escape",
        requirementId: "escape",
        label: "Escape closes the dialog",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Open modal" }));
          await t.keyDown(t.document, "Escape");
          t.assert(!t.screen.queryByText("Subscribe"), "Pressing Escape should close the dialog.");
        },
      },
      {
        id: "listener-cleanup",
        requirementId: "escape",
        label: "The keydown listener is removed on close",
        kind: "runtime",
        async run(t: TestApi) {
          let active = 0;
          for (const target of [t.document, t.window] as EventTarget[]) {
            const add = target.addEventListener;
            const remove = target.removeEventListener;
            target.addEventListener = function (type: string, ...rest: unknown[]) {
              if (type === "keydown") active++;
              return (add as (...args: unknown[]) => void).call(this, type, ...rest);
            };
            target.removeEventListener = function (type: string, ...rest: unknown[]) {
              if (type === "keydown") active--;
              return (remove as (...args: unknown[]) => void).call(this, type, ...rest);
            };
          }
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Open modal" }));
          t.assert(active > 0, "No keydown listener was added on document while the dialog is open.");
          await t.click(t.screen.getByRole("button", { name: "Close" }));
          t.expect(active, "keydown listeners left after closing (remove it in the effect cleanup)").toBe(0);
        },
      },
      {
        id: "backdrop",
        requirementId: "backdrop",
        label: "Backdrop click closes, inside click doesn't",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Open modal" }));
          await t.click(t.screen.getByText("One email a month. No spam."));
          t.assert(t.screen.queryByText("Subscribe"), "Clicking inside the dialog should not close it.");
          await t.click(t.screen.getByTestId("backdrop"));
          t.assert(!t.screen.queryByText("Subscribe"), "Clicking the backdrop should close the dialog.");
        },
      },
    ],
  },
];
