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
  ["/en/admin", 200, "en"], ["/en/admin/layouts", 200, "en"], ["/en/admin/content", 200, "en"],
  ["/robots.txt", 200, null], ["/sitemap.xml", 200, null],
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
/* the layout token must actually change the rendered attribute */
const c = await (await fetch(BASE + "/en?layout=classic")).text();
if (!/data-layout="classic"/.test(c)) { bad++; console.log("FAIL layout token did not apply"); }
else console.log("ok   layout token applies (classic)");
console.log(bad ? `\n${bad} FAILED` : `\nALL ${ROUTES.length + 1} CHECKS PASSED`);
process.exit(bad ? 1 : 0);
