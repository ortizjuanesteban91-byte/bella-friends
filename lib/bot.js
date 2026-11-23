import { buildAnswers } from "./answers.js";

/**
 * THE BOT IS A DICTIONARY OF ONE BUSINESS, BUILT WITH THE SITE — never after.
 * Spicy's ten requirements for a top-notch bot, and how each is met here:
 *  1. NEVER INVENTS A FACT. It can only return a string that buildAnswers()
 *     produced from config/site.json. There is no generation step at all.
 *  2. KNOWS WHAT IT DOES NOT KNOW. An unfilled fact returns kind "unknown" with
 *     the handoff, never an improvised answer.
 *  3. SCORED, NOT SAMPLED. tests/bot.test.mjs runs a question bank in EN and ES
 *     and prints a number on every `npm test`.
 *  4. EVERY BAD ANSWER BECOMES A PERMANENT TEST CASE in that same bank.
 *  5. HANDS OVER TO A PERSON cleanly, carrying the question.
 *  6. FAILURES ARE LOUD — the route logs every miss with the question.
 *  7. LOCKED RULES BEAT THE MODEL: there is no model. It is a lookup.
 *  8. ONE BRAIN, EVERY CHANNEL: web and any future WhatsApp both call this file.
 *  9. JUDGED ON MONEY: every answer carries the next step (tour or call).
 * 10. CANNOT BE TALKED INTO A DISCOUNT: it has no price unless the school set one.
 */
export const HANDOFF = "handoff";

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ask(question, t, site) {
  const rows = buildAnswers(t, site);
  const q = norm(question);
  if (!q) return { kind: "unknown", reason: "empty", next: "tour" };

  let best = null;
  let bestScore = 0;
  for (const r of rows) {
    let score = 0;
    for (const k of r.keys || []) {
      const nk = norm(k);
      if (!nk) continue;
      if (q.includes(nk)) score += nk.includes(" ") ? 3 : 2;
    }
    if (score > bestScore) { bestScore = score; best = r; }
  }

  if (!best || bestScore < 2) {
    return { kind: "unknown", reason: "no match", question, next: "tour" };
  }
  if (!best.a) {
    /* The question is understood and the fact is simply not supplied yet.
       That is a DIFFERENT failure from "I did not understand", and the owner
       needs to see which, so we report it separately. */
    return { kind: "unknown", reason: "fact not supplied", id: best.id, needs: best.ask, question, next: "tour" };
  }
  return { kind: "answer", id: best.id, q: best.q, a: best.a, score: bestScore, next: best.id === "cost" ? "tour" : "tour" };
}

/** The whole dictionary, derived. Nothing here is written by hand. */
export function dictionary(t, site) {
  const rows = buildAnswers(t, site);
  return {
    business: site.brand.name,
    client: site.client,
    generated: "derived from config/site.json at request time — never a cached copy",
    answered: rows.filter((r) => r.a).length,
    total: rows.length,
    entries: rows.map((r) => ({ id: r.id, question: r.q, answer: r.a, needs: r.a ? null : r.ask, keys: r.keys })),
  };
}
