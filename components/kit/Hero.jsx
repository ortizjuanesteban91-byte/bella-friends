import Link from "next/link";
import { site, val, filled } from "@/lib/site";
import F from "./Placeholder";

/**
 * HERO: A SLOW SLIDESHOW BEHIND GLASS. His word 2026-11-24:
 * "We have some picture like slide on the background, a glass look on the
 *  top... with slightly motion in it."
 *
 * The slides are built FROM THE BACK END (his standing rule the same day):
 * every picture comes out of config/site.json, so when Brittany's real
 * photos replace the AI ones the hero changes with them and nothing here
 * is edited twice.
 *
 * No JavaScript. The crossfade and the slow zoom are CSS animations, which
 * means no layout shift, nothing to hydrate, and it still works with JS off.
 * prefers-reduced-motion stops the movement and leaves the first frame.
 */
export default function Hero({ lang, t, qs = "" }) {
  const city = val(site.campuses[0]?.city) || "North Carolina";
  const first = site.programs[0]?.ages || "";
  const last = site.programs[site.programs.length - 1]?.ages || "";
  const span = first && last ? `${first.split("-")[0].trim()} – ${last.split("-").pop().trim()}` : "";

  // one source of truth: hero photo, then each room's photo, then outside.
  const slides = [];
  const push = (f) => { const u = filled(f) ? val(f) : null; if (u && !slides.includes(u)) slides.push(u); };
  push(site.photos.hero);
  site.programs.forEach((p) => push(p.photo));
  push(site.photos.outside);
  const anyAi = Boolean(site.photos.hero?._ai) || site.programs.some((p) => p.photo?._ai);

  return (
    <section className={`hero${slides.length ? " hero--slides" : ""}`} data-slides={slides.length || undefined}>
      {slides.length > 0 && (
        <div className="hero__bg" aria-hidden="true">
          {slides.map((u, i) => (
            <span className="hero__slide" key={u} style={{ animationDelay: `${i * 6}s` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
            </span>
          ))}
          <span className="hero__scrim" />
        </div>
      )}

      <div className="shell">
        <div className="hero__glass">
          <p className="eyebrow">
            {t("Licensed preschool and childcare in {area}", { area: city })}
            {span ? ` · ${span}` : ""}
          </p>
          <h1>
            {t("A small school where every child has a name, a friend and ")}
            <em>{t("a grown-up who knows them.")}</em>
          </h1>
          <p><F fact={site.brand.tagline} /></p>

          <div className="hero__cta">
            <Link className="btn" href={`/${lang}/visit${qs}`}>{t("Book a tour")}</Link>
            <Link className="btn btn--outline-light" href={`/${lang}/programs${qs}`}>
              {t("See the programs and ages")}
            </Link>
          </div>

          <ul className="hero__ticks">
            <li><span className="tick" aria-hidden="true">✓</span>{t("{n} age-based rooms", { n: site.programs.length })}</li>
            <li><span className="tick" aria-hidden="true">✓</span>{t("You hear back from Brittany, not a call centre")}</li>
            <li><span className="tick" aria-hidden="true">✓</span>{t("Licensed in North Carolina")}</li>
          </ul>
        </div>
      </div>

      {anyAi && <span className="hero__ai">AI preview — not the real rooms</span>}
    </section>
  );
}
