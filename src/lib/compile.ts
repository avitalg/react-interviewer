import type * as BabelStandalone from "@babel/standalone";

export type Babel = typeof BabelStandalone;

export interface CompileError {
  message: string;
  line?: number;
  column?: number;
  frame?: string;
}

export type CompileResult = { ok: true; js: string } | { ok: false; error: CompileError };

let babelPromise: Promise<Babel> | null = null;

/** Babel standalone is large, so it is loaded on first use. */
export function loadBabel(): Promise<Babel> {
  babelPromise ??= import("@babel/standalone").then(
    (mod) => ((mod as unknown as { default?: Babel }).default ?? mod) as Babel,
  );
  return babelPromise;
}

export const FILENAME = "App.jsx";

export function toCompileError(error: unknown): CompileError {
  const err = error as { message?: string; loc?: { line: number; column: number } };
  const raw = String(err?.message ?? error).replace(/^\/?[\w./-]*App\.jsx: /, "");
  const [first, ...rest] = raw.split("\n");
  const frame = rest.join("\n").replace(/^\n+/, "").trimEnd();
  return {
    // The position is shown separately, so drop Babel's trailing "(line:column)".
    message: first.replace(/\s*\(\d+:\d+\)\s*$/, "").trim(),
    line: err?.loc?.line,
    column: err?.loc?.column !== undefined ? err.loc.column + 1 : undefined,
    frame: frame || undefined,
  };
}

/** Dynamic import() would let editor code load remote modules. */
function rejectDynamicImport() {
  return {
    name: "reject-dynamic-import",
    visitor: {
      Import(path: { buildCodeFrameError: (message: string) => Error }) {
        throw path.buildCodeFrameError("Dynamic import() is not allowed.");
      },
      ImportExpression(path: { buildCodeFrameError: (message: string) => Error }) {
        throw path.buildCodeFrameError("Dynamic import() is not allowed.");
      },
    },
  };
}

/** JSX + ES modules to CommonJS that the sandbox can evaluate. */
export function compileWith(babel: Babel, code: string): CompileResult {
  try {
    const result = babel.transform(code, {
      filename: FILENAME,
      sourceType: "module",
      presets: [["react", { runtime: "classic" }]],
      plugins: [rejectDynamicImport, "transform-modules-commonjs"],
      retainLines: true,
    });
    return { ok: true, js: result.code ?? "" };
  } catch (error) {
    return { ok: false, error: toCompileError(error) };
  }
}

export async function compile(code: string): Promise<CompileResult> {
  return compileWith(await loadBabel(), code);
}
