import Link from "next/link";
import { cookies, headers } from "next/headers";
import { LAYOUTS, PALETTES, resolveLayout, resolvePalette } from "@/lib/layout";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose the layout", robots: { index: false, follow: false } };

/**
 * THE PICKER, ON THE ONE PREVIEW LINK — his locked rule, 2026-11-14:
 * "Design choices come as a picker of about six layouts that differ in layout,
 * not colour — ON THE ONE PREVIEW LINK, in the admin, never an artifact."
 * The admin copy of this page is behind a password that is deliberately unset,
 * so it refuses everyone. This copy is public on the preview so he can actually
 * tap through the layouts. It changes nothing and stores nothing but a cookie.
 */
export default async function Layouts({ params }) {
  const { lang } = await params;
  const h = await headers();
  const c = await cookies();
  const current = resolveLayout(h.get("x-bf-layout") || c.get("bf_layout")?.value, site.brand.layout);
  const pal = resolvePalette(h.get("x-bf-palette") || c.get("bf_palette")?.value, site.brand.palette);
  return (
    <main id="main" className="shell" style={{ paddingTop: 24, paddingBottom: 56 }}>
      <p className="eyebrow">Bella Friends — preview</p>
      <h1 style={{ fontSize: "1.7rem" }}>Choose the layout</h1>
      <p>
        Tap one and the whole site changes. Nothing is rebuilt and the link never changes.
        Showing now: <strong>{LAYOUTS.find((l) => l.id === current)?.name}</strong>.
      </p>

      <div className="cards">
        {LAYOUTS.map((l) => (
          <article className="card" key={l.id} aria-current={l.id === current ? "true" : undefined}>
            <h3 style={{ margin: 0 }}>
              {l.name} {l.id === current && <span className="tag">SHOWING NOW</span>}
            </h3>
            <p style={{ margin: ".4em 0 .8em" }}>{l.note}</p>
            <Link className="btn btn--wide" href={`/${lang}?layout=${l.id}`}>
              See the site in {l.name}
            </Link>
            <Link className="btn btn--ghost btn--wide" style={{ marginTop: 8 }} href={`/${lang}/layouts?layout=${l.id}`}>
              Set it and stay here
            </Link>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: 34 }}>Colour</h2>
      <p>Separate from layout on purpose, so a layout decision is never really a colour decision.</p>
      <div className="hero__cta">
        {PALETTES.map((p) => (
          <Link key={p.id} className={p.id === pal ? "btn" : "btn btn--ghost"} href={`/${lang}/layouts?palette=${p.id}`}>
            {p.name}
          </Link>
        ))}
      </div>

      <p className="hint" style={{ marginTop: 28 }}>
        Your pick sticks in this browser only. Tell me which one and I set it as the
        default for everyone who opens the link.
      </p>
      <p><Link className="btn btn--ghost" href={`/${lang}`}>Back to the site</Link></p>
    </main>
  );
}
