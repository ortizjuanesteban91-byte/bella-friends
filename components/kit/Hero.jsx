import Link from "next/link";
import { site, val } from "@/lib/site";
import F from "./Placeholder";
import PhotoSlot from "./PhotoSlot";

export default function Hero({ lang, t, qs = "" }) {
  const area = site.campuses[0]?.city || "North Carolina";
  return (
    <section className="hero">
      <div className="shell">
        <p className="eyebrow">{t("Licensed preschool and childcare in {area}", { area })}</p>
        <h1>
          {t("A small school where every child has a name, a friend and a grown-up who knows them.")}
        </h1>
        <p>
          <F fact={site.brand.tagline} />
        </p>
        <div className="hero__cta">
          <Link className="btn" href={`/${lang}/visit${qs}`}>{t("Book a tour")}</Link>
          <Link className="btn btn--ghost" href={`/${lang}/programs${qs}`}>{t("See the programs and ages")}</Link>
        </div>
        <p className="hint" style={{ marginTop: 14 }}>
          {t("You will hear back from Brittany, not a call centre.")}
        </p>
        <div className="hero__art" style={{ marginTop: 22 }}>
          <PhotoSlot fact={site.photos.hero} w={1600} h={900} priority art={0}
            label={t("Wide photo of real children in the real room.")} />
        </div>
      </div>
    </section>
  );
}
