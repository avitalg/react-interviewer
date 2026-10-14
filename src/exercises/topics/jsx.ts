import type { Exercise } from "../types";
import type { TestApi } from "@/sandbox/types";

export const jsxExercises: Exercise[] = [
  {
    id: "jsx-profile-card",
    topic: "jsx",
    title: "Profile card",
    difficulty: "Easy",
    description: `Build a small **ProfileCard** component that renders a user's details, and use it from \`App\`.

The \`user\` object is already defined at the top of the file.`,
    requirements: [
      { id: "component", text: "Create a `ProfileCard` component that receives the user as a `user` prop, and render `<ProfileCard user={user} />` from `App`." },
      { id: "name-role", text: "Show the name in an `<h2>` and the role in a `<p>`." },
      { id: "avatar", text: "Show the avatar in an `<img>` whose `src` is `user.avatar` and whose `alt` is the user's name." },
      { id: "class", text: "Give the card's root element `className=\"card\"` (JSX uses `className`, not `class`)." },
    ],
    starterCode: `const user = {
  name: 'Ada Lovelace',
  role: 'Mathematician',
  avatar: 'https://i.pravatar.cc/120?img=47',
};

// TODO: create a ProfileCard component that receives \`user\` as a prop

export default function App() {
  return (
    <div>
      {/* Render <ProfileCard user={user} /> here */}
    </div>
  );
}
`,
    referenceSolution: `const user = {
  name: 'Ada Lovelace',
  role: 'Mathematician',
  avatar: 'https://i.pravatar.cc/120?img=47',
};

function ProfileCard({ user }) {
  return (
    <article className="card">
      <img src={user.avatar} alt={user.name} width={64} height={64} />
      <h2>{user.name}</h2>
      <p>{user.role}</p>
    </article>
  );
}

export default function App() {
  return (
    <div>
      <ProfileCard user={user} />
    </div>
  );
}
`,
    checks: [
      { id: "defines-card", requirementId: "component", label: "Defines a ProfileCard component", kind: "static", rule: { rule: "definesComponent", name: "ProfileCard" } },
      { id: "renders-card", requirementId: "component", label: "App renders <ProfileCard>", kind: "static", rule: { rule: "usesComponent", name: "ProfileCard" } },
      {
        id: "name-heading",
        requirementId: "name-role",
        label: "The name is shown in an <h2>",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const heading = t.screen.getByText("Ada Lovelace");
          t.assert(heading.tagName === "H2", `Expected the name to be in an <h2>, found <${heading.tagName.toLowerCase()}>.`);
        },
      },
      {
        id: "role-paragraph",
        requirementId: "name-role",
        label: "The role is shown in a <p>",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const role = t.screen.getByText("Mathematician");
          t.assert(role.tagName === "P", `Expected the role to be in a <p>, found <${role.tagName.toLowerCase()}>.`);
        },
      },
      {
        id: "avatar",
        requirementId: "avatar",
        label: "The avatar image has the right src and alt",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const img = t.screen.$("img");
          t.assert(img, "No <img> was rendered.");
          t.expect(img.getAttribute("src"), "The image src should be user.avatar").toBe("https://i.pravatar.cc/120?img=47");
          t.expect(img.getAttribute("alt"), "The image alt should be the user's name").toBe("Ada Lovelace");
        },
      },
      {
        id: "card-class",
        requirementId: "class",
        label: "The card has class \"card\"",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const card = t.screen.$(".card");
          t.assert(card, 'No element with className="card" was found.');
          t.assert(card.textContent?.includes("Ada Lovelace"), "The .card element should contain the user's details.");
        },
      },
    ],
  },
  {
    id: "jsx-split-components",
    topic: "jsx",
    title: "Split a page into components",
    difficulty: "Easy",
    description: `\`App\` renders a whole blog page in one big block of JSX. Refactor it into three small components without changing what's on the screen.`,
    requirements: [
      { id: "define", text: "Create `Header`, `Article` and `Footer` components." },
      { id: "compose", text: "`App` renders `<Header />`, `<Article />` and `<Footer />` instead of the inline markup." },
      { id: "same-output", text: "The page still shows the site title `My Blog` in a `<header>`, the article heading `Hello, JSX` and the footer text `© 2026 My Blog`." },
    ],
    starterCode: `export default function App() {
  return (
    <div className="page">
      <header>
        <h1>My Blog</h1>
        <nav>
          <a href="#home">Home</a> · <a href="#about">About</a>
        </nav>
      </header>
      <main>
        <article>
          <h2>Hello, JSX</h2>
          <p>JSX lets you write markup inside JavaScript.</p>
        </article>
      </main>
      <footer>
        <small>© 2026 My Blog</small>
      </footer>
    </div>
  );
}
`,
    referenceSolution: `function Header() {
  return (
    <header>
      <h1>My Blog</h1>
      <nav>
        <a href="#home">Home</a> · <a href="#about">About</a>
      </nav>
    </header>
  );
}

function Article() {
  return (
    <main>
      <article>
        <h2>Hello, JSX</h2>
        <p>JSX lets you write markup inside JavaScript.</p>
      </article>
    </main>
  );
}

function Footer() {
  return (
    <footer>
      <small>© 2026 My Blog</small>
    </footer>
  );
}

export default function App() {
  return (
    <div className="page">
      <Header />
      <Article />
      <Footer />
    </div>
  );
}
`,
    checks: [
      { id: "header", requirementId: "define", label: "Defines a Header component", kind: "static", rule: { rule: "definesComponent", name: "Header" } },
      { id: "article", requirementId: "define", label: "Defines an Article component", kind: "static", rule: { rule: "definesComponent", name: "Article" } },
      { id: "footer", requirementId: "define", label: "Defines a Footer component", kind: "static", rule: { rule: "definesComponent", name: "Footer" } },
      { id: "uses-header", requirementId: "compose", label: "App renders <Header />", kind: "static", rule: { rule: "usesComponent", name: "Header" } },
      { id: "uses-article", requirementId: "compose", label: "App renders <Article />", kind: "static", rule: { rule: "usesComponent", name: "Article" } },
      { id: "uses-footer", requirementId: "compose", label: "App renders <Footer />", kind: "static", rule: { rule: "usesComponent", name: "Footer" } },
      {
        id: "output",
        requirementId: "same-output",
        label: "The page content is unchanged",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const banner = t.screen.$("header");
          t.assert(banner && /My Blog/.test(banner.textContent ?? ""), "The <header> should contain the site title \"My Blog\".");
          t.screen.getByRole("heading", { name: "Hello, JSX" });
          t.screen.getByText("© 2026 My Blog");
        },
      },
    ],
  },
  {
    id: "jsx-star-rating",
    topic: "jsx",
    title: "Star rating display",
    difficulty: "Medium",
    description: `Create a read-only **StarRating** component. It renders a row of stars: filled stars (\`★\`) for the rating and empty stars (\`☆\`) for the rest.

Think about how to render a list of N elements from a number.`,
    requirements: [
      { id: "stars", text: "`StarRating` takes `rating` and `max` props and renders `max` stars: `★` for the first `rating` stars and `☆` for the rest." },
      { id: "default-max", text: "`max` defaults to `5` when it isn't passed." },
      { id: "label", text: "The wrapper element has an `aria-label` like `Rating: 3 out of 5`." },
      { id: "usage", text: "`App` renders `<StarRating rating={3} />` and `<StarRating rating={4} max={10} />`." },
    ],
    starterCode: `function StarRating({ rating, max }) {
  // TODO: render \`max\` stars: ★ for filled, ☆ for empty
  return <span>{rating} stars</span>;
}

export default function App() {
  return (
    <div>
      <StarRating rating={3} />
    </div>
  );
}
`,
    referenceSolution: `function StarRating({ rating, max = 5 }) {
  const stars = Array.from({ length: max }, (_, i) => (i < rating ? '★' : '☆'));
  return (
    <span aria-label={'Rating: ' + rating + ' out of ' + max} style={{ color: '#f59e0b', fontSize: 24 }}>
      {stars.join('')}
    </span>
  );
}

export default function App() {
  return (
    <div>
      <StarRating rating={3} />
      <br />
      <StarRating rating={4} max={10} />
    </div>
  );
}
`,
    checks: [
      { id: "defines", requirementId: "stars", label: "Defines a StarRating component", kind: "static", rule: { rule: "definesComponent", name: "StarRating" } },
      {
        id: "five-stars",
        requirementId: "stars",
        label: "rating={3} renders ★★★☆☆",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const stars = t.screen.$$("[aria-label]").map((el) => (el.textContent ?? "").replace(/\s/g, ""));
          t.assert(stars.includes("★★★☆☆"), `Expected a rating that shows ★★★☆☆, found: ${JSON.stringify(stars)}`);
        },
      },
      {
        id: "default-max",
        requirementId: "default-max",
        label: "max defaults to 5",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const el = t.screen.queryByLabelText(/^Rating: 3 out of 5$/i);
          t.assert(el, 'Expected <StarRating rating={3} /> to be labelled "Rating: 3 out of 5".');
          const text = (el.textContent ?? "").replace(/\s/g, "");
          t.expect(text.length, "It should render 5 stars by default").toBe(5);
        },
      },
      {
        id: "label",
        requirementId: "label",
        label: "Each rating has an aria-label",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          t.assert(t.screen.queryByLabelText(/Rating: 3 out of 5/i), 'Missing aria-label "Rating: 3 out of 5".');
          t.assert(t.screen.queryByLabelText(/Rating: 4 out of 10/i), 'Missing aria-label "Rating: 4 out of 10".');
        },
      },
      {
        id: "ten-stars",
        requirementId: "usage",
        label: "rating={4} max={10} renders 4 filled and 6 empty stars",
        kind: "runtime",
        async run(t: TestApi) {
          await t.render();
          const el = t.screen.queryByLabelText(/Rating: 4 out of 10/i);
          t.assert(el, "App should render <StarRating rating={4} max={10} />.");
          const text = el.textContent ?? "";
          t.expect((text.match(/★/g) ?? []).length, "Filled stars").toBe(4);
          t.expect((text.match(/☆/g) ?? []).length, "Empty stars").toBe(6);
        },
      },
      { id: "two-ratings", requirementId: "usage", label: "App renders two ratings", kind: "static", rule: { rule: "usesComponent", name: "StarRating", min: 2 } },
    ],
  },
];
