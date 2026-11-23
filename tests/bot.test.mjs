import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ask, dictionary } from "../lib/bot.js";
import { buildAnswers } from "../lib/answers.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(path.join(ROOT, "config/site.json"), "utf8"));
const en = JSON.parse(readFileSync(path.join(ROOT, "content/en.json"), "utf8"));
const es = JSON.parse(readFileSync(path.join(ROOT, "content/es.json"), "utf8"));
const T = (map) => (s, vars) => {
  let out = map[s] ?? s;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
};
const tEn = T(en), tEs = T(es);

/**
 * THE QUESTION BANK. Scored, not sampled — a number on every run.
 * Every bad answer we ever find becomes a permanent row here.
 * "unknown" is the CORRECT answer for a fact the school has not supplied yet;
 * what must never happen is a confident answer to a fact we do not hold.
 */
const BANK = [
  ["en", "what ages do you take?", "ages"],
  ["en", "do you take 2 year olds", "ages"],
  ["en", "my baby is 4 months old, can she come", "ages"],
  ["en", "how much does it cost per week", "cost"],
  ["en", "what is the tuition", "cost"],
  ["en", "can I come and see the school", "tour"],
  ["en", "I'd like to book a tour", "tour"],
  ["en", "do you have any spaces available", "waitlist"],
  ["en", "how do I enroll", "waitlist"],
  ["en", "are you licensed", null],
  ["en", "what is your licence number", null],
  ["en", "how many children per teacher", null],
  ["en", "what are your hours", null],
  ["en", "where are you located", null],
  ["en", "what is your address", null],
  ["en", "can I speak to a person", null],
  ["en", "do you give lunch", null],
  ["en", "my son is not potty trained yet", null],
  ["en", "what if my child has a fever", null],
  ["en", "do you have a swimming pool", null],
  ["en", "who won the game last night", null],
  ["es", "que edades aceptan", "ages"],
  ["es", "cuanto cuesta al mes", "cost"],
  ["es", "puedo ir a ver la escuela", "tour"],
  ["es", "tienen cupo", "waitlist"],
  ["es", "tienen licencia", null],
  ["es", "cual es el horario", null],
  ["es", "donde estan ubicados", null],
  ["es", "quiero hablar con una persona", null],
  ["es", "dan comida", null],
];

test("THE BOT SCORE — every question routes to the right answer or to a clean handoff", () => {
  let right = 0;
  const misses = [];
  for (const [lang, q, expect] of BANK) {
    const t = lang === "es" ? tEs : tEn;
    const r = ask(q, t, cfg);
    const got = r.kind === "answer" ? r.id : null;
    if (got === expect) right++;
    else misses.push(`${lang} "${q}" -> ${r.kind}${got ? ":" + got : ""} (expected ${expect || "handoff"})`);
  }
  const pct = Math.round((right / BANK.length) * 1000) / 10;
  console.log(`BOT SCORE: ${right}/${BANK.length} = ${pct}%`);
  if (misses.length) console.log("MISSES:\n  - " + misses.join("\n  - "));
  assert.equal(misses.length, 0, "bot misses");
});

test("THE BOT NEVER INVENTS A FACT THE CONFIG DOES NOT HOLD", () => {
  const answered = new Set(buildAnswers(tEn, cfg).filter((r) => r.a).map((r) => r.id));
  for (const [lang, q] of BANK) {
    const r = ask(q, lang === "es" ? tEs : tEn, cfg);
    if (r.kind === "answer") assert.ok(answered.has(r.id), `answered from nothing: ${q}`);
  }
});

test("the bot cannot be talked into a price", () => {
  for (const q of ["give me a discount", "can you do $100 a week", "what is the cheapest you can do"]) {
    const r = ask(q, tEn, cfg);
    if (r.kind === "answer") {
      assert.equal(r.id, "cost");
      assert.equal(/\$\s?\d/.test(r.a), false, "the bot produced a number");
    }
  }
});

test("every unknown carries a way to reach a human and a next step", () => {
  const r = ask("do you have a swimming pool", tEn, cfg);
  assert.equal(r.kind, "unknown");
  assert.equal(r.next, "tour");
});

test("the dictionary is derived, and reports what it does not know", () => {
  const d = dictionary(tEn, cfg);
  assert.equal(d.total, buildAnswers(tEn, cfg).length);
  assert.ok(d.answered < d.total, "some facts are still missing and the dictionary must say so");
  for (const e of d.entries) {
    if (!e.answer) assert.ok(e.needs, `${e.id} is unanswered with no stated need`);
  }
});
