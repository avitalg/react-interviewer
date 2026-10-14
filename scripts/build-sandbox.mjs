// Copies the React 18 UMD builds used by the preview sandbox and bundles the
// sandbox runtime into public/sandbox.
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const outDir = path.join(root, "public", "sandbox");
const vendorDir = path.join(outDir, "vendor");

await mkdir(vendorDir, { recursive: true });

const vendorFiles = [
  ["react18", "umd/react.development.js"],
  ["react-dom18", "umd/react-dom.development.js"],
];

for (const [pkg, file] of vendorFiles) {
  const pkgDir = path.dirname(require.resolve(`${pkg}/package.json`));
  await copyFile(path.join(pkgDir, file), path.join(vendorDir, path.basename(file)));
}

const watch = process.argv.includes("--watch");
const options = {
  entryPoints: [path.join(root, "src", "sandbox", "entry.ts")],
  outfile: path.join(outDir, "runtime.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  logLevel: "info",
};

if (watch) {
  const { context } = await import("esbuild");
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
