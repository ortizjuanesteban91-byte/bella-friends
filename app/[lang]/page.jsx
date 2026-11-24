import Link from "next/link";
import { makeT } from "@/lib/t";
import { site, val, filled } from "@/lib/site";
import { addressOneLine } from "@/lib/schema";
import Header from "@/components/kit/Header";
import Hero from "@/components/kit/Hero";
import Facts from "@/components/kit/Facts";
import Programs from "@/components/kit/Programs";
import CallBar from "@/components/kit/CallBar";
import Footer from "@/components/kit/Footer";
import Schema from "@/components/kit/Schema";
import HomeFaq from "@/components/kit/HomeFaq";
import F from "@/components/kit/Placeholder";
import PhotoSlot from "@/components/kit/PhotoSlot";

/**
 * BRIGHT ACADEMY, BUILT FOR BELLA. His pick 2026-11-24 from
 * spicy-agency-hub /layouts/school/3.html: "I like this one. Build this one
 * and make it more modern. The header better."
 *
 * Section order is layout 3's, because that is what he chose:
 *   hero -> stats -> creds -> programs -> why -> the person -> tour.
 * The ORDER still answers a parent in his locked sequence (books/website.md):
 * who am I trusting -> what is the proof -> does my child fit -> who is the
 * person -> how do I reach a human.
 * Nothing on this page is a claim we cannot source. Anything Brittany has not
 * sent yet renders as a visible placeholder, never as a sentence.
 */
