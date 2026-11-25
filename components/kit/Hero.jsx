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
  /* TRANSLATE THE RANGE BEFORE SPLITTING IT. 2026-11-25: a Spanish parent read
     "6 weeks - 18 months" because p.ages went to the page raw, never through t(). */
  const first = site.programs[0]?.ages ? t(site.programs[0].ages) : "";
  const last = site.programs.at(-1)?.ages ? t(site.programs.at(-1).ages) : "";
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
          {/* Two eyebrows, one shown at a time. On his phone the long one ate
              THREE LINES before the headline started (his screenshot
              2026-11-24 14:25). The short one is one line on a 390px screen. */}
          <p className="eyebrow eyebrow--wide">
            {t("Licensed preschool and childcare in {area}", { area: city })}
            {span ? ` · ${span}` : ""}
          </p>
          <p className="eyebrow eyebrow--narrow">
            {t("Licensed preschool · {area}", { area: city })}
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

        </div>

        {/* OUTSIDE the glass on purpose. His word 2026-11-24, on the phone:
            "This is too big... I need to see the background. It takes all the
            background." Three ticks inside the panel were a third of its
            height. Out here they read as chips on the photo and the glass
            shrinks to the headline and the two buttons. */}
        <ul className="hero__ticks">
          <li><span className="tick" aria-hidden="true">✓</span>{t("{n} age-based rooms", { n: site.programs.length })}</li>
          <li><span className="tick" aria-hidden="true">✓</span>{t("You hear back from Brittany, not a call centre")}</li>
          <li><span className="tick" aria-hidden="true">✓</span>{t("Licensed in North Carolina")}</li>
        </ul>
      </div>

      {anyAi && <span className="hero__ai">AI preview — not the real rooms</span>}
    </section>
  );
}
