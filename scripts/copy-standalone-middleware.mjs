// Next 16's standalone output includes `server/middleware.js.nft.json` but not
// `server/middleware.js` itself (the same gap Next 16 has for instrumentation).
// Bundlers that read the standalone tree -- e.g. OpenNext for Cloudflare Workers
// -- assert the traced file exists and abort the build without it.
//
// This script runs as npm's `postbuild` hook, i.e. right after `next build`
// (including the build OpenNext triggers), and fills the gap. It is a no-op for
// builds that do not produce standalone output (e.g. `next build` on Vercel).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const buildDir = join(process.cwd(), ".next");
const standaloneServerDir = join(buildDir, "standalone", ".next", "server");
const source = join(buildDir, "server", "middleware.js");
const target = join(standaloneServerDir, "middleware.js");

if (!existsSync(join(buildDir, "standalone"))) {
  process.exit(0);
}

if (!existsSync(source)) {
  console.log("[copy-standalone-middleware] no middleware bundle in this build, skipping");
  process.exit(0);
}

if (existsSync(target)) {
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

const sourceMap = `${source}.map`;
if (existsSync(sourceMap)) copyFileSync(sourceMap, `${target}.map`);

console.log("[copy-standalone-middleware] copied middleware bundle into standalone output");
