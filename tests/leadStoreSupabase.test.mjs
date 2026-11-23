import test from "node:test";
import assert from "node:assert/strict";
import {
  TABLE, supabaseConfig, toRow, fromRow, insertRequest, selectRequest,
  insertLead, selectLeads, isNetFail,
} from "../lib/leadStoreSupabase.js";

/**
 * THE DURABLE STORE, PROVED WITHOUT A DATABASE.
 * Every test here runs the file that ships, with a stub fetch. No network, no
 * keys, no rows written anywhere. The one thing it cannot prove is that the
 * table exists — that is Spicy applying scripts/leads-table.sql.
 */

const ENV = { SUPABASE_URL: "https://proj.supabase.co", SUPABASE_SERVICE_KEY: "svc-key-123" };

test("it names the missing env var instead of guessing", () => {
  assert.deepEqual(supabaseConfig({}).missing, ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]);
  assert.deepEqual(supabaseConfig({ SUPABASE_URL: "https://x" }).missing, ["SUPABASE_SERVICE_KEY"]);
  assert.equal(supabaseConfig(ENV).ok, true);
});

test("a trailing slash on SUPABASE_URL cannot produce a double slash", () => {
  const cfg = supabaseConfig({ ...ENV, SUPABASE_URL: "https://proj.supabase.co/" });
  assert.equal(insertRequest(cfg, "bella-friends", {}).url.includes("//rest"), false);
});

test("the insert carries the client slug, the service key and return=representation", () => {
  const cfg = supabaseConfig(ENV);
  const { url, init } = insertRequest(cfg, "bella-friends", { parentName: "Ana", email: "a@b.co" });
  assert.equal(url, `https://proj.supabase.co/rest/v1/${TABLE}?select=id,created_at`);
  assert.equal(init.headers.apikey, "svc-key-123");
  assert.equal(init.headers.Authorization, "Bearer svc-key-123");
  assert.equal(init.headers.Prefer, "return=representation");
  const body = JSON.parse(init.body);
  assert.equal(body.client, "bella-friends");
  assert.equal(body.parent_name, "Ana");
  assert.equal(body.qa, false);
});

test("the read is scoped to THIS client and newest first — one client never sees another's parents", () => {
  const { url } = selectRequest(supabaseConfig(ENV), "bella-friends");
  assert.match(url, /client=eq\.bella-friends/);
  assert.match(url, /order=created_at\.desc/);
});

test("camelCase in, snake_case out, and back again with nothing lost", () => {
  const lead = { parentName: "Ana", email: "a@b.co", phone: "336", childAge: "2", startMonth: "Jan", message: "hi", lang: "es", qa: true };
  const row = toRow("bella-friends", lead);
  assert.equal(row.child_age, "2");
  assert.equal(row.start_month, "Jan");
  assert.equal(row.qa, true);
  const back = fromRow({ id: 7, created_at: "2026-11-23T00:00:00Z", ...row });
  assert.equal(back.childAge, "2");
  assert.equal(back.startMonth, "Jan");
  assert.equal(back.qa, true);
  assert.equal(back.id, "7");
});

test("an empty phone becomes null, not an empty string, so the column stays honest", () => {
  const row = toRow("c", { parentName: "A", email: "a@b.co", phone: "" });
  assert.equal(row.phone, null);
});

test("FAILS CLOSED: no keys means it throws, never a quiet write somewhere else", async () => {
  await assert.rejects(
    () => insertLead({ env: {}, client: "bella-friends", lead: { parentName: "Ana" } }),
    /missing SUPABASE_URL and SUPABASE_SERVICE_KEY/
  );
  await assert.rejects(() => selectLeads({ env: {}, client: "bella-friends" }), /missing SUPABASE/);
});

test("a 4xx from Postgres is LOUD and carries the status", async () => {
  const stub = async () => ({ ok: false, status: 401, text: async () => '{"message":"no key"}' });
  await assert.rejects(
    () => insertLead({ env: ENV, client: "c", lead: {}, fetchImpl: stub }),
    /insert 401/
  );
});

test("a good insert returns the row id the database gave, never one we made up", async () => {
  const stub = async () => ({ ok: true, status: 201, json: async () => [{ id: 42, created_at: "2026-11-23T10:00:00Z" }] });
  const r = await insertLead({ env: ENV, client: "c", lead: { parentName: "Ana" }, fetchImpl: stub });
  assert.equal(r.id, "42");
  assert.equal(r.at, "2026-11-23T10:00:00Z");
  assert.equal(r.parentName, "Ana");
});

test("A WRITE IS NEVER RETRIED — a re-sent POST is a duplicate enquiry", async () => {
  let calls = 0;
  const stub = async () => { calls += 1; const e = new Error("fetch failed"); e.code = "ECONNRESET"; throw e; };
  await assert.rejects(() => insertLead({ env: ENV, client: "c", lead: {}, fetchImpl: stub }));
  assert.equal(calls, 1);
});

test("a dropped socket on a READ is retried exactly once, then gives up loudly", async () => {
  let calls = 0;
  const stub = async () => {
    calls += 1;
    if (calls === 1) { const e = new Error("other side closed"); e.code = "UND_ERR_SOCKET"; throw e; }
    return { ok: true, status: 200, json: async () => [] };
  };
  const rows = await selectLeads({ env: ENV, client: "c", fetchImpl: stub });
  assert.deepEqual(rows, []);
  assert.equal(calls, 2);

  let always = 0;
  const dead = async () => { always += 1; const e = new Error("fetch failed"); e.code = "ECONNRESET"; throw e; };
  await assert.rejects(() => selectLeads({ env: ENV, client: "c", fetchImpl: dead }));
  assert.equal(always, 2);
});

test("an HTTP error is an ANSWER, so it is not retried", async () => {
  let calls = 0;
  const stub = async () => { calls += 1; return { ok: false, status: 500, text: async () => "" }; };
  await assert.rejects(() => selectLeads({ env: ENV, client: "c", fetchImpl: stub }), /select 500/);
  assert.equal(calls, 1);
});

test("isNetFail tells a dropped connection apart from a real answer", () => {
  assert.equal(isNetFail(Object.assign(new Error("x"), { code: "ECONNRESET" })), true);
  assert.equal(isNetFail(new Error("fetch failed")), true);
  assert.equal(isNetFail(Object.assign(new Error("t"), { name: "TimeoutError" })), true);
  assert.equal(isNetFail(new Error("select 500")), false);
});
