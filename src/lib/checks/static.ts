import type { StaticRule } from "@/exercises/types";
import type { Facts } from "./analyze";

export interface RuleOutcome {
  passed: boolean;
  message?: string;
}

const lines = (items: { line: number }[]) => items.map((item) => item.line).join(", ");

export function evaluateRule(rule: StaticRule, facts: Facts): RuleOutcome {
  switch (rule.rule) {
    case "usesHook": {
      const count = facts.hooks[rule.hook] ?? 0;
      const min = rule.min ?? 1;
      if (rule.max !== undefined && count > rule.max) {
        return {
          passed: false,
          message: `\`${rule.hook}\` is used ${count} times; expected at most ${rule.max}. Derive values during render instead of storing them in extra state.`,
        };
      }
      return count >= min
        ? { passed: true }
        : { passed: false, message: min > 1 ? `Expected \`${rule.hook}\` at least ${min} times, found ${count}.` : `\`${rule.hook}\` is not used.` };
    }
    case "usesReactMemo":
      return facts.usesReactMemo ? { passed: true } : { passed: false, message: "No component is wrapped in `React.memo`." };
    case "createsContext":
      return facts.createsContext
        ? { passed: true }
        : { passed: false, message: "No context is created with `createContext`." };
    case "definesComponent":
      return facts.components.includes(rule.name)
        ? { passed: true }
        : { passed: false, message: `There is no component named \`${rule.name}\`.` };
    case "definesFunction":
      return facts.functions.includes(rule.name)
        ? { passed: true }
        : { passed: false, message: `There is no function named \`${rule.name}\`.` };
    case "usesComponent": {
      const count = facts.jsxNames[rule.name] ?? 0;
      const min = rule.min ?? 1;
      return count >= min
        ? { passed: true }
        : { passed: false, message: `\`<${rule.name}>\` is rendered ${count} time(s); expected at least ${min}.` };
    }
    case "usesIdentifier":
      return facts.identifiers.includes(rule.name)
        ? { passed: true }
        : { passed: false, message: `\`${rule.name}\` is not used.` };
    case "listItemsHaveKeys": {
      const missing = facts.maps.filter((map) => !map.hasKey);
      if (facts.maps.length === 0) return { passed: false, message: "No list is rendered with `.map()`." };
      return missing.length === 0
        ? { passed: true }
        : { passed: false, message: `Elements returned from \`.map()\` have no \`key\` (line ${lines(missing)}).` };
    }
    case "noIndexAsKey": {
      const indexKeys = facts.maps.filter((map) => map.keyIsIndex);
      return indexKeys.length === 0
        ? { passed: true }
        : { passed: false, message: `The array index is used as \`key\` (line ${lines(indexKeys)}).` };
    }
    case "effectHasDepsArray": {
      const effects = facts.effects.filter((effect) => effect.hook === "useEffect");
      if (effects.length === 0) return { passed: false, message: "`useEffect` is not used." };
      const missing = effects.filter((effect) => !effect.hasDeps);
      return missing.length === 0
        ? { passed: true }
        : { passed: false, message: `An effect has no dependency array (line ${lines(missing)}).` };
    }
    case "effectDepsComplete": {
      const effects = facts.effects.filter((effect) => effect.hook === "useEffect");
      if (effects.length === 0) return { passed: false, message: "`useEffect` is not used." };
      const incomplete = effects.filter((effect) => effect.hasDeps && effect.missingDeps.length > 0);
      return incomplete.length === 0
        ? { passed: true }
        : {
            passed: false,
            message: incomplete
              .map((effect) => `The effect on line ${effect.line} uses ${effect.missingDeps.map(code).join(", ")} but doesn't list it as a dependency.`)
              .join(" "),
          };
    }
    case "effectHasCleanup": {
      const needing = facts.effects.filter(
        (effect) => effect.usesInterval || effect.listeners.length > 0 || effect.usesTimeout,
      );
      if (needing.length === 0) return { passed: false, message: "No effect sets up a timer or listener." };
      const missing = needing.filter((effect) => !effect.hasCleanup);
      return missing.length === 0
        ? { passed: true }
        : { passed: false, message: `An effect starts a timer or listener but returns no cleanup (line ${lines(missing)}).` };
    }
    case "noStateMutation":
      return facts.mutations.length === 0
        ? { passed: true }
        : {
            passed: false,
            message: `Data is mutated in place: ${facts.mutations
              .map((m) => `${m.description} on line ${m.line} (${m.kind === "module" ? "module-level value" : m.kind})`)
              .join(", ")}.`,
          };
    case "controlledInputs":
      if (facts.valueWithoutOnChange.length > 0) {
        return { passed: false, message: `An input has \`value\` but no \`onChange\` (line ${lines(facts.valueWithoutOnChange)}).` };
      }
      return facts.controlledInputs > 0
        ? { passed: true }
        : { passed: false, message: "No controlled input (`value` + `onChange`) was found." };
    case "noDirectDom":
      return facts.directDom.length === 0
        ? { passed: true }
        : { passed: false, message: `The DOM is queried directly with \`${facts.directDom[0].call}\` (line ${lines(facts.directDom)}).` };
  }
}

