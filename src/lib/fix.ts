import { diffLines } from "diff";

/** A replacement of 1-based, inclusive line ranges (what the AI reviewer returns). */
export interface LineEdit {
  startLine: number;
  endLine: number;
  replacement: string;
  reason: string;
}

/** A character-offset replacement. */
export interface TextEdit {
  start: number;
  end: number;
  text: string;
  reason: string;
}

export interface DiffLine {
  type: "context" | "add" | "remove";
  text: string;
  oldLine?: number;
  newLine?: number;
}

function lineOffsets(code: string): number[] {
  const offsets = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") offsets.push(i + 1);
  return offsets;
}

export function lineEditsToTextEdits(code: string, edits: LineEdit[]): TextEdit[] {
  const offsets = lineOffsets(code);
  const lineCount = offsets.length;
  const result: TextEdit[] = [];
  for (const edit of edits) {
    const startLine = Math.max(1, Math.min(edit.startLine, lineCount + 1));
    const endLine = Math.max(startLine - 1, Math.min(edit.endLine, lineCount));
    const start = startLine > lineCount ? code.length : offsets[startLine - 1];
    // endLine < startLine means "insert before startLine".
    let end: number;
    if (endLine < startLine) end = start;
    else end = endLine >= lineCount ? code.length : offsets[endLine] - 1;
    let text = edit.replacement.replace(/\r\n/g, "\n");
    if (endLine < startLine) text = text.endsWith("\n") ? text : `${text}\n`;
    else text = text.replace(/\n$/, "");
    result.push({ start, end, text, reason: edit.reason });
  }
  return result;
}

/** Applies non-overlapping edits; overlapping ones (later in the list) are dropped. */
export function applyTextEdits(code: string, edits: TextEdit[]): { code: string; applied: TextEdit[] } {
  const sorted = [...edits].sort((a, b) => a.start - b.start || a.end - b.end);
  const applied: TextEdit[] = [];
  for (const edit of sorted) {
    const last = applied[applied.length - 1];
    if (last && edit.start < last.end) continue;
    applied.push(edit);
  }
  let result = code;
  for (const edit of [...applied].reverse()) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  return { code: result, applied };
}

function splitLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export function diffCode(before: string, after: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const part of diffLines(before, after)) {
    for (const text of splitLines(part.value)) {
      if (part.added) lines.push({ type: "add", text, newLine: newLine++ });
      else if (part.removed) lines.push({ type: "remove", text, oldLine: oldLine++ });
      else lines.push({ type: "context", text, oldLine: oldLine++, newLine: newLine++ });
    }
  }
  return lines;
}

/** Collapses long runs of unchanged lines, keeping `context` lines around each change. */
export function withContext(lines: DiffLine[], context = 3): (DiffLine | { type: "gap"; hidden: number })[] {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((line, index) => {
    if (line.type === "context") return;
    for (let i = Math.max(0, index - context); i <= Math.min(lines.length - 1, index + context); i++) keep[i] = true;
  });
  const result: (DiffLine | { type: "gap"; hidden: number })[] = [];
  let hidden = 0;
  lines.forEach((line, index) => {
    if (keep[index]) {
      if (hidden) result.push({ type: "gap", hidden });
      hidden = 0;
      result.push(line);
    } else hidden++;
  });
  if (hidden) result.push({ type: "gap", hidden });
  return result;
}

/** Lines replaced, removed or added (a replaced line counts once). */
export function changedLineCount(before: string, after: string): number {
  const lines = diffCode(before, after);
  const added = lines.filter((line) => line.type === "add").length;
  const removed = lines.filter((line) => line.type === "remove").length;
  return Math.max(added, removed);
}

/** Share of the original lines that a fix touches (0..1). */
export function changedLineRatio(before: string, after: string): number {
  const total = Math.max(1, splitLines(before).length);
  return changedLineCount(before, after) / total;
}

/** Turns a line diff into minimal editor changes (character offsets in `before`). */
export function toEditorChanges(before: string, after: string): { from: number; to: number; insert: string }[] {
  const changes: { from: number; to: number; insert: string }[] = [];
  let offset = 0;
  const parts = diffLines(before, after);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      offset += part.value.length;
      continue;
    }
    if (part.removed) {
      const next = parts[i + 1];
      const insert = next?.added ? next.value : "";
      changes.push({ from: offset, to: offset + part.value.length, insert });
      offset += part.value.length;
      if (next?.added) i++;
      continue;
    }
    changes.push({ from: offset, to: offset, insert: part.value });
  }
  return changes;
}
