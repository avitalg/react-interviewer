import type { Facts } from "@/lib/checks/analyze";
import type { TextEdit } from "@/lib/fix";

/**
 * Deterministic, minimal fixes for common mistakes. Each edit touches only the
 * expression or statement at fault and keeps the user's names.
 */
export function quickFixes(code: string, facts: Facts): TextEdit[] {
  const edits: TextEdit[] = [];
  const mentions = (pattern: string) => code.includes(pattern);

  for (const map of facts.maps) {
    if (map.isFragment || !map.itemParam) continue;
    const item = map.itemParam;
    const stableKey = mentions(`${item}.id`) ? `${item}.id` : null;
    if (!map.hasKey && map.keyInsertAt !== undefined) {
      const key = stableKey ?? (mentions(`{${item}}`) ? item : null);
      if (key) {
        edits.push({
          start: map.keyInsertAt,
          end: map.keyInsertAt,
          text: ` key={${key}}`,
          reason: `Give each \`<${map.elementName}>\` from \`.map()\` a stable \`key\`.`,
        });
      }
    } else if (map.keyIsIndex && map.keyRange && stableKey) {
      edits.push({
        start: map.keyRange.start,
        end: map.keyRange.end,
        text: stableKey,
        reason: "Use a stable id instead of the array index as `key`.",
      });
    }
  }

  for (const mutation of facts.mutations) {
    if (!mutation.fix) continue;
    edits.push({
      start: mutation.fix.range.start,
      end: mutation.fix.range.end,
      text: mutation.fix.text,
      reason: `Create a new array instead of mutating \`${mutation.stateName}\`.`,
    });
  }

  for (const effect of facts.effects) {
    // Adding a dependency the effect itself sets would make it loop.
    const safe = (names: string[]) => names.filter((name) => !effect.setsState.includes(name));

    if (!effect.hasDeps) {
      const deps = safe(effect.referenced);
      edits.push({
        start: effect.callbackEnd,
        end: effect.callbackEnd,
        text: `, [${deps.join(", ")}]`,
        reason: deps.length
          ? `Run the effect only when ${deps.map((d) => `\`${d}\``).join(", ")} change${deps.length === 1 ? "s" : ""}.`
          : "Run the effect once, after the first render.",
      });
    } else if (effect.missingDeps.length > 0 && effect.depsRange) {
      const missing = safe(effect.missingDeps);
      if (missing.length > 0) {
        edits.push({
          start: effect.depsRange.start,
          end: effect.depsRange.end,
          text: `[${[...effect.deps, ...missing].join(", ")}]`,
          reason: `Add ${missing.map((d) => `\`${d}\``).join(", ")} to the dependency array.`,
        });
      }
    }

    if (!effect.hasCleanup && effect.bodyCloseAt !== undefined) {
      const cleanups: string[] = [];
      for (const id of effect.intervalIds) cleanups.push(`clearInterval(${id});`);
      for (const listener of effect.listeners) {
        if (listener.handler) {
          cleanups.push(`${listener.target}.removeEventListener(${listener.event}, ${listener.handler});`);
        }
      }
      if (cleanups.length > 0) {
        const lineStart = code.lastIndexOf("\n", effect.bodyCloseAt - 1) + 1;
        const closingIndent = code.slice(lineStart, effect.bodyCloseAt);
        const onOwnLine = /^\s*$/.test(closingIndent);
        const body =
          cleanups.length === 1
            ? `return () => ${cleanups[0]}`
            : `return () => {\n${cleanups.map((c) => `${effect.bodyIndent}  ${c}`).join("\n")}\n${effect.bodyIndent}};`;
        const insertAt = onOwnLine ? lineStart : effect.bodyCloseAt;
        edits.push({
          start: insertAt,
          end: insertAt,
          text: onOwnLine ? `${effect.bodyIndent}${body}\n` : ` ${body} `,
          reason: "Clean up the timer or listener when the effect re-runs or the component unmounts.",
        });
      }
    }
  }

  return edits;
}
