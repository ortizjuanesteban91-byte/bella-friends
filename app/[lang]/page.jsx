import Link from "next/link";
import { makeT } from "@/lib/t";
import { site, val } from "@/lib/site";
import Header from "@/components/kit/Header";
import Hero from "@/components/kit/Hero";
import Facts from "@/components/kit/Facts";
import Programs from "@/components/kit/Programs";
import CallBar from "@/components/kit/CallBar";
import Footer from "@/components/kit/Footer";
import Schema from "@/components/kit/Schema";
import F from "@/components/kit/Placeholder";
import PhotoSlot from "@/components/kit/PhotoSlot";

/**
 * THE ORDER OF THIS PAGE IS THE ARGUMENT, and it is taken straight from Spicy's
 * rule for the midnight buyer, re-pointed at a parent: who am I trusting ->
 * what is the proof -> does my child fit -> who is the person -> how do I reach
 * a human. The hero does NOT have to be a giant photo; the first screen's job is
 * "is this the thing I want" (books/website.md).
 */
export default async function Home({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return (
    <>
      <Header lang={lang} t={t} />
      <main id="main">
        <Schema lang={lang} />
        <Hero lang={lang} t={t} />

        <section className="band">
          <div className="shell">
            <p className="eyebrow">{t("What a parent checks first")}</p>
            <h2>{t("The things most schools make you ring up and ask")}</h2>
            <Facts t={t} />
            <p className="hint" style={{ marginTop: 16 }}>
              {t("We publish these because we checked the other schools near you and they do not.")}
            </p>
          </div>
        </section>

        <Programs lang={lang} t={t} />

        <section className="band">
          <div className="shell">
            <p className="eyebrow">{t("Who you will actually meet")}</p>
            <h2>{t("Brittany runs this school")}</h2>
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

        <section>
          <div className="shell">
            <p className="eyebrow">{t("The next step")}</p>
            <h2>{t("Come and see the room your child would be in")}</h2>
            <p>{t("A tour takes about twenty minutes. You will meet the teacher, see the room and the playground, and get your questions answered by the person who runs the school.")}</p>
            <Link className="btn" href={`/${lang}/visit`}>{t("Book a tour")}</Link>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <CallBar lang={lang} t={t} />
    </>
  );
}
