import { addLead, storeNote } from "@/lib/leadStore";

export const dynamic = "force-dynamic";

/** Validation lives here, not in the browser, so a bad row never reaches /admin. */
function check(b) {
  const e = [];
  const name = String(b.parentName || "").trim();
  const email = String(b.email || "").trim();
  if (name.length < 2) e.push("name");
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(email)) e.push("email");
  if (String(b.message || "").length > 2000) e.push("message");
  return e;
}

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }

  /* Honeypot: a bot fills the hidden field. Accepted and dropped, so the bot
     sees success and does not retry. Never counted as a lead. */
  if (String(b._t || "").trim() !== "") return Response.json({ ok: true }, { status: 200 });

  const bad = check(b);
  if (bad.length) return Response.json({ error: "Please check: " + bad.join(", "), fields: bad }, { status: 422 });

  /* TEST DATA CARRIES THE REAL MARKER. A row is test data only if it says so. */
  const qa = String(b.email).toLowerCase().startsWith("qa") || b.qa === true;

  try {
    const row = await addLead({
      parentName: String(b.parentName).trim(),
      email: String(b.email).trim(),
      phone: String(b.phone || "").trim(),
      childAge: String(b.childAge || "").trim(),
      startMonth: String(b.startMonth || "").trim(),
      message: String(b.message || "").trim(),
      lang: String(b.lang || "").trim(),
      qa,
    });
    return Response.json({ ok: true, id: row.id });
  } catch (err) {
    /* LOUD, NEVER QUIET. A dropped enquiry is a lost child's place. */
    console.error("[lead] STORE FAILED —", storeNote(), err?.message);
    return Response.json({ error: "We could not save that." }, { status: 503 });
  }
}
