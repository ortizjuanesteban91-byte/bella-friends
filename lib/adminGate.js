/**
 * THE /admin GATE, ITS RULES IN ONE PLACE (Spicy's lockdown order 2026-11-26,
 * same pattern as Trip2). middleware.js calls it; tests run it directly.
 *
 * - Fails closed: no ADMIN_PASSWORD = nobody gets in (unchanged from 2026-11-23).
 * - The password is compared in constant time (no timing leak).
 * - 5 WRONG passwords from one IP = that IP is locked out for 15 minutes; while
 *   locked the password is NOT even tried. A request with no password at all
 *   (the browser asking first) is not a wrong password and is not counted.
 *
 * HONEST LIMIT: this site has no database yet, so the counter lives in the
 * memory of each Vercel edge instance. It stops a single-instance guessing run
 * but is NOT durable. The durable layers are the Vercel firewall rules (admin
 * only on the private host + Spicy's IPs, and a rate-limit rule), which Spicy
 * sets in the dashboard.
 */
export const LOCK = { max: 5, windowMs: 15 * 60e3 };
const fails = new Map();

export function clientIp(h) {
  const get = (k) => (typeof h?.get === "function" ? h.get(k) : h?.[k]) || "";
  return String(get("x-real-ip") || String(get("x-forwarded-for")).split(",")[0] || "x").trim().slice(0, 64) || "x";
}

export function sameSecret(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

export function passwordFromHeader(header) {
  if (!String(header || "").startsWith("Basic ")) return null;
  try { return atob(String(header).slice(6)).split(":").slice(1).join(":"); } catch { return null; }
}

const recent = (ip, now) => (fails.get(ip) || []).filter((t) => now - t < LOCK.windowMs);

/** -> { ok: true } | { ok: false, status: 401 | 429, retryAfter? } */
export function checkAdmin({ want, header, ip, now = Date.now() }) {
  const r = recent(ip, now);
  if (r.length >= LOCK.max) return { ok: false, status: 429, retryAfter: Math.max(1, Math.ceil((r[0] + LOCK.windowMs - now) / 1000)) };
  const sent = passwordFromHeader(header);
  if (want && sent !== null && sameSecret(sent, want)) return { ok: true };
  if (sent !== null) { r.push(now); fails.set(ip, r); if (fails.size > 5000) fails.clear(); }
  return { ok: false, status: 401 };
}
export const _resetForTests = () => fails.clear();
