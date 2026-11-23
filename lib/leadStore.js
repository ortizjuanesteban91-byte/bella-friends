import fs from "node:fs/promises";
import path from "node:path";
import { site } from "@/lib/site";
import { insertLead, selectLeads, supabaseConfig, TABLE } from "@/lib/leadStoreSupabase";

/**
 * WHERE A LEAD GOES. One place, read by the API route AND by /admin, so the
 * form and the owner's screen can never disagree about how many leads exist.
 *
 * driver "file"     - writes JSON. Local dev: ./.data/leads.json. Serverless
 *                     (Vercel): /tmp, which is EPHEMERAL - it proves the whole
 *                     path end to end but it is NOT durable storage.
 * driver "supabase" - the real destination, built in lib/leadStoreSupabase.js
 *                     against the same REST pattern trip2-spicy already uses in
 *                     production. It needs SUPABASE_URL + SUPABASE_SERVICE_KEY
 *                     and the table from scripts/leads-table.sql, which only
 *                     Spicy applies. No agent writes to a database.
 *
 * FAIL CLOSED, NEVER SILENTLY DOWNGRADE. If the config says "supabase" and the
 * keys are missing, this THROWS. It does not quietly write to /tmp instead:
 * that would look like a working form and lose the enquiry anyway, which is the
 * exact failure this driver exists to remove.
 *
 * A LEAD IS NEVER LOST QUIETLY. If the store fails, the API answers 503 and the
 * form tells the parent to call instead. A form that looks like it worked and
 * did not is the most expensive bug this file can have.
 */
const SERVERLESS = Boolean(process.env.VERCEL);
const FILE = SERVERLESS ? "/tmp/bella-leads.json" : path.join(process.cwd(), ".data", "leads.json");
const CLIENT = site.client;

export function driver() { return site.integrations.leadStore || "file"; }

export function storeNote() {
  if (driver() === "supabase") {
    const cfg = supabaseConfig(process.env);
    return cfg.ok
      ? `Supabase table ${TABLE}, rows for client "${CLIENT}". Durable.`
      : `Supabase selected but NOT CONFIGURED — missing ${cfg.missing.join(" and ")}. Every enquiry is being REFUSED with a 503 until it is set, on purpose, so none is lost silently.`;
  }
  return SERVERLESS
    ? "File store at /tmp — proves the path, EPHEMERAL. An enquiry here can disappear on the next deploy. Not durable until Supabase is configured."
    : `File store at ${FILE} — local development.`;
}

/** True only when the owner's enquiries survive a redeploy. Shown on /admin. */
export function isDurable() {
  return driver() === "supabase" && supabaseConfig(process.env).ok;
}

async function readFile() {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return []; }
}
async function writeFile(rows) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2));
}

export async function addLead(lead) {
  if (driver() === "supabase") {
    return insertLead({ env: process.env, client: CLIENT, lead });
  }
  const rows = await readFile();
  const row = { id: `L${Date.now().toString(36)}`, at: new Date().toISOString(), ...lead };
  rows.unshift(row);
  await writeFile(rows);
  return row;
}

export async function listLeads({ includeQa = false } = {}) {
  let rows;
  if (driver() === "supabase") {
    try {
      rows = await selectLeads({ env: process.env, client: CLIENT });
    } catch (err) {
      /* The owner must never see an empty screen that is actually a broken read. */
      console.error("[leads] READ FAILED —", storeNote(), err?.message);
      return { rows: [], total: 0, hiddenQa: 0, error: String(err?.message || err) };
    }
  } else {
    rows = await readFile();
  }
  const qa = rows.filter((r) => r.qa === true).length;
  const shown = includeQa ? rows : rows.filter((r) => r.qa !== true);
  /* A FILTER THAT HIDES ROWS MUST SAY HOW MANY IT HID. Paid for on 2026-11-14. */
  return { rows: shown, total: rows.length, hiddenQa: includeQa ? 0 : qa, error: null };
}
