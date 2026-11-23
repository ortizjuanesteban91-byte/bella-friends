#!/usr/bin/env node
/**
 * THE LANGUAGE SWEEP, AS A COMMAND. Two bugs this exists to stop, both already
 * shipped to paying customers on Trip2:
 *   1. English labels sitting inside non-English copy. Green tests, live bug.
 *   2. A key that merely EXISTS counted as a translation — English pasted into
 *      es.json stays "green" and ships English to a Spanish parent.
 * So this checks BOTH: is the key present, AND is the value actually different
 * from the English (unless the word is identical in both languages by nature,
 * which must be listed explicitly in SAME_IN_BOTH).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = ["app", "components", "lib"];
/* Identical in both languages by nature. Each one must be justified, never added to silence the check. */
const SAME_IN_BOTH = new Set([
  "Pre-K",          // the US grade name; Spanish-speaking parents in NC use it too
  "{campus}: {addr}", // pure interpolation, no words of its own
  "EN", "ES",
]);

/** Strings t() is called with on a variable, so the extractor cannot see them. */
const DYNAMIC = JSON.parse(readFileSync(path.join(ROOT, "config/site.json"), "utf8"))
  .programs.map((p) => p.name);

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

const files = SRC.flatMap((d) => walk(path.join(ROOT, d)));
const found = new Set(DYNAMIC);
const RE = /\bt\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  let m;
  while ((m = RE.exec(src))) {
    const raw = m[1];
    found.add(JSON.parse(raw[0] === "'" ? `"${raw.slice(1, -1).replace(/"/g, '\\"')}"` : raw));
  }
}
const strings = [...found].sort();

if (process.argv.includes("--write-en")) {
  writeFileSync(path.join(ROOT, "content/en.json"), JSON.stringify(Object.fromEntries(strings.map((s) => [s, s])), null, 2) + "\n");
  console.log(`content/en.json written — ${strings.length} source strings`);
  process.exit(0);
}

const en = JSON.parse(readFileSync(path.join(ROOT, "content/en.json"), "utf8"));
const es = JSON.parse(readFileSync(path.join(ROOT, "content/es.json"), "utf8"));

const missingFromEn = strings.filter((s) => !(s in en));
const staleInEn = Object.keys(en).filter((s) => !found.has(s));
const missingEs = strings.filter((s) => !(s in es));
const untranslatedEs = strings.filter((s) => s in es && es[s] === s && !SAME_IN_BOTH.has(s));

const report = { source: strings.length, missingFromEn, staleInEn, missingEs, untranslatedEs };
console.log(`strings in code: ${strings.length}`);
console.log(`en.json: ${Object.keys(en).length} keys · missing ${missingFromEn.length} · stale ${staleInEn.length}`);
console.log(`es.json: ${Object.keys(es).length} keys · missing ${missingEs.length} · ENGLISH-PASTED-IN ${untranslatedEs.length}`);
const cov = strings.length ? Math.round(((strings.length - missingEs.length - untranslatedEs.length) / strings.length) * 1000) / 10 : 100;
console.log(`ES real coverage: ${cov}%`);
for (const k of ["missingFromEn", "missingEs", "untranslatedEs"]) {
  if (report[k].length) console.log(`\n${k}:\n  - ` + report[k].join("\n  - "));
}
if (staleInEn.length) console.log(`\nstaleInEn (in the map, no longer in the code):\n  - ` + staleInEn.join("\n  - "));
const bad = missingFromEn.length + missingEs.length + untranslatedEs.length;
process.exit(bad ? 1 : 0);
