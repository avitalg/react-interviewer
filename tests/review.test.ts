import { describe, expect, it } from "vitest";
import { computeVerdict, type CheckResult } from "@/lib/checks/verdict";
import { applyTextEdits, changedLineCount, diffCode, lineEditsToTextEdits, toEditorChanges, withContext } from "@/lib/fix";
import { mergeAiReview } from "@/lib/review/merge";
import type { ReviewReport } from "@/lib/review/types";

const requirements = [
  { id: "r1", text: "One" },
  { id: "r2", text: "Two" },
  { id: "r3", text: "Three" },
];

const check = (requirementId: string, passed: boolean, id = requirementId): CheckResult => ({
  id,
  requirementId,
  label: id,
  kind: "runtime",
  passed,
});

describe("computeVerdict", () => {
  it("passes only when every check passes", () => {
    const { verdict, requirements: results } = computeVerdict({
      requirements,
      checks: [check("r1", true), check("r2", true)],
      blocked: false,
    });
    expect(verdict).toBe("pass");
    expect(results.map((r) => r.status)).toEqual(["pass", "pass", "unverified"]);
  });

  it("is partially correct when at least half the checked requirements pass", () => {
    const checks = [check("r1", true), check("r2", true), check("r3", false)];
    expect(computeVerdict({ requirements, checks, blocked: false }).verdict).toBe("partial");
  });

  it("is not yet when most requirements fail", () => {
    const checks = [check("r1", true), check("r2", false), check("r3", false)];
    expect(computeVerdict({ requirements, checks, blocked: false }).verdict).toBe("not-yet");
  });

  it("fails a requirement when any of its checks fails", () => {
    const checks = [check("r1", true, "a"), check("r1", false, "b")];
    const [first] = computeVerdict({ requirements, checks, blocked: false }).requirements;
    expect(first.status).toBe("fail");
    expect(first.failures.map((f) => f.id)).toEqual(["b"]);
  });

  it("is not yet when the code doesn't compile", () => {
    const result = computeVerdict({ requirements, checks: [], blocked: true });
    expect(result.verdict).toBe("not-yet");
    expect(result.requirements.every((r) => r.status === "fail")).toBe(true);
  });
});

const code = "a\nb\nc\nd\n";

describe("line edits", () => {
  it("replaces an inclusive line range", () => {
    const edits = lineEditsToTextEdits(code, [{ startLine: 2, endLine: 3, replacement: "B\nC\n", reason: "" }]);
    expect(applyTextEdits(code, edits).code).toBe("a\nB\nC\nd\n");
  });

  it("inserts before a line when endLine < startLine", () => {
    const edits = lineEditsToTextEdits(code, [{ startLine: 2, endLine: 1, replacement: "x", reason: "" }]);
    expect(applyTextEdits(code, edits).code).toBe("a\nx\nb\nc\nd\n");
  });

  it("applies several edits against the original positions", () => {
    const edits = lineEditsToTextEdits(code, [
      { startLine: 4, endLine: 4, replacement: "D", reason: "" },
      { startLine: 1, endLine: 1, replacement: "A1\nA2", reason: "" },
    ]);
    expect(applyTextEdits(code, edits).code).toBe("A1\nA2\nb\nc\nD\n");
  });

  it("drops overlapping edits", () => {
    const result = applyTextEdits("hello world", [
      { start: 0, end: 5, text: "HELLO", reason: "first" },
      { start: 3, end: 8, text: "x", reason: "overlaps" },
    ]);
    expect(result.code).toBe("HELLO world");
    expect(result.applied.map((e) => e.reason)).toEqual(["first"]);
  });
});

describe("diffs", () => {
  it("numbers old and new lines", () => {
    expect(diffCode("a\nb\n", "a\nB\n")).toEqual([
      { type: "context", text: "a", oldLine: 1, newLine: 1 },
      { type: "remove", text: "b", oldLine: 2 },
      { type: "add", text: "B", newLine: 2 },
    ]);
  });

  it("collapses unchanged lines far from a change", () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
    const after = before.replace("line 10", "LINE 10");
    const rows = withContext(diffCode(before, after), 2);
    expect(rows[0]).toEqual({ type: "gap", hidden: 8 });
    expect(rows.at(-1)).toEqual({ type: "gap", hidden: 7 });
    expect(changedLineCount(before, after)).toBe(1);
  });

  it("produces editor changes that only cover the changed lines", () => {
    const before = "keep 1\nold\nkeep 2\n";
    const after = "keep 1\nnew\nkeep 2\nadded\n";
    const changes = toEditorChanges(before, after);
    expect(changes).toEqual([
      { from: 7, to: 11, insert: "new\n" },
      { from: 18, to: 18, insert: "added\n" },
    ]);
    let result = before;
    for (const change of [...changes].reverse()) {
      result = result.slice(0, change.from) + change.insert + result.slice(change.to);
    }
    expect(result).toBe(after);
  });
});

describe("mergeAiReview", () => {
  const report: ReviewReport = {
    submittedCode: code,
    verdict: "partial",
    requirements: [],
    checks: [],
    good: ["Deterministic praise"],
    issues: [{ requirementId: "r1", text: "Known issue" }],
    notes: [],
    aiNotes: [],
    fix: { code: "quick", source: "quickfix", reasons: ["quick reason"] },
    ai: { status: "loading" },
  };

  it("adds AI feedback and prefers its fix, without changing the verdict", () => {
    const merged = mergeAiReview(report, {
      good: ["AI praise"],
      issues: [
        { requirementId: "r1", text: "Known issue" },
        { requirementId: null as unknown as undefined, text: "New issue" },
      ],
      bestPractices: ["Use a reducer"],
      edits: [{ startLine: 2, endLine: 2, replacement: "B", reason: "Fix b" }],
    });
    expect(merged.verdict).toBe("partial");
    expect(merged.good).toEqual(["AI praise"]);
    expect(merged.issues.map((i) => i.text)).toEqual(["Known issue", "New issue"]);
    expect(merged.aiNotes).toEqual(["Use a reducer"]);
    expect(merged.fix).toEqual({ code: "a\nB\nc\nd\n", source: "ai", reasons: ["Fix b"] });
    expect(merged.ai.status).toBe("done");
  });

  it("keeps the quick fix when the AI fix was rejected", () => {
    const merged = mergeAiReview(report, {
      good: [],
      issues: [],
      bestPractices: [],
      edits: [],
      fixRejected: "The suggested fix changed too much.",
    });
    expect(merged.fix?.source).toBe("quickfix");
    expect(merged.good).toEqual(["Deterministic praise"]);
    expect(merged.ai.message).toBe("The suggested fix changed too much.");
  });
});