export default async function Home({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  const city = val(site.campuses[0]?.city);
  const addr = addressOneLine(site);
  const mapQ = val(site.campuses[0]?.mapQuery) || addr;

  const why = [
    [t("You get the owner, not a call centre"),
     t("{name} runs this school and does the tours herself. The person who answers you is the person your child sees at the door.", { name: site.owner.name })],
    [t("Rooms by age, with the exact ranges"),
     t("{n} rooms from {a} upward, so you know before you call whether we take a child your child's age.", { n: site.programs.length, a: site.programs[0]?.ages?.split("-")[0]?.trim() || "" })],
    [t("The paperwork is on the page"),
     t("Licence, ratios and hours are published here instead of being something you have to ring up and ask for.")],
  ];

  return (
    <>
      <Header lang={lang} t={t} />
      <main id="main">
        <Schema lang={lang} />
        <Hero lang={lang} t={t} />

        {/* STATS — layout 3's signature band, lifted over the hero edge */}
        <div className="stats">
          <div className="shell">
            <div className="stats__grid">
              <div className="stat">
                <b>{site.programs.length}</b>
                <i>{t("Age-based rooms")}</i>
              </div>
              <div className="stat">
                <b>{site.programs[0]?.ages?.split("-")[0]?.trim()}<span>+</span></b>
                <i>{t("We take them from")}</i>
              </div>
              <div className="stat">
                <b>{site.campuses.length}</b>
                <i>{city ? t("Campus in {city}", { city }) : t("Campus")}</i>
              </div>
              <div className="stat">
                <b>NC</b>
                <i>{t("Licensed child care")}</i>
              </div>
            </div>
          </div>
        </div>

        <div className="creds">
          <div className="shell">
            <span className="cred"><span aria-hidden="true">🛡️</span>{t("North Carolina licensed")}</span>
            <span className="cred"><span aria-hidden="true">👩‍🏫</span>{t("Owner-led tours")}</span>
            <span className="cred"><span aria-hidden="true">📍</span>{city || <span className="todo">{t("Town — to add")}</span>}</span>
            <span className="cred"><span aria-hidden="true">🕒</span>{filled(site.contact.hours) ? site.contact.hours.value : <span className="todo">{t("Hours — to add")}</span>}</span>
          </div>
        </div>

        {/* THE PROOF */}
        <section>
          <div className="shell">
            <div className="head">
              <p className="eyebrow">{t("What a parent checks first")}</p>
              <h2>{t("The things most schools make you ring up and ask")}</h2>
            </div>
            <Facts t={t} />
            <p className="hint" style={{ marginTop: 16 }}>
              {t("We publish these because we checked the other schools near you and they do not.")}
            </p>
          </div>
        </section>

        <div className="band"><Programs lang={lang} t={t} /></div>

        {/* WHY US */}
        <section id="why">
          <div className="shell">
            <div className="head">
              <p className="eyebrow">{t("Why us")}</p>
              <h2>{t("What is different about a school this size")}</h2>
            </div>
            <div className="why-grid">
              {why.map(([h, p], i) => (
                <article className="wcard" key={h}>
                  <span className="num">{i + 1}</span>
                  <h3>{h}</h3>
                  <p style={{ margin: 0 }}>{p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* THE PERSON */}
        <section className="band">
          <div className="shell">
            <div className="head">
              <p className="eyebrow">{t("Who you will actually meet")}</p>
              <h2>{t("Brittany runs this school")}</h2>
            </div>
            <div className="cards">
              <div>
                <PhotoSlot fact={site.photos.team} w={1000} h={1000} art={1}
                  label={t("Photo of Brittany, and the lead teachers if they agree.")} />
              </div>
              <div>
                <h3>{site.owner.name}, <F fact={site.owner.role} /></h3>
                <p><F fact={site.trust.credentials} block /></p>
                <p><F fact={site.trust.insurance} block /></p>
                <Link className="btn btn--ghost" href={`/${lang}/about`}>{t("About the school")}</Link>
              </div>
            </div>
          </div>
        </section>


        {/* LOCATIONS — layout 3 has this band. It only exists now because the
            address is real (config/site.json, sourced from the hub preset). */}
        <section id="locations">
          <div className="shell">
            <div className="head">
              <p className="eyebrow">{t("Where we are")}</p>
              <h2>{city ? t("Find us in {city}", { city }) : t("Find us")}</h2>
            </div>
            <div className="cards">
              {site.campuses.map((c) => (
                <article className="card" key={c.name}>
                  <h3>{c.name}</h3>
                  {addr
                    ? <p style={{ fontWeight: 650, color: "var(--ink)" }}>{addr}</p>
                    : <p><F fact={site.campuses[0].street} block /></p>}
                  <p style={{ margin: "0 0 1em" }}>
                    {filled(site.contact.hours)
                      ? site.contact.hours.value
                      : <span className="todo">{t("Hours — to add")}</span>}
                  </p>
                  {mapQ && (
                    <a className="btn btn--ghost btn--wide"
                       href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`}
                       target="_blank" rel="noreferrer">
                      {t("Open in Google Maps")}
                    </a>
                  )}
                  {/* Everything still owed for this campus, shown where it will
                      go, so Alex and Brittany read it on the page itself and
                      not in a separate list. Each one disappears the moment the
                      fact lands in config/site.json. */}
                  <div className="owed">
                    <p className="owed__h">{t("Still needed for this page")}</p>
                    <F fact={site.campuses[0].googleProfile} block />
                    <F fact={site.contact.phone} block />
                    <F fact={site.contact.email} block />
                    <F fact={site.contact.hours} block />
                  </div>
                </article>
              ))}
              <article className="card">
                <h3>{t("Coming for a tour?")}</h3>
                <p>{t("Tell us your child's age and the month you need, and Brittany will give you a time that suits you.")}</p>
                <Link className="btn btn--wide" href={`/${lang}/visit`}>{t("Book a tour")}</Link>
              </article>
            </div>
          </div>
        </section>

        {/* THE NEXT STEP */}
        <section className="tour" id="tour">
          <div className="shell">
            <p className="eyebrow">{t("The next step")}</p>
            <h2>{t("Come and see the room your child would be in")}</h2>
            <p>{t("A tour takes about twenty minutes. You will meet the teacher, see the room and the playground, and get your questions answered by the person who runs the school.")}</p>
            <div className="hero__cta">
              <Link className="btn" href={`/${lang}/visit`}>{t("Book a tour")}</Link>
              <Link className="btn btn--outline-light" href={`/${lang}/faq`}>{t("Questions")}</Link>
            </div>
          </div>
        </section>
        <HomeFaq lang={lang} t={t} />
      </main>
      <Footer lang={lang} t={t} />
      <CallBar lang={lang} t={t} />
    </>
  );
}
