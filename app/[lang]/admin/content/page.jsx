import Link from "next/link";
import { openFacts } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/**
 * THE LIST THE CLIENT HAS TO FILL, GENERATED FROM THE CONFIG — never typed by
 * hand, so it can never fall out of date with the pages. Every row here is a
 * visible placeholder somewhere on the site. When the row is filled, the
 * placeholder disappears by itself. THE SYSTEM IS FINISHED BEFORE THE DATA GOES
 * IN: this list is the client's paste job, not our unfinished build.
 */
export default async function Content({ params }) {
  const { lang } = await params;
  const open = openFacts();
  return (
    <main id="main" className="shell" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <p className="eyebrow">Bella Friends — owner</p>
      <h1 style={{ fontSize: "1.6rem" }}>What we still need from the school</h1>
      <p>
        <strong>{open.length}</strong> items. Each one is showing as a marked placeholder on the
        site right now. Fill it in <code>config/site.json</code> and the placeholder vanishes.
      </p>
      <ol>
        {open.map((o) => (
          <li key={o.path} style={{ marginBottom: 14 }}>
            <code style={{ fontSize: ".82rem" }}>{o.path}</code>
            <br />
            {o.ask}
          </li>
        ))}
      </ol>
      <p><Link className="btn btn--ghost" href={`/${lang}/admin`}>Back to enquiries</Link></p>
    </main>
  );
}
