import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ask, dictionary } from "../lib/bot.js";
import { buildAnswers } from "../lib/answers.js";
import { BANK, groupOf } from "../scripts/bot-tests/bella-bank.mjs";

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
 * THE BANK LIVES IN ONE FILE — scripts/bot-tests/bella-bank.mjs — so the number
 * this test prints and the number the live preview run prints are the same bank.
 */

test("THE BOT SCORE — every question routes to the right answer or to a clean handoff", () => {
  let right = 0;
  const misses = [];
  const byGroup = new Map();
  BANK.forEach(([lang, q, expect, why, needs], i) => {
    const t = lang === "es" ? tEs : tEn;
    const r = ask(q, t, cfg);
    const got = r.kind === "answer" ? r.id : null;
    const g = groupOf(i);
    const tally = byGroup.get(g) || { ok: 0, n: 0 };
    tally.n += 1;
    let bad = null;
    if (got !== expect) bad = `${r.kind}${got ? ":" + got : ""} (wanted ${expect || "handoff"})`;
    /* A HANDOFF IS NOT ONE THING. "I did not understand" and "the school has not
       told me yet" are different failures and the owner must see which. */
    else if (expect === null && why && r.reason !== why) bad = `handoff reason "${r.reason}" (wanted "${why}")`;
    else if (expect === null && needs && r.id !== needs) bad = `handoff recognised "${r.id}" (wanted "${needs}")`;
    if (bad) misses.push(`[${g}] ${lang} "${q}" -> ${bad}`);
    else { right++; tally.ok += 1; }
    byGroup.set(g, tally);
  });
  for (const [g, v] of byGroup) console.log(`  ${g}: ${v.ok}/${v.n}`);
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

test("NO FIGURE AND NO PROMISE EVER LEAVES THE BOT — every row in the bank, both languages", () => {
  for (const [lang, q] of BANK) {
    const r = ask(q, lang === "es" ? tEs : tEn, cfg);
    if (r.kind !== "answer") continue;
    /* No money unless the school itself turned prices on. */
    if (!cfg.tuition.showPrices) {
      assert.equal(/\$\s?\d|\d+\s*(usd|dollars)/i.test(r.a), false, `a figure escaped on "${q}": ${r.a}`);
    }
    /* It may invite, it may never promise. A confirmed place is the owner's word. */
    assert.equal(
      /\b(you are enrolled|place is confirmed|confirmed your|reserved for you|cupo confirmado|esta inscrito)\b/i.test(r.a),
      false,
      `the bot promised something on "${q}": ${r.a}`
    );
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