export type NoteSeverity = "warning" | "info";

export interface Note {
  id: string;
  severity: NoteSeverity;
  text: string;
  line?: number;
}

const code = (text: string) => `\`${text}\``;
const list = (names: string[]) => names.map(code).join(", ");

/** React best-practice notes that apply to any exercise. */
export function bestPracticeNotes(facts: Facts): Note[] {
  const notes: Note[] = [];

  for (const map of facts.maps) {
    if (!map.hasKey) {
      notes.push({
        id: `key-${map.line}`,
        severity: "warning",
        line: map.line,
        text: map.isFragment
          ? "A fragment `<>` returned from `.map()` can't take a key. Use `<Fragment key={…}>` instead."
          : `${code(`<${map.elementName}>`)} returned from ${code(".map()")} has no ${code("key")}. React needs a stable key to match items between renders.`,
      });
    } else if (map.keyIsIndex) {
      notes.push({
        id: `index-key-${map.line}`,
        severity: "warning",
        line: map.line,
        text: "Using the array index as `key` breaks item state (inputs, focus, animations) when items are added, removed or reordered. Prefer a stable id from the data.",
      });
    }
  }

  for (const mutation of facts.mutations) {
    const why =
      mutation.kind === "state"
        ? "React compares state by reference, so it may skip the re-render."
        : mutation.kind === "prop"
          ? "Props belong to the parent; changing them in place causes confusing bugs."
          : "It's a module-level value shared by every render, so the change leaks between renders.";
    notes.push({
      id: `mutation-${mutation.line}`,
      severity: "warning",
      line: mutation.line,
      text: `${mutation.description} mutates ${code(mutation.stateName)} in place. ${why} Make a copy first (spread, \`map\`, \`filter\`, \`[...list].sort()\`).`,
    });
  }

  for (const call of facts.setStateInRender) {
    notes.push({
      id: `set-in-render-${call.line}`,
      severity: "warning",
      line: call.line,
      text: `${code(call.setter + "()")} is called while rendering, which schedules another render and can loop forever. Call it from an event handler or an effect.`,
    });
  }

  for (const effect of facts.effects) {
    if (!effect.hasDeps) {
      notes.push({
        id: `no-deps-${effect.line}`,
        severity: effect.setsState.length > 0 ? "warning" : "info",
        line: effect.line,
        text:
          effect.setsState.length > 0
            ? `This ${code(effect.hook)} has no dependency array, so it runs after every render, and it sets state. That can cause an infinite render loop. Add a dependency array.`
            : `This ${code(effect.hook)} has no dependency array, so it runs after every render. Add the values it depends on (or \`[]\` to run once).`,
      });
    } else if (effect.missingDeps.length > 0) {
      notes.push({
        id: `missing-deps-${effect.line}`,
        severity: "warning",
        line: effect.line,
        text: `This effect reads ${list(effect.missingDeps)} but doesn't list ${effect.missingDeps.length > 1 ? "them" : "it"} as dependencies, so it can keep using stale values.`,
      });
    }
    if (!effect.hasCleanup && (effect.usesInterval || effect.listeners.length > 0)) {
      const what = effect.usesInterval ? code("setInterval") : code("addEventListener");
      notes.push({
        id: `cleanup-${effect.line}`,
        severity: "warning",
        line: effect.line,
        text: `The effect starts ${what} but never cleans it up, so it keeps running (and stacks up) after re-renders and unmount. Return a cleanup function.`,
      });
    } else if (!effect.hasCleanup && effect.usesFetch) {
      notes.push({
        id: `fetch-race-${effect.line}`,
        severity: "info",
        line: effect.line,
        text: "This effect fetches without a cleanup. If its inputs change quickly, an older response can arrive last and overwrite newer data. Use an `ignore` flag or an `AbortController` in the cleanup.",
      });
    }
  }

  for (const input of facts.valueWithoutOnChange) {
    notes.push({
      id: `readonly-input-${input.line}`,
      severity: "warning",
      line: input.line,
      text: `${code(`<${input.tag}>`)} has a ${code("value")} but no ${code("onChange")}, so the user can't type into it. Add an ${code("onChange")} handler (or use ${code("defaultValue")}).`,
    });
  }

  for (const prop of facts.inlinePropsToMemo) {
    notes.push({
      id: `inline-prop-${prop.line}-${prop.prop}`,
      severity: "warning",
      line: prop.line,
      text: `${code(prop.prop)} on ${code(`<${prop.component}>`)} is created inline, so it's a new value on every render and ${code("React.memo")} can't skip re-rendering. Use ${code("useCallback")} / ${code("useMemo")}.`,
    });
  }

  for (const dom of facts.directDom) {
    notes.push({
      id: `direct-dom-${dom.line}`,
      severity: "info",
      line: dom.line,
      text: `${code(dom.call)} reaches into the DOM directly. In React, prefer a ref (${code("useRef")}) so the component stays in control of its own nodes.`,
    });
  }

  return notes.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
}
