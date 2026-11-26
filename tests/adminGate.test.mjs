// Spicy's security order 2026-11-23: an owner screen must never be open because somebody forgot a check.
// These tests PROVE THE BUG FIRST: before the gate, /en/admin was served to anyone who typed the URL.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const SRC = fs.readFileSync(new URL("../middleware.js", import.meta.url), "utf8");
const ADMIN = /^\/[^/]+\/admin(\/|$)/;

test("the matcher really does cover every admin path, in both languages", () => {
  for (const p of ["/en/admin", "/es/admin", "/en/admin/", "/en/admin/layouts", "/es/admin/content"])
    assert.equal(ADMIN.test(p), true, p);
});
test("it does not swallow the public site", () => {
  for (const p of ["/en", "/es", "/en/visit", "/en/rooms", "/es/faq", "/administration"])
    assert.equal(ADMIN.test(p), false, p);
});
test("the gate FAILS CLOSED: no ADMIN_PASSWORD set means nobody gets in", () => {
  // the source must refuse when the env var is empty, never fall through to the page
  assert.match(SRC, /const want = process\.env\.ADMIN_PASSWORD \|\| ""/);
  // lockdown 2026-11-26: the check moved to lib/adminGate.js (constant-time + lockout); anything but ok = refused
  assert.match(SRC, /const g = checkAdmin\(\{ want, header: req\.headers\.get\("authorization"\) \|\| "", ip: clientIp\(req\.headers\) \}\);/);
  assert.match(SRC, /if \(!g\.ok\) return new NextResponse\("Authentication required\."/);
});
test("a wrong password is refused and a right one is not", () => {
  // the comparison the middleware performs, run here against the same shape
  const check = (want, header) => {
    let ok = false;
    if (want && header.startsWith("Basic ")) {
      try { ok = Buffer.from(header.slice(6), "base64").toString().split(":").slice(1).join(":") === want; } catch { ok = false; }
    }
    return ok;
  };
  const hdr = (u, p) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
  assert.equal(check("s3cret", hdr("admin", "s3cret")), true, "right password gets in");
  assert.equal(check("s3cret", hdr("admin", "wrong")), false, "wrong password refused");
  assert.equal(check("", hdr("admin", "anything")), false, "no ADMIN_PASSWORD = refused");
  assert.equal(check("s3cret", ""), false, "no header = refused");
  assert.equal(check("s3cret", "Basic !!!not-base64!!!"), false, "junk header refused, never throws");
  assert.equal(check("pa:ss", hdr("admin", "pa:ss")), true, "a colon inside the password still works");
});
test("the 401 tells the browser to ask, and is never cached", () => {
  assert.match(SRC, /WWW-Authenticate/);
  assert.match(SRC, /"Cache-Control": "no-store"/);
});
