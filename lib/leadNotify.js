/**
 * SAFETY NET FOR A LEAD THAT IS NOT YET DURABLE.
 *
 * Measured 2026-11-25 with list_tables only, no writes:
 *   trip2-spicy (jlezxfjmlctfakwiicep) has public.leads (Trip2 guests) and
 *   public.clients (Orbilynk, Bella is id 8). It does NOT have public.client_leads.
 *   Sonia's project has its own public.leads. Neither existing leads table fits
 *   a preschool enquiry, and writing Bella's parents into Trip2 or Sonia would
 *   mix inboxes. So this file never posts to /rest/v1/leads.
 *
 * The durable store is still lib/leadStoreSupabase.js -> public.client_leads,
 * after Claude applies scripts/leads-table.sql and sets the env vars.
 * Until then, a Vercel /tmp write can vanish on the next deploy.
 *
 * This helper is the fallback so a lead is not only in /tmp:
 *   1. A structured log line on the Vercel project (an endpoint Spicy already owns).
 *   2. Optional POST to LEAD_NOTIFY_WEBHOOK, https only, if that env is set.
 *      The URL must be an endpoint Spicy owns. There is no default URL, and
 *      no guest data is sent to a third-party mail API.
 *
 * enquiry.destination in config/site.json is still null, so this does not guess
 * Brittany's or Alex's inbox. No secrets in this file. Env var names only.
 */
const LOG_PREFIX = "[lead-notify]";

export function notifyConfig(env = {}) {
  const raw = String(env.LEAD_NOTIFY_WEBHOOK || "").trim();
  if (!raw) return { webhook: "", ok: false, reason: "not-configured" };
  if (!/^https:\/\//i.test(raw)) {
    return { webhook: "", ok: false, reason: "LEAD_NOTIFY_WEBHOOK must be https" };
  }
  return { webhook: raw, ok: true, reason: "ok" };
}

/** The body posted to the webhook. No keys, no tokens, no other guests. */
export function notifyPayload({ client, row, durable }) {
  return {
    source: "bella-friends",
    client,
    durable: durable === true,
    id: row.id ?? null,
    at: row.at ?? null,
    parentName: row.parentName ?? null,
    email: row.email ?? null,
    phone: row.phone || null,
    childAge: row.childAge || null,
    startMonth: row.startMonth || null,
    message: row.message || null,
    lang: row.lang || null,
    qa: row.qa === true,
  };
}

export async function notifyLead({
  env = {},
  client,
  row,
  durable,
  fetchImpl = fetch,
  timeoutMs = 4000,
} = {}) {
  const payload = notifyPayload({ client, row, durable });
  const cfg = notifyConfig(env);

  if (!durable) {
    console.warn(
      LOG_PREFIX,
      "lead is not in a durable store; it can vanish on the next deploy.",
      "id=", payload.id,
      "client=", client,
      cfg.ok ? "webhook=will-post" : `webhook=${cfg.reason}`,
    );
  }

  if (!cfg.ok) {
    if (cfg.reason !== "not-configured") console.error(LOG_PREFIX, cfg.reason);
    return { sent: false, reason: cfg.reason };
  }

  try {
    const res = await fetchImpl(cfg.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.error(LOG_PREFIX, "webhook", res.status);
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true, reason: "ok" };
  } catch (err) {
    console.error(LOG_PREFIX, "webhook failed", err?.message || err);
    return { sent: false, reason: String(err?.message || err) };
  }
}
