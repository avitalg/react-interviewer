import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const contextExercises: Exercise[] = [
  {
    id: "ctx-theme",
    topic: "context",
    title: "Theme context instead of prop drilling",
    difficulty: "Easy",
    description: `The starter code passes \`theme\` and \`onToggle\` through \`Page\` and \`Toolbar\`, which don't use them: they only forward them. That's **prop drilling**.

Refactor it to use context so \`ThemeButton\` and \`Page\` read the theme directly.`,
    requirements: [
      { id: "context", text: "Create a `ThemeContext` with `createContext` and provide the theme (and a way to toggle it) from `App`." },
      { id: "consume", text: "Components read the theme with `useContext` instead of receiving it through props." },
      { id: "behavior", text: "The page shows `Current theme: light` and a **Switch to dark** button. Clicking it switches to `dark` (and the button reads **Switch to light**)." },
      { id: "attribute", text: "The page's wrapper has a `data-theme` attribute with the current theme." },
    ],
    starterCode: `import { useState } from 'react';

function ThemeButton({ theme, onToggle }) {
  return (
    <button onClick={onToggle}>
      Switch to {theme === 'light' ? 'dark' : 'light'}
    </button>
  );
}

function Toolbar({ theme, onToggle }) {
  return (
    <div style={{ padding: 8, borderBottom: '1px solid #ccc' }}>
      <ThemeButton theme={theme} onToggle={onToggle} />
    </div>
  );
}

function Page({ theme, onToggle }) {
  return (
    <div
      data-theme={theme}
      style={{ background: theme === 'dark' ? '#111' : '#fff', color: theme === 'dark' ? '#eee' : '#111', padding: 16 }}
    >
      <Toolbar theme={theme} onToggle={onToggle} />
      <p>Current theme: {theme}</p>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return <Page theme={theme} onToggle={toggle} />;
}
`,
    referenceSolution: `import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button onClick={toggleTheme}>
      Switch to {theme === 'light' ? 'dark' : 'light'}
    </button>
  );
}

function Toolbar() {
  return (
    <div style={{ padding: 8, borderBottom: '1px solid #ccc' }}>
      <ThemeButton />
    </div>
  );
}

function Page() {
  const { theme } = useContext(ThemeContext);
  return (
    <div
      data-theme={theme}
      style={{ background: theme === 'dark' ? '#111' : '#fff', color: theme === 'dark' ? '#eee' : '#111', padding: 16 }}
    >
      <Toolbar />
      <p>Current theme: {theme}</p>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}
`,
    checks: [
      { id: "creates", requirementId: "context", label: "Creates a context", kind: "static", rule: { rule: "createsContext" } },
      { id: "use-context", requirementId: "consume", label: "Reads it with useContext", kind: "static", rule: { rule: "usesHook", hook: "useContext" } },
      {
        id: "behavior",
        requirementId: "behavior",
        label: "The button switches the theme",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByText("Current theme: light"), 'Initially show "Current theme: light".');
          await t.click(t.screen.getByRole("button", { name: "Switch to dark" }));
          t.assert(t.screen.queryByText("Current theme: dark"), 'After clicking, show "Current theme: dark".');
          t.assert(t.screen.queryByRole("button", { name: "Switch to light" }), 'The button should now read "Switch to light".');
        },
      },
      {
        id: "attribute",
        requirementId: "attribute",
        label: "data-theme follows the theme",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.$('[data-theme="light"]'), 'Expected an element with data-theme="light".');
          await t.click(t.screen.getByRole("button", { name: "Switch to dark" }));
          t.assert(t.screen.$('[data-theme="dark"]'), 'After switching, expected data-theme="dark".');
        },
      },
    ],
  },
  {
    id: "ctx-auth",
    topic: "context",
    title: "Auth provider and useAuth hook",
    difficulty: "Medium",
    description: `Build an \`AuthProvider\` that holds the signed-in user, plus a \`useAuth()\` hook for reading it.

A good custom context hook **fails loudly** when it's used outside its provider, instead of silently returning \`null\`.`,
    requirements: [
      { id: "provider", text: "Export an `AuthProvider` component that stores the user and provides `user`, `login(name)` and `logout()` through context." },
      { id: "hook", text: "Export a `useAuth()` hook that returns the context value and throws an error mentioning `AuthProvider` when used outside of it." },
      { id: "login", text: "When logged out, show an input labelled `Username` and a **Log in** button. Logging in shows `Signed in as <name>`." },
      { id: "logout", text: "When logged in, a **Log out** button signs the user out and shows the form again." },
    ],
    starterCode: `import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // TODO: provide user, login(name) and logout()
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  // TODO: throw a helpful error when used outside <AuthProvider>
  return useContext(AuthContext);
}

function LoginForm() {
  return (
    <div>
      <label>
        Username <input />
      </label>
      <button>Log in</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
`,
    referenceSolution: `import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      login: (name) => setUser({ name }),
      logout: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}

function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) login(name.trim());
      }}
    >
      <label>
        Username <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button type="submit">Log in</button>
    </form>
  );
}

function Account() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Signed in as {user.name}</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function Screen() {
  const { user } = useAuth();
  return user ? <Account /> : <LoginForm />;
}

export default function App() {
  return (
    <AuthProvider>
      <Screen />
    </AuthProvider>
  );
}
`,
    checks: [
      {
        id: "exports",
        requirementId: "provider",
        label: "Exports AuthProvider and useAuth",
        kind: "runtime",
        async run(t: TestApi) {
          t.assert(typeof t.exports.AuthProvider === "function", "Export an `AuthProvider` component.");
          t.assert(typeof t.exports.useAuth === "function", "Export a `useAuth` hook.");
        },
      },
      {
        id: "provides",
        requirementId: "provider",
        label: "useAuth exposes user, login and logout",
        kind: "runtime",
        async run(t: TestApi) {
          const { AuthProvider, useAuth } = t.exports;
          const React = t.React as { createElement: (...args: unknown[]) => unknown };
          let auth: { user: unknown; login: (name: string) => void; logout: () => void } | undefined;
          function Probe() {
            auth = useAuth();
            return null;
          }
          await t.render(() => React.createElement(AuthProvider, null, React.createElement(Probe)));
          t.assert(auth, "useAuth() returned nothing inside <AuthProvider>.");
          t.assert(typeof auth.login === "function" && typeof auth.logout === "function", "useAuth() should return `login` and `logout` functions.");
          t.expect(auth.user, "user before logging in").toBeFalsy();
          await t.act(() => auth!.login("grace"));
          t.assert(auth.user, "After login('grace'), `user` should be set.");
          await t.act(() => auth!.logout());
          t.expect(auth.user, "user after logout()").toBeFalsy();
        },
      },
      {
        id: "throws",
        requirementId: "hook",
        label: "useAuth throws outside AuthProvider",
        kind: "runtime",
        async run(t: TestApi) {
          let message = "";
          try {
            await t.renderHook(t.exports.useAuth);
          } catch (error) {
            message = error instanceof Error ? error.message : String(error);
          }
          t.assert(message, "useAuth() should throw when used outside <AuthProvider>, but it returned normally.");
          t.assert(/AuthProvider/.test(message), `The error should mention AuthProvider, got: "${message}".`);
        },
      },
      {
        id: "login",
        requirementId: "login",
        label: "Logging in shows the username",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByLabelText("Username"), "ada");
          await t.click(t.screen.getByRole("button", { name: "Log in" }));
          t.assert(t.screen.queryByText("Signed in as ada"), 'After logging in as "ada", show "Signed in as ada".');
          t.assert(!t.screen.queryByLabelText("Username"), "Hide the login form once signed in.");
        },
      },
      {
        id: "logout",
        requirementId: "logout",
        label: "Log out returns to the form",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.type(t.screen.getByLabelText("Username"), "ada");
          await t.click(t.screen.getByRole("button", { name: "Log in" }));
          const logout = t.screen.queryByRole("button", { name: "Log out" });
          t.assert(logout, 'Show a "Log out" button when signed in.');
          await t.click(logout);
          t.assert(t.screen.queryByLabelText("Username"), "After logging out, show the login form again.");
          t.assert(!t.screen.queryByText(/Signed in as/), 'After logging out, hide "Signed in as …".');
        },
      },
    ],
  },
  {
    id: "ctx-cart-reducer",
    topic: "context",
    title: "Shopping cart with useReducer + context",
    difficulty: "Hard",
    description: `Build a shopping cart whose state lives in a **reducer** and is shared through **context**, so the product list and the cart can live in separate components.

The starter reducer mutates \`state\` and returns the same array, so React never re-renders. Reducers must return **new** state.`,
    requirements: [
      { id: "add", text: "**Add Keyboard**, **Add Mouse** and **Add Monitor** add products. Adding the same product twice increases its quantity, shown as `Keyboard × 2` in its `<li>`." },
      { id: "count", text: "A heading shows the total quantity: `Cart (3)`." },
      { id: "total", text: "Show `Total: $119.48` (prices: Keyboard 49.99, Mouse 19.50, Monitor 189.00) with two decimals." },
      { id: "remove", text: "Each cart line has a **Remove** button that removes that line. **Clear cart** empties the cart and shows `Your cart is empty`." },
      { id: "architecture", text: "Use `useReducer` for the cart state, share it via a context, and never mutate state in the reducer." },
    ],
    starterCode: `import { useReducer } from 'react';

const products = [
  { id: 'kbd', name: 'Keyboard', price: 49.99 },
  { id: 'mouse', name: 'Mouse', price: 19.5 },
  { id: 'monitor', name: 'Monitor', price: 189 },
];

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      state.push({ ...action.product, quantity: 1 });
      return state;
    }
    default:
      return state;
  }
}

export default function App() {
  const [items, dispatch] = useReducer(cartReducer, []);

  return (
    <div>
      {products.map((product) => (
        <button key={product.id} onClick={() => dispatch({ type: 'add', product })}>
          Add {product.name}
        </button>
      ))}
      <h2>Cart</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
`,
    referenceSolution: `import { createContext, useContext, useMemo, useReducer } from 'react';

const products = [
  { id: 'kbd', name: 'Keyboard', price: 49.99 },
  { id: 'mouse', name: 'Mouse', price: 19.5 },
  { id: 'monitor', name: 'Monitor', price: 189 },
];

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const exists = state.some((item) => item.id === action.product.id);
      if (!exists) return [...state, { ...action.product, quantity: 1 }];
      return state.map((item) =>
        item.id === action.product.id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    }
    case 'remove':
      return state.filter((item) => item.id !== action.id);
    case 'clear':
      return [];
    default:
      return state;
  }
}

const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const value = useMemo(() => ({ items, dispatch }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>.');
  return context;
}

function ProductList() {
  const { dispatch } = useCart();
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {products.map((product) => (
        <button key={product.id} onClick={() => dispatch({ type: 'add', product })}>
          Add {product.name}
        </button>
      ))}
    </div>
  );
}

function Cart() {
  const { items, dispatch } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section>
      <h2>Cart ({count})</h2>
      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} × {item.quantity}{' '}
              <button onClick={() => dispatch({ type: 'remove', id: item.id })}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p>Total: \${total.toFixed(2)}</p>
      <button onClick={() => dispatch({ type: 'clear' })}>Clear cart</button>
    </section>
  );
}

export default function App() {
  return (
    <CartProvider>
      <ProductList />
      <Cart />
    </CartProvider>
  );
}
`,
    checks: [
      {
        id: "add",
        requirementId: "add",
        label: "Adding products groups quantities",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Mouse" }));
          const lines = t.screen.$$("li").map((li) => (li.textContent ?? "").replace(/\s+/g, " "));
          t.expect(lines.length, "Cart lines").toBe(2);
          t.assert(lines[0].includes("Keyboard × 2"), `The first line should show "Keyboard × 2", got "${lines[0]}".`);
          t.assert(lines[1].includes("Mouse × 1"), `The second line should show "Mouse × 1", got "${lines[1]}".`);
        },
      },
      {
        id: "count",
        requirementId: "count",
        label: "Shows the total quantity",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByText("Cart (0)"), 'An empty cart should show "Cart (0)".');
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Mouse" }));
          t.assert(t.screen.queryByText("Cart (3)"), 'After adding 3 items, show "Cart (3)".');
        },
      },
      {
        id: "total",
        requirementId: "total",
        label: "Shows the total price",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Mouse" }));
          t.assert(t.screen.queryByText("Total: $119.48"), 'Two keyboards and a mouse should show "Total: $119.48".');
        },
      },
      {
        id: "remove",
        requirementId: "remove",
        label: "Remove and Clear cart work",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          await t.click(t.screen.getByRole("button", { name: "Add Keyboard" }));
          await t.click(t.screen.getByRole("button", { name: "Add Mouse" }));
          await t.click(t.screen.getByRole("button", { name: "Add Monitor" }));
          const keyboard = t.screen.$$("li").find((li) => li.textContent?.includes("Keyboard"));
          t.assert(keyboard, "Expected a cart line for Keyboard.");
          await t.click(t.within(keyboard).getByRole("button", { name: "Remove" }));
          t.assert(!t.screen.$$("li").some((li) => li.textContent?.includes("Keyboard")), "Remove should delete the Keyboard line.");
          t.assert(t.screen.queryByText("Total: $208.50"), 'After removing the keyboard, show "Total: $208.50".');
          await t.click(t.screen.getByRole("button", { name: "Clear cart" }));
          t.assert(t.screen.queryByText("Your cart is empty"), 'After "Clear cart", show "Your cart is empty".');
          t.assert(t.screen.queryByText("Cart (0)"), 'After "Clear cart", show "Cart (0)".');
        },
      },
      { id: "reducer", requirementId: "architecture", label: "Uses useReducer", kind: "static", rule: { rule: "usesHook", hook: "useReducer" } },
      { id: "context", requirementId: "architecture", label: "Shares the cart through context", kind: "static", rule: { rule: "createsContext" } },
      { id: "no-mutation", requirementId: "architecture", label: "The reducer doesn't mutate state", kind: "static", rule: { rule: "noStateMutation" } },
    ],
  },
];
