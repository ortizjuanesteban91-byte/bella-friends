#!/usr/bin/env node
/**
 * THE SAME BANK, AGAINST THE DEPLOYED PREVIEW.
 *
 *     BASE=https://<preview-host> node scripts/bot-tests/run.mjs
 *
 * WHY THIS EXISTS SEPARATELY FROM `npm test`: the unit test proves the LOOKUP.
 * This proves the whole road — the route, the language header, the JSON shape and
 * the handoff text a parent would actually read. A green unit test with a broken
 * route is exactly the "green tests, live bug" this house has already paid for.
 *
 * READ ONLY. It POSTs to /api/ask, which writes nothing anywhere. It never touches
 * /api/lead, so no row of any kind is created. There is nothing here to clean up.
 *
 * It CANNOT be run from this container against a localhost dev server the browser
 * pane cannot reach, and there is no deployment yet. Written now so the scoring is
 * one command away the hour the repo and the preview exist.
 */
import { BANK, groupOf } from "./bella-bank.mjs";

const BASE = (process.env.BASE || "").replace(/\/+$/, "");
const DELAY = Number(process.env.DELAY_MS || 150);
if (!BASE) {
  console.error("BASE is required. Example:\n  BASE=https://bella-friends.vercel.app node scripts/bot-tests/run.mjs");
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const groups = new Map();
const misses = [];
let right = 0;

for (let i = 0; i < BANK.length; i += 1) {
  const [lang, q, want, why, needs] = BANK[i];
  const g = groupOf(i);
  const tally = groups.get(g) || { ok: 0, n: 0 };
  tally.n += 1;

  let body, status;
  try {
    const res = await fetch(`${BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, lang }),
      signal: AbortSignal.timeout(10000),
    });
    status = res.status;
    body = await res.json();
  } catch (e) {
    misses.push(`[${g}] ${lang} "${q}" -> REQUEST FAILED: ${e?.message}`);
    groups.set(g, tally);
    await sleep(DELAY);
    continue;
  }

  const got = body?.kind === "answer" ? body.id : null;
  let bad = null;
  if (status !== 200) bad = `HTTP ${status}`;
  else if (got !== want) bad = `${body?.kind}${got ? ":" + got : ""} (wanted ${want || "handoff"})`;
  else if (want === null && why && body?.reason !== why) bad = `handoff reason "${body?.reason}" (wanted "${why}")`;
  /* The handoff a parent READS must carry a way to a human and a next step. */
  else if (want === null && !body?.next?.href) bad = "handoff with no next step";
  else if (!String(body?.say || "").trim()) bad = "empty answer";
  /* Nothing on the live road may carry a figure either. */
  else if (/\$\s?\d/.test(String(body?.say))) bad = `a figure escaped: ${body.say}`;

  if (bad) misses.push(`[${g}] ${lang} "${q}" -> ${bad}`);
  else { right += 1; tally.ok += 1; }
  groups.set(g, tally);
  await sleep(DELAY);
}

console.log(`\nBELLA FRIENDS BOT — LIVE SCORE on ${BASE}`);
for (const [g, v] of groups) console.log(`  ${g}: ${v.ok}/${v.n}`);
console.log(`\nSCORE: ${right}/${BANK.length} = ${Math.round((right / BANK.length) * 1000) / 10}%`);
if (misses.length) {
  console.log(`\n${misses.length} MISS${misses.length === 1 ? "" : "ES"} — each one becomes a permanent row in bella-bank.mjs:`);
  misses.forEach((m) => console.log("  - " + m));
}
process.exit(misses.length ? 1 : 0);
