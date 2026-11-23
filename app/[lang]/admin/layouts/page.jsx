import Link from "next/link";
import { cookies, headers } from "next/headers";
import { LAYOUTS, PALETTES, resolveLayout, resolvePalette } from "@/lib/layout";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/**
 * SIX LAYOUTS THAT DIFFER IN LAYOUT, NOT COLOUR — Spicy's locked decision,
 * in the admin, on the one preview link, NEVER an artifact he has to be sent.
 * Tapping one sets a cookie and the whole site renders in it. No rebuild, no
 * new branch, no second URL. Colour is a separate, smaller choice below so the
 * two are never confused.
 */
export default async function Layouts({ params }) {
  const { lang } = await params;
  const h = await headers();
  const c = await cookies();
  const current = resolveLayout(h.get("x-bf-layout") || c.get("bf_layout")?.value, site.brand.layout);
  const pal = resolvePalette(h.get("x-bf-palette") || c.get("bf_palette")?.value, site.brand.palette);
  return (
    <main id="main" className="shell" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <p className="eyebrow">Bella Friends — owner</p>
      <h1 style={{ fontSize: "1.6rem" }}>Choose the layout</h1>
      <p>
        Tap one. The whole site changes. Nothing is rebuilt and the link never changes.
        Currently showing: <strong>{LAYOUTS.find((l) => l.id === current)?.name}</strong>.
      </p>
      <div className="cards">
        {LAYOUTS.map((l) => (
          <article className="card" key={l.id} aria-current={l.id === current ? "true" : undefined}>
            <h3 style={{ margin: 0 }}>
              {l.name} {l.id === current && <span className="tag">SHOWING NOW</span>}
            </h3>
            <p style={{ margin: ".4em 0 .8em" }}>{l.note}</p>
            <Link className="btn btn--wide" href={`/${lang}?layout=${l.id}`}>
              Show the site in {l.name}
            </Link>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Colour</h2>
      <p>Separate from layout on purpose, so a layout decision is never really a colour decision.</p>
      <div className="hero__cta">
        {PALETTES.map((p) => (
          <Link key={p.id} className={p.id === pal ? "btn" : "btn btn--ghost"} href={`/${lang}?palette=${p.id}`}>
            {p.name}
          </Link>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 24 }}>
        To make a choice permanent for every new visitor, set <code>brand.layout</code> and{" "}
        <code>brand.palette</code> in <code>config/site.json</code>. That is the only place it lives.
      </p>
      <p><Link className="btn btn--ghost" href={`/${lang}/admin`}>Back to enquiries</Link></p>
    </main>
  );
}
