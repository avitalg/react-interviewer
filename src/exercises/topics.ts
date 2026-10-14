import type { Topic } from "./types";

export const topics: Topic[] = [
  { id: "jsx", title: "JSX & Components", blurb: "Describe UI with JSX and split it into small components." },
  { id: "props", title: "Props & Composition", blurb: "Pass data down and compose components with children." },
  { id: "state", title: "State (useState)", blurb: "Keep component state and update it immutably." },
  { id: "effects", title: "Effects (useEffect) & Lifecycle", blurb: "Synchronize with the outside world and clean up." },
  { id: "forms", title: "Events & Forms", blurb: "Handle events and build controlled inputs." },
  { id: "lists", title: "Lists & Keys", blurb: "Render collections with stable keys, filter and sort them." },
  { id: "conditional", title: "Conditional Rendering", blurb: "Show, hide and switch UI based on state." },
  { id: "refs", title: "Refs (useRef)", blurb: "Reach DOM nodes and keep values across renders." },
  { id: "context", title: "Context API", blurb: "Share state across the tree without prop drilling." },
  { id: "hooks", title: "Custom Hooks", blurb: "Extract reusable stateful logic into hooks." },
  { id: "performance", title: "Performance", blurb: "useMemo, useCallback and React.memo to avoid wasted work." },
  { id: "fetching", title: "Data Fetching", blurb: "Load data with loading and error states, and avoid races." },
];

export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}
