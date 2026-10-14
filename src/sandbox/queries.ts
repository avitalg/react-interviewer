import type { Queries, RoleOptions, TextMatcher } from "./types";

export function normalize(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function matches(value: string, matcher: TextMatcher): boolean {
  const text = normalize(value);
  if (typeof matcher === "string") return text.toLowerCase() === normalize(matcher).toLowerCase();
  matcher.lastIndex = 0;
  return matcher.test(text);
}

export function describeMatcher(matcher: TextMatcher): string {
  return typeof matcher === "string" ? `"${matcher}"` : String(matcher);
}

function implicitRole(el: Element): string | null {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "button":
      return "button";
    case "a":
      return el.hasAttribute("href") ? "link" : null;
    case "input": {
      const type = (el.getAttribute("type") ?? "text").toLowerCase();
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (["button", "submit", "reset", "image"].includes(type)) return "button";
      if (type === "range") return "slider";
      if (type === "number") return "spinbutton";
      if (type === "search") return "searchbox";
      if (type === "hidden") return null;
      return "textbox";
    }
    case "textarea":
      return "textbox";
    case "select":
      return (el as HTMLSelectElement).multiple ? "listbox" : "combobox";
    case "option":
      return "option";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "nav":
      return "navigation";
    case "main":
      return "main";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "aside":
      return "complementary";
    case "form":
      return "form";
    case "dialog":
      return "dialog";
    case "img":
      return "img";
    case "table":
      return "table";
    case "tr":
      return "row";
    case "td":
      return "cell";
    case "th":
      return "columnheader";
    case "thead":
    case "tbody":
    case "tfoot":
      return "rowgroup";
    case "article":
      return "article";
    case "progress":
      return "progressbar";
    case "p":
      return "paragraph";
    default:
      return null;
  }
}

function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit.trim().split(/\s+/)[0];
  return implicitRole(el);
}

function isHidden(el: Element): boolean {
  const view = el.ownerDocument.defaultView;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true") return true;
    if (node.tagName === "DIALOG" && !node.hasAttribute("open")) return true;
    const style = view?.getComputedStyle(node);
    if (style && (style.display === "none" || style.visibility === "hidden")) return true;
  }
  return false;
}

export function accessibleName(el: Element): string {
  const doc = el.ownerDocument;
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    return normalize(
      labelledBy
        .split(/\s+/)
        .map((id) => doc.getElementById(id)?.textContent ?? "")
        .join(" "),
    );
  }
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return normalize(ariaLabel);

  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const input = el as HTMLInputElement;
    const type = (input.getAttribute("type") ?? "").toLowerCase();
    if (["button", "submit", "reset"].includes(type)) return normalize(input.value || type);
    const labels = input.labels ? Array.from(input.labels) : [];
    if (labels.length) return normalize(labels.map((label) => label.textContent).join(" "));
    return normalize(input.getAttribute("title") ?? input.getAttribute("placeholder") ?? "");
  }
  if (tag === "img") return normalize(el.getAttribute("alt") ?? "");
  const text = normalize(el.textContent);
  return text || normalize(el.getAttribute("title") ?? "");
}

function allElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("*")).filter(
    (el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE",
  );
}

function deepest(elements: HTMLElement[]): HTMLElement[] {
  return elements.filter((el) => !elements.some((other) => other !== el && el.contains(other)));
}

export function createQueries(root: ParentNode): Queries {
  const byText = (matcher: TextMatcher) =>
    deepest(allElements(root).filter((el) => matches(el.textContent ?? "", matcher)));

  const byRole = (role: string, options: RoleOptions = {}) =>
    allElements(root).filter(
      (el) =>
        roleOf(el) === role &&
        !isHidden(el) &&
        (options.name === undefined || matches(accessibleName(el), options.name)),
    );

  const byTestId = (id: string) =>
    Array.from(root.querySelectorAll<HTMLElement>("[data-testid]")).filter((el) => el.dataset.testid === id);

  const byLabel = (matcher: TextMatcher) => {
    const results: HTMLElement[] = [];
    for (const label of Array.from(root.querySelectorAll("label"))) {
      if (!matches(label.textContent ?? "", matcher)) continue;
      const control = (label as HTMLLabelElement).control;
      if (control) results.push(control as HTMLElement);
    }
    for (const el of allElements(root)) {
      const aria = el.getAttribute("aria-label");
      if (aria && matches(aria, matcher) && !results.includes(el)) results.push(el);
    }
    return results;
  };

  const byPlaceholder = (matcher: TextMatcher) =>
    Array.from(root.querySelectorAll<HTMLElement>("[placeholder]")).filter((el) =>
      matches(el.getAttribute("placeholder") ?? "", matcher),
    );

  function getter<A extends unknown[]>(find: (...args: A) => HTMLElement[], describe: (...args: A) => string) {
    return (...args: A) => {
      const found = find(...args);
      if (found.length === 0) throw new Error(`Could not find ${describe(...args)}.`);
      return found[0];
    };
  }

  const textDesc = (m: TextMatcher) => `an element with the text ${describeMatcher(m)}`;
  const roleDesc = (role: string, options?: RoleOptions) =>
    `an element with role "${role}"${options?.name !== undefined ? ` named ${describeMatcher(options.name)}` : ""}`;
  const testIdDesc = (id: string) => `an element with data-testid="${id}"`;
  const labelDesc = (m: TextMatcher) => `a form control labelled ${describeMatcher(m)}`;
  const placeholderDesc = (m: TextMatcher) => `an input with the placeholder ${describeMatcher(m)}`;

  return {
    getByText: getter(byText, textDesc),
    queryByText: (m) => byText(m)[0] ?? null,
    getAllByText: (m) => {
      const found = byText(m);
      if (!found.length) throw new Error(`Could not find ${textDesc(m)}.`);
      return found;
    },
    queryAllByText: byText,
    getByRole: getter(byRole, roleDesc),
    queryByRole: (role, options) => byRole(role, options)[0] ?? null,
    getAllByRole: (role, options) => {
      const found = byRole(role, options);
      if (!found.length) throw new Error(`Could not find ${roleDesc(role, options)}.`);
      return found;
    },
    queryAllByRole: byRole,
    getByTestId: getter(byTestId, testIdDesc),
    queryByTestId: (id) => byTestId(id)[0] ?? null,
    getAllByTestId: (id) => {
      const found = byTestId(id);
      if (!found.length) throw new Error(`Could not find ${testIdDesc(id)}.`);
      return found;
    },
    queryAllByTestId: byTestId,
    getByLabelText: getter(byLabel, labelDesc),
    queryByLabelText: (m) => byLabel(m)[0] ?? null,
    getByPlaceholderText: getter(byPlaceholder, placeholderDesc),
    queryByPlaceholderText: (m) => byPlaceholder(m)[0] ?? null,
    $: (selector) => root.querySelector<HTMLElement>(selector),
    $$: (selector) => Array.from(root.querySelectorAll<HTMLElement>(selector)),
  };
}
