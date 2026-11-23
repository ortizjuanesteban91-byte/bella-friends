import Link from "next/link";
import { site } from "@/lib/site";
import F from "./Placeholder";
import PhotoSlot from "./PhotoSlot";

/**
 * AGE BANDS WITH EXACT RANGES, IN THE NAVIGATION OF THE PAGE.
 * Taken from Goddard (goddardschool.com, opened 2026-11-23), which puts the
 * exact month ranges in its own nav, and from Kids Count Too's age model.
 * A parent's first question is "do you take a child this age".
 */
export default function Programs({ lang, t, qs = "", heading = true }) {
  return (
    <section id="programs">
      <div className="shell">
        {heading && (
          <>
            <p className="eyebrow">{t("Rooms and ages")}</p>
            <h2>{t("Which room does my child go in?")}</h2>
          </>
        )}
        <div className="cards">
          {site.programs.map((p, i) => (
            <article className="card" key={p.slug}>
              <PhotoSlot fact={site.photos.rooms} w={1200} h={760} art={i}
                label={t("Photo of the {name} room.", { name: p.name })} />
              <h3 style={{ marginTop: 14 }}>{t(p.name)}</h3>
              <p className="eyebrow" style={{ margin: "0 0 .5em" }}>{p.ages}</p>
              <p><F fact={p.blurb} block /></p>
              <Link className="btn btn--ghost btn--wide" href={`/${lang}/visit?room=${p.slug}`}>
                {t("Ask about a place")}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
