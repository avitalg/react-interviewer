"use client";

import { useMemo } from "react";
import { diffCode, withContext } from "@/lib/fix";
import { cx } from "@/components/ui";

export function DiffView({ before, after, context = 3 }: { before: string; after: string; context?: number }) {
  const rows = useMemo(() => withContext(diffCode(before, after), context), [before, after, context]);

  return (
    <div className="overflow-auto rounded-md border border-border bg-surface-2 font-mono text-xs leading-5">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, index) => {
            if (row.type === "gap") {
              return (
                <tr key={`gap-${index}`} className="text-muted">
                  <td colSpan={4} className="bg-surface px-3 py-0.5 text-[11px] select-none">
                    ⋯ {row.hidden} unchanged line{row.hidden === 1 ? "" : "s"}
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={index}
                className={cx(
                  row.type === "add" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                  row.type === "remove" && "bg-rose-500/15 text-rose-800 dark:text-rose-200",
                )}
              >
                <td className="w-8 px-2 text-right text-muted select-none">{row.oldLine ?? ""}</td>
                <td className="w-8 px-2 text-right text-muted select-none">{row.newLine ?? ""}</td>
                <td className="w-4 text-center select-none" aria-hidden>
                  {row.type === "add" ? "+" : row.type === "remove" ? "−" : " "}
                </td>
                <td className="pr-3 whitespace-pre">
                  <span className="sr-only">{row.type === "add" ? "Added: " : row.type === "remove" ? "Removed: " : ""}</span>
                  {row.text || " "}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
