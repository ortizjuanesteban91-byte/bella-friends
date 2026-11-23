import Link from "next/link";
import { listLeads, storeNote, driver, isDurable } from "@/lib/leadStore";
import { makeT } from "@/lib/t";
import { openFacts } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/**
 * THE OWNER SIDE, ON A PHONE. Half a job is not a job: the parent can send an
 * enquiry AND Brittany can read it, on her phone, without a laptop.
 * A FILTER THAT HIDES ROWS SAYS HOW MANY IT HID — paid for on 2026-11-14.
 */
export default async function Admin({ params, searchParams }) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = makeT(lang);
  const includeQa = sp?.qa === "1";
  const { rows, total, hiddenQa, error } = await listLeads({ includeQa });
  const durable = isDurable();
  const open = openFacts();
  return (
    <main id="main" className="shell" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <p className="eyebrow">Bella Friends — owner</p>
      <h1 style={{ fontSize: "1.6rem" }}>Enquiries</h1>

      {/* THIS BOX ONCE SAID "NOT PROTECTED YET". That stopped being true the
          moment middleware.js landed, and a false warning on the owner's own
          screen is a lie that looks like diligence. It now says what is true. */}
      <p className="ok" style={{ fontSize: ".86rem" }}>
        <strong>This screen is locked.</strong> It is behind a password at the edge, noindexed
        and disallowed in robots.txt. If the password is ever unset the screen refuses
        everyone rather than opening — it fails closed.
      </p>

      {/* DURABILITY IS SHOWN, NOT ASSUMED. The owner must be able to see on her own
          phone whether an enquiry would survive the next deploy. */}
      <p className={durable ? "hint" : "bad"} style={{ fontSize: ".86rem" }}>
        <strong>Store:</strong> {driver()} — {storeNote()}
      </p>

      {error && (
        <p className="bad" style={{ fontSize: ".86rem" }}>
          <strong>THE ENQUIRY STORE COULD NOT BE READ.</strong> This list is empty because the
          read failed, NOT because nobody wrote in: {error}
        </p>
      )}

      <nav className="nav">
        <Link href={`/${lang}/admin/layouts`}>Change the layout</Link>
        <Link href={`/${lang}/admin/content`}>What we still need ({open.length})</Link>
        <Link href={`/${lang}`}>See the site</Link>
      </nav>

      <p>
        <strong>{rows.length}</strong> shown of <strong>{total}</strong> total.{" "}
        {hiddenQa > 0 ? (
          <>
            <strong>{hiddenQa} test row{hiddenQa === 1 ? "" : "s"} hidden.</strong>{" "}
            <Link href={`/${lang}/admin?qa=1`}>Show them</Link>
          </>
        ) : (
          <>No test rows hidden.</>
        )}
      </p>

      {/* NEVER A CLEAN SCREEN THAT IS ACTUALLY A FILTERED ONE. If rows exist and
          are all test data, say that — do not say "no enquiries". */}
      {rows.length === 0 && !error && (
        <p className="ok">
          {total === 0
            ? "No enquiries yet."
            : `Nothing to show. All ${total} row${total === 1 ? "" : "s"} here ${total === 1 ? "is" : "are"} test data.`}
        </p>
      )}

      <div className="cards">
        {rows.map((r) => (
          <article className="card" key={r.id}>
            <h3 style={{ margin: 0 }}>
              {r.parentName} {r.qa && <span className="tag tag--test">TEST ROW</span>}
            </h3>
            <p className="hint" style={{ margin: ".3em 0 .6em" }}>
              {new Date(r.at).toLocaleString()} · {r.childAge || "age not given"}
              {r.startMonth ? ` · wants ${r.startMonth}` : ""}
              {r.lang ? ` · ${r.lang.toUpperCase()}` : ""}
            </p>
            {r.message && <p style={{ color: "var(--ink)" }}>{r.message}</p>}
            <div className="hero__cta">
              <a className="btn" href={`mailto:${r.email}`}>Reply by email</a>
              {r.phone && (
                <a className="btn btn--ghost" href={`tel:${r.phone.replace(/[^+\d]/g, "")}`}>Call {r.phone}</a>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
