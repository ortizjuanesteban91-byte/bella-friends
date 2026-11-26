/**
 * PUBLIC FORM LIMIT (Spicy's lockdown order 2026-11-26): 5 sends per IP per
 * 10 minutes. Checked before anything is stored, so a limited send saves
 * nothing. HONEST LIMIT: no database yet, so this counter is per server
 * instance and NOT durable; the Vercel firewall rate-limit rule on
 * POST /api/lead is the durable layer. When Supabase is switched on, move this
 * counter there.
 */
export const FORM = { max: 5, windowMs: 10 * 60e3 };
const hits = new Map();
export function formLimited(ip, now = Date.now()) {
  const a = (hits.get(ip) || []).filter((t) => now - t < FORM.windowMs);
  if (a.length >= FORM.max) return { limited: true, retryAfter: Math.max(1, Math.ceil((a[0] + FORM.windowMs - now) / 1000)) };
  a.push(now); hits.set(ip, a); if (hits.size > 5000) hits.clear();
  return { limited: false };
}
export const _resetForTests = () => hits.clear();
