import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { JSDOM } from "jsdom";
import { createEnv, type SandboxWindow } from "@/sandbox/env";
import { runChecks } from "@/sandbox/harness";
import type { CheckOutcome } from "@/sandbox/types";
import { compileWith, type Babel } from "@/lib/compile";
import { functionSource } from "@/exercises/serialize";
import type { Exercise } from "@/exercises/types";

const require = createRequire(import.meta.url);

function umd(pkg: string, file: string) {
  return readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), file), "utf8");
}

const reactSource = umd("react18", "umd/react.development.js");
const reactDomSource = umd("react-dom18", "umd/react-dom.development.js");

export const babel: Babel = require("@babel/standalone");

/** A jsdom window with the same React 18 UMD builds the browser sandbox uses. */
export function createJsdomEnv(setup?: (win: SandboxWindow) => void) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "http://localhost/sandbox/frame.html",
  });
  const win = dom.window as unknown as SandboxWindow;
  win.eval(reactSource);
  win.eval(reactDomSource);
  // React's async act() looks up Node's setImmediate through a `module` global.
  (win as Record<string, unknown>).module = {
    require: (name: string) => (name === "timers" ? { setImmediate } : undefined),
  };
  setup?.(win);
  return { env: createEnv(win), dom };
}

/** Same runner contract as the browser's hidden iframe, backed by a fresh jsdom window. */
export async function jsdomRunner(payload: { code: string; checks: { id: string; source: string; timeoutMs?: number }[]; mockApi?: string }) {
  const { env, dom } = createJsdomEnv();
  try {
    return await runChecks(env, payload);
  } finally {
    dom.window.close();
  }
}

export interface RuntimeRun {
  compiled: boolean;
  compileError?: string;
  smoke?: CheckOutcome;
  results: CheckOutcome[];
}

export async function runRuntimeChecks(exercise: Exercise, code: string): Promise<RuntimeRun> {
  const compiled = compileWith(babel, code);
  if (!compiled.ok) return { compiled: false, compileError: compiled.error.message, results: [] };
  const { env, dom } = createJsdomEnv();
  try {
    const checks = exercise.checks.flatMap((check) =>
      check.kind === "runtime" ? [{ id: check.id, source: functionSource(check.run), timeoutMs: check.timeoutMs }] : [],
    );
    const { smoke, results } = await runChecks(env, {
      code: compiled.js,
      checks,
      mockApi: exercise.mockApi ? functionSource(exercise.mockApi) : undefined,
    });
    return { compiled: true, smoke, results };
  } finally {
    dom.window.close();
  }
}
