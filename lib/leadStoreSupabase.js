/**
 * THE DURABLE LEAD STORE. Supabase REST, no npm package.
 *
 * WHY THIS FILE EXISTS: the file driver writes to /tmp on Vercel. /tmp is
 * EPHEMERAL — a redeploy, or a cold start on another machine, and a parent's
 * enquiry is gone with nothing on screen to say so. That is the single most
 * expensive bug this client can have, so it gets a real store.
 *
 * WHY REST AND NOT @supabase/supabase-js: because that is how OUR OWN CODE
 * already does it and it works in production — trip2-spicy/lib/leads.js
 * saveLead() posts to ${SUPABASE_URL}/rest/v1/leads with apikey + Bearer and
 * needs no package at all. When something is already proven in our own code we
 * copy it instead of inventing a second way.
 *
 * PURE AND INJECTABLE: every function takes its env and its fetch, so the tests
 * run this exact file in plain Node with a stub and no network and no database.
 *
 * NOTHING HERE WRITES TO A DATABASE UNTIL SPICY SETS THE TWO ENV VARS AND
 * APPLIES scripts/leads-table.sql. No agent applies a migration.
 */

/** The one table, in the Orbilynk platform project. See clients/bella/crm/LEAD-STORE.md. */
export const TABLE = "client_leads";

/** A read is cheap to retry. A write is NEVER retried: a re-sent POST is a duplicate row. */
export const READ_TIMEOUT_MS = 2500;
export const WRITE_TIMEOUT_MS = 6000;

/**
 * Reads the two env vars and says exactly which one is missing.
 * FAIL CLOSED AND LOUD: it never guesses, and it never falls back to the
 * ephemeral file store behind the owner's back.
 */
export function supabaseConfig(env = {}) {
  const url = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(env.SUPABASE_SERVICE_KEY || "");
  const missing = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!key) missing.push("SUPABASE_SERVICE_KEY");
  return { url, key, missing, ok: missing.length === 0 };
}

function headers(cfg, extra = {}) {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** camelCase on our side, snake_case in Postgres. ONE place does the mapping. */
export function toRow(client, lead) {
  return {
    client,
    parent_name: lead.parentName ?? null,
    email: lead.email ?? null,
    phone: lead.phone || null,
    child_age: lead.childAge || null,
    start_month: lead.startMonth || null,
    message: lead.message || null,
    lang: lead.lang || null,
    qa: lead.qa === true,
  };
}

export function fromRow(r) {
  return {
    id: String(r.id),
    at: r.created_at,
    parentName: r.parent_name || "",
    email: r.email || "",
    phone: r.phone || "",
    childAge: r.child_age || "",
    startMonth: r.start_month || "",
    message: r.message || "",
    lang: r.lang || "",
    qa: r.qa === true,
  };
}

export function insertRequest(cfg, client, lead) {
  return {
    url: `${cfg.url}/rest/v1/${TABLE}?select=id,created_at`,
    init: {
      method: "POST",
      headers: headers(cfg, { Prefer: "return=representation" }),
      body: JSON.stringify(toRow(client, lead)),
    },
  };
}

export function selectRequest(cfg, client, limit = 500) {
  const q = `client=eq.${encodeURIComponent(client)}&order=created_at.desc&limit=${limit}`;
  return {
    url: `${cfg.url}/rest/v1/${TABLE}?select=*&${q}`,
    init: { method: "GET", headers: headers(cfg) },
  };
}

/** Is this a dropped connection (worth one more try) rather than an answer we got? */
export function isNetFail(e) {
  const codes = new Set(["UND_ERR_SOCKET", "ECONNRESET", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ENOTFOUND", "UND_ERR_CONNECT_TIMEOUT"]);
  for (let x = e, hops = 0; x && hops < 5; x = x.cause, hops += 1) {
    if (codes.has(x.code) || x.name === "TimeoutError" || x.name === "AbortError") return true;
    if (/fetch failed|other side closed|socket disconnected/i.test(String(x.message || ""))) return true;
  }
  return false;
}

export async function insertLead({ env, client, lead, fetchImpl = fetch, timeoutMs = WRITE_TIMEOUT_MS }) {
  const cfg = supabaseConfig(env);
  if (!cfg.ok) throw new Error(`leadStore(supabase): missing ${cfg.missing.join(" and ")}`);
  const { url, init } = insertRequest(cfg, client, lead);
  const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`leadStore(supabase): insert ${res.status} ${body.slice(0, 160)}`);
  }
  const rows = await res.json().catch(() => []);
  const r = rows?.[0] || {};
  return { id: String(r.id ?? ""), at: r.created_at || new Date().toISOString(), ...lead };
}

export async function selectLeads({ env, client, fetchImpl = fetch, timeoutMs = READ_TIMEOUT_MS, tries = 2 }) {
  const cfg = supabaseConfig(env);
  if (!cfg.ok) throw new Error(`leadStore(supabase): missing ${cfg.missing.join(" and ")}`);
  const { url, init } = selectRequest(cfg, client);
  let last;
  for (let i = 1; i <= Math.max(1, tries); i += 1) {
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`leadStore(supabase): select ${res.status}`);
      const rows = await res.json();
      return (Array.isArray(rows) ? rows : []).map(fromRow);
    } catch (e) {
      last = e;
      if (i >= Math.max(1, tries) || !isNetFail(e)) break;
    }
  }
  throw last;
}
