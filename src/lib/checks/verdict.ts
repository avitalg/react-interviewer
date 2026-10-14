import type { Requirement } from "@/exercises/types";

export type Verdict = "pass" | "partial" | "not-yet";

export const verdictLabel: Record<Verdict, string> = {
  pass: "Pass",
  partial: "Partially correct",
  "not-yet": "Not yet",
};

export interface CheckResult {
  id: string;
  requirementId: string;
  label: string;
  kind: "static" | "runtime";
  passed: boolean;
  message?: string;
}

export type RequirementStatus = "pass" | "fail" | "unverified";

export interface RequirementResult {
  id: string;
  text: string;
  status: RequirementStatus;
  failures: CheckResult[];
}

export interface VerdictInput {
  requirements: Requirement[];
  checks: CheckResult[];
  /** Code didn't compile, or the component crashed on first render. */
  blocked: boolean;
}

export function computeVerdict({ requirements, checks, blocked }: VerdictInput): {
  verdict: Verdict;
  requirements: RequirementResult[];
} {
  const results: RequirementResult[] = requirements.map((requirement) => {
    const own = checks.filter((check) => check.requirementId === requirement.id);
    const failures = own.filter((check) => !check.passed);
    const status: RequirementStatus = blocked
      ? "fail"
      : own.length === 0
        ? "unverified"
        : failures.length === 0
          ? "pass"
          : "fail";
    return { id: requirement.id, text: requirement.text, status, failures };
  });

  if (blocked) return { verdict: "not-yet", requirements: results };

  const checked = results.filter((result) => result.status !== "unverified");
  const passed = checked.filter((result) => result.status === "pass");
  const allChecksPass = checks.every((check) => check.passed);

  let verdict: Verdict;
  if (allChecksPass) verdict = "pass";
  else if (checked.length > 0 && passed.length / checked.length < 0.5) verdict = "not-yet";
  else verdict = "partial";

  return { verdict, requirements: results };
}
