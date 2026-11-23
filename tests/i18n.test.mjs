import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const en = JSON.parse(readFileSync(path.join(ROOT, "content/en.json"), "utf8"));
const es = JSON.parse(readFileSync(path.join(ROOT, "content/es.json"), "utf8"));
const SAME_IN_BOTH = new Set(["Pre-K", "{campus}: {addr}", "EN", "ES"]);

test("every English string has a Spanish key", () => {
  const missing = Object.keys(en).filter((k) => !(k in es));
  assert.deepEqual(missing, [], "missing Spanish keys");
});

test("A KEY THAT MERELY EXISTS IS NOT A TRANSLATION — no English pasted into es.json", () => {
  const pasted = Object.keys(es).filter((k) => es[k] === k && !SAME_IN_BOTH.has(k));
  assert.deepEqual(pasted, [], "English found inside Spanish copy");
});

test("placeholders survive translation — {vars} must match on both sides", () => {
  const vre = /\{[a-zA-Z]+\}/g;
  for (const k of Object.keys(en)) {
    const a = (k.match(vre) || []).sort();
    const b = ((es[k] || "").match(vre) || []).sort();
    assert.deepEqual(b, a, `variable mismatch in: ${k}`);
  }
});

test("no Spanish value is empty", () => {
  for (const [k, v] of Object.entries(es)) assert.ok(String(v).trim().length > 0, `empty: ${k}`);
});
