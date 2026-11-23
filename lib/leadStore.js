import fs from "node:fs/promises";
import path from "node:path";
import { site } from "@/lib/site";

/**
 * WHERE A LEAD GOES. One place, read by the API route AND by /admin, so the
 * form and the owner's screen can never disagree about how many leads exist.
 *
 * driver "file"     - writes JSON. Local dev: ./.data/leads.json. Serverless
 *                     (Vercel): /tmp, which is EPHEMERAL - it proves the whole
 *                     path end to end but it is NOT durable storage.
 * driver "supabase" - the real destination. WIRED BUT NOT CONFIGURED: it needs
 *                     a project and keys, and only Spicy creates those. No
 *                     agent writes to a database. Until then this throws loudly
 *                     rather than silently dropping a parent's enquiry.
 *
 * A LEAD IS NEVER LOST QUIETLY. If the store fails, the API answers 503 and the
 * form tells the parent to call instead. A form that looks like it worked and
 * did not is the most expensive bug this file can have.
 */
const SERVERLESS = Boolean(process.env.VERCEL);
const FILE = SERVERLESS ? "/tmp/bella-leads.json" : path.join(process.cwd(), ".data", "leads.json");

export function driver() { return site.integrations.leadStore || "file"; }
export function storeNote() {
  if (driver() === "supabase") return "Supabase — NOT CONFIGURED (no project, no keys).";
  return SERVERLESS
    ? "File store at /tmp — proves the path, EPHEMERAL. Not durable until Supabase is configured."
    : `File store at ${FILE} — local development.`;
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
    throw new Error("leadStore: supabase driver is NOT CONFIGURED. Set the project and keys first.");
  }
  const rows = await readFile();
  const row = { id: `L${Date.now().toString(36)}`, at: new Date().toISOString(), ...lead };
  rows.unshift(row);
  await writeFile(rows);
  return row;
}

export async function listLeads({ includeQa = false } = {}) {
  const rows = await readFile();
  const qa = rows.filter((r) => r.qa === true).length;
  const shown = includeQa ? rows : rows.filter((r) => r.qa !== true);
  /* A FILTER THAT HIDES ROWS MUST SAY HOW MANY IT HID. Paid for on 2026-11-14. */
  return { rows: shown, total: rows.length, hiddenQa: includeQa ? 0 : qa };
}
