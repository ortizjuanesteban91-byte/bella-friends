import test from "node:test";
import assert from "node:assert/strict";
import { notifyConfig, notifyPayload, notifyLead } from "../lib/leadNotify.js";

const ROW = {
  id: "Ltest1",
  at: "2026-11-25T19:00:00.000Z",
  parentName: "Ana",
  email: "ana@example.com",
  phone: "3365550100",
  childAge: "toddlers",
  startMonth: "2027-01",
  message: "Tour please",
  lang: "en",
  qa: false,
};

test("a missing webhook is not an error — it is simply not configured", () => {
  assert.deepEqual(notifyConfig({}).reason, "not-configured");
  assert.equal(notifyConfig({}).ok, false);
});

test("http and protocol-relative URLs are refused — guest data must stay on https", () => {
  assert.match(notifyConfig({ LEAD_NOTIFY_WEBHOOK: "http://example.com/hook" }).reason, /https/);
  assert.match(notifyConfig({ LEAD_NOTIFY_WEBHOOK: "ftp://example.com/hook" }).reason, /https/);
  assert.equal(notifyConfig({ LEAD_NOTIFY_WEBHOOK: "https://hooks.example.com/lead" }).ok, true);
});

test("the payload names this client and carries no secrets", () => {
  const body = notifyPayload({ client: "bella-friends", row: ROW, durable: false });
  assert.equal(body.source, "bella-friends");
  assert.equal(body.client, "bella-friends");
  assert.equal(body.durable, false);
  assert.equal(body.email, "ana@example.com");
  const dumped = JSON.stringify(body);
  assert.equal(/SERVICE_KEY|apikey|Bearer|SUPABASE/i.test(dumped), false);
});

test("no fetch happens when the webhook is unset — nothing leaves the box", async () => {
  let calls = 0;
  const stub = async () => { calls += 1; return { ok: true, status: 200 }; };
  const r = await notifyLead({
    env: {},
    client: "bella-friends",
    row: ROW,
    durable: false,
    fetchImpl: stub,
  });
  assert.equal(r.sent, false);
  assert.equal(r.reason, "not-configured");
  assert.equal(calls, 0);
});

test("a configured https webhook is POSTed once, with the lead, and is not retried", async () => {
  let calls = 0;
  let saved;
  const stub = async (url, init) => {
    calls += 1;
    saved = { url, init };
    return { ok: true, status: 200 };
  };
  const r = await notifyLead({
    env: { LEAD_NOTIFY_WEBHOOK: "https://hooks.example.com/lead" },
    client: "bella-friends",
    row: ROW,
    durable: false,
    fetchImpl: stub,
  });
  assert.equal(r.sent, true);
  assert.equal(calls, 1);
  assert.equal(saved.url, "https://hooks.example.com/lead");
  assert.equal(saved.init.method, "POST");
  const body = JSON.parse(saved.init.body);
  assert.equal(body.id, "Ltest1");
  assert.equal(body.client, "bella-friends");
});

test("a webhook that answers 5xx is reported, and the write is not retried (no duplicate notify)", async () => {
  let calls = 0;
  const stub = async () => { calls += 1; return { ok: false, status: 502 }; };
  const r = await notifyLead({
    env: { LEAD_NOTIFY_WEBHOOK: "https://hooks.example.com/lead" },
    client: "bella-friends",
    row: ROW,
    durable: false,
    fetchImpl: stub,
  });
  assert.equal(r.sent, false);
  assert.equal(r.reason, "http-502");
  assert.equal(calls, 1);
});

test("this helper never targets /rest/v1/leads — that table is Trip2's, not Bella's", async () => {
  const urls = [];
  const stub = async (url) => { urls.push(url); return { ok: true, status: 200 }; };
  await notifyLead({
    env: { LEAD_NOTIFY_WEBHOOK: "https://hooks.example.com/lead" },
    client: "bella-friends",
    row: ROW,
    durable: false,
    fetchImpl: stub,
  });
  assert.equal(urls.some((u) => String(u).includes("/rest/v1/leads")), false);
});
