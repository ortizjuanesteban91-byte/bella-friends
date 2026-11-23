#!/usr/bin/env node
/**
 * THE GUARD THAT WOULD HAVE CAUGHT THE 500.
 * On 2026-11-23 /en/visit returned HTTP 500 for every parent while
 * `next build` passed and 14 unit tests were green: a server component had
 * passed a FUNCTION into a client component. No unit test can see that.
 * So every route is fetched for real, and the server HTML is checked for the
 * right <html lang> — the other bug class we have already shipped (183 Trip2
 * pages told Google the wrong language).
 * Usage: BASE=http://127.0.0.1:3111 node scripts/smoke.mjs
 */
const BASE = process.env.BASE || "http://127.0.0.1:3111";
const ROUTES = [
  ["/", 307, null],
  ["/en", 200, "en"], ["/es", 200, "es"],
  ["/en/programs", 200, "en"], ["/es/programs", 200, "es"],
  ["/en/about", 200, "en"], ["/es/about", 200, "es"],
  ["/en/visit", 200, "en"], ["/es/visit", 200, "es"],
  ["/en/faq", 200, "en"], ["/es/faq", 200, "es"],
  /* THE ADMIN IS LOCKED AT THE EDGE AND FAILS CLOSED. This script used to expect
     200 here, which went stale the moment middleware.js landed. Without a header
     the only correct answer is 401 — and if ADMIN_PASSWORD is unset it is 401 for
     everyone, which is the point. */
  ["/en/admin", 401, null], ["/en/admin/layouts", 401, null], ["/en/admin/content", 401, null],
  ["/robots.txt", 200, null], ["/sitemap.xml", 200, null], ["/llms.txt", 200, null],
  ["/en?layout=classic", 200, "en"], ["/en?layout=storybook&palette=forest", 200, "en"],
];
let bad = 0;
for (const [path, want, lang] of ROUTES) {
  const r = await fetch(BASE + path, { redirect: "manual" });
  const body = r.status === 200 ? await r.text() : "";
  let note = "";
  if (r.status !== want) { note += ` STATUS ${r.status} expected ${want}`; }
  if (lang && r.status === 200) {
    const m = body.match(/<html lang="([a-z-]+)"/);
    if (!m) note += " NO <html lang> IN SERVER HTML";
    else if (m[1] !== lang) note += ` lang="${m[1]}" expected "${lang}"`;
  }
  if (lang && r.status === 200 && /__next_error__/.test(body)) note += " ERROR PAGE";
  if (note) { bad++; console.log(`FAIL ${path}${note}`); }
  else console.log(`ok   ${path}`);
}
/* THE ADMIN OPENS WITH THE RIGHT PASSWORD AND NOT WITH THE WRONG ONE. */
const pw = process.env.ADMIN_PASSWORD;
if (pw) {
  const auth = (p) => ({ headers: { authorization: "Basic " + Buffer.from("admin:" + p).toString("base64") } });
  const good = await fetch(BASE + "/en/admin", auth(pw));
  if (good.status !== 200) { bad++; console.log(`FAIL /en/admin with the right password -> ${good.status}`); }
  else console.log("ok   /en/admin opens with the right password");
  const wrong = await fetch(BASE + "/en/admin", auth(pw + "x"));
  if (wrong.status !== 401) { bad++; console.log(`FAIL /en/admin with a WRONG password -> ${wrong.status}, expected 401`); }
  else console.log("ok   /en/admin refuses a wrong password");
} else {
  console.log("skip /en/admin password check — ADMIN_PASSWORD not set in this shell");
}

/* llms.txt must be generated from the config and must never invent a price. */
const llm = await (await fetch(BASE + "/llms.txt")).text();
if (!/NOT PUBLISHED/.test(llm)) { bad++; console.log("FAIL /llms.txt does not mark its unknowns"); }
else if (/\$\s?\d/.test(llm)) { bad++; console.log("FAIL /llms.txt carries a figure"); }
else console.log("ok   /llms.txt generated, unknowns marked, no figure");

/* the layout token must actually change the rendered attribute */
const c = await (await fetch(BASE + "/en?layout=classic")).text();
if (!/data-layout="classic"/.test(c)) { bad++; console.log("FAIL layout token did not apply"); }
else console.log("ok   layout token applies (classic)");
console.log(bad ? `\n${bad} FAILED` : `\nALL ${ROUTES.length + 1} CHECKS PASSED`);
process.exit(bad ? 1 : 0);
