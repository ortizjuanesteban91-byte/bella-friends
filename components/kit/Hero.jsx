import Link from "next/link";
import { site, val } from "@/lib/site";
import F from "./Placeholder";
import PhotoSlot from "./PhotoSlot";

/** Bright Academy's hero, modernised: softer navy, warm glow, the three
 *  reassurances a parent wants on the first screen sitting under the buttons. */
export default function Hero({ lang, t, qs = "" }) {
  const city = val(site.campuses[0]?.city) || "North Carolina";
  const first = site.programs[0]?.ages || "";
  const last = site.programs[site.programs.length - 1]?.ages || "";
  const span = first && last ? `${first.split("-")[0].trim()} – ${last.split("-").pop().trim()}` : "";

  return (
    <section className="hero">
      <div className="shell">
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

        <div className="hero__art">
          <PhotoSlot fact={site.photos.hero} w={1600} h={900} priority art={0}
            label={t("Wide photo of real children in the real room.")} />
        </div>
      </div>
    </section>
  );
}
