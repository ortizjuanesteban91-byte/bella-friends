// Spicy's lockdown order 2026-11-26 (same pattern as Trip2).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkAdmin, sameSecret, passwordFromHeader, LOCK, clientIp, _resetForTests } from "../lib/adminGate.js";
import { formLimited, FORM, _resetForTests as resetForm } from "../lib/formLimit.js";
const src = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const hdr = (p) => "Basic " + Buffer.from(`admin:${p}`).toString("base64");

test("admin gate: right password in, wrong out, unset password = nobody", () => {
  _resetForTests();
  assert.equal(checkAdmin({ want: "s3cret", header: hdr("s3cret"), ip: "a" }).ok, true);
  assert.equal(checkAdmin({ want: "s3cret", header: hdr("nope"), ip: "b" }).status, 401);
  assert.equal(checkAdmin({ want: "", header: hdr(""), ip: "c" }).ok, false);
  assert.equal(checkAdmin({ want: "s3cret", header: "", ip: "d" }).status, 401);
  assert.equal(checkAdmin({ want: "pa:ss", header: hdr("pa:ss"), ip: "e" }).ok, true);
  assert.equal(passwordFromHeader("Basic !!!"), null);
  assert.equal(sameSecret("abc", "abc"), true); assert.equal(sameSecret("abc", "abd"), false); assert.equal(sameSecret("abc", "abcd"), false);
});

test("admin gate: 5 wrong passwords = locked 15 minutes, even the RIGHT password is refused while locked", () => {
  _resetForTests(); const t = 1_800_000_000_000;
  for (let i = 0; i < 3; i++) assert.equal(checkAdmin({ want: "s3cret", header: "", ip: "x", now: t }).status, 401, "no password sent is not counted");
  for (let i = 0; i < LOCK.max; i++) assert.equal(checkAdmin({ want: "s3cret", header: hdr("guess" + i), ip: "x", now: t + i }).status, 401);
  const locked = checkAdmin({ want: "s3cret", header: hdr("s3cret"), ip: "x", now: t + 1000 });
  assert.equal(locked.status, 429); assert.ok(locked.retryAfter > 0 && locked.retryAfter <= 900);
  assert.equal(checkAdmin({ want: "s3cret", header: hdr("s3cret"), ip: "other", now: t + 1000 }).ok, true, "another IP is not locked");
  assert.equal(checkAdmin({ want: "s3cret", header: hdr("s3cret"), ip: "x", now: t + LOCK.windowMs + 10 }).ok, true, "open after 15 minutes");
  assert.deepEqual(LOCK, { max: 5, windowMs: 15 * 60e3 });
});

test("lead form: 5 sends per IP per 10 minutes, checked before anything is stored", () => {
  resetForm(); const t = 1_800_000_000_000;
  for (let i = 0; i < 5; i++) assert.equal(formLimited("ip1", t + i).limited, false);
  assert.equal(formLimited("ip1", t + 10).limited, true);
  assert.equal(formLimited("ip2", t + 10).limited, false);
  assert.equal(formLimited("ip1", t + FORM.windowMs + 10).limited, false);
  const r = src("app/api/lead/route.js");
  assert.ok(r.indexOf("formLimited(") < r.indexOf("req.json()") && r.indexOf("formLimited(") < r.indexOf("addLead("));
  assert.equal(clientIp(new Headers({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })), "9.9.9.9");
});

test("framework: Next.js 15.5.29 (GHSA-2464-fhr4-w9xw and the 15.5.28 advisories fixed)", () => {
  assert.equal(JSON.parse(src("node_modules/next/package.json")).version, "15.5.29");
  assert.match(src("package.json"), /"next": "15\.5\.29"/);
});
