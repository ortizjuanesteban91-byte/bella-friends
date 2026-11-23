import { makeT } from "@/lib/t";
import { site } from "@/lib/site";
import Header from "@/components/kit/Header";
import CallBar from "@/components/kit/CallBar";
import Footer from "@/components/kit/Footer";
import Facts from "@/components/kit/Facts";
import F from "@/components/kit/Placeholder";
import PhotoSlot from "@/components/kit/PhotoSlot";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return { title: t("About the school"), alternates: { canonical: `/${lang}/about` } };
}

export default async function Page({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return (
    <>
      <Header lang={lang} t={t} />
      <main id="main">
        <section>
          <div className="shell">
            <p className="eyebrow">{t("About us")}</p>
            <h1>{t("A small school, run by the person you meet at the door")}</h1>
            <p><F fact={site.brand.tagline} block /></p>
            <PhotoSlot fact={site.photos.outside} w={1600} h={900} art={2}
              label={t("The entrance or the playground — the thing a parent will recognise on arrival.")} />
          </div>
        </section>
        <section className="band">
          <div className="shell">
            <h2>{t("What we can prove")}</h2>
            <Facts t={t} />
          </div>
        </section>
        <section>
          <div className="shell">
            <h2>{site.owner.name}</h2>
            <p><F fact={site.owner.role} /></p>
            <p><F fact={site.trust.credentials} block /></p>
            <h3>{t("Safety")}</h3>
            <p><F fact={site.trust.insurance} block /></p>
            <h3>{t("What parents say")}</h3>
            {site.reviews.quotes.length === 0 ? (
              <p>
                <span className="ph ph--block">
                  PLACEHOLDER
                  <span className="ph__ask">{site.reviews.googlePlaceId.ask} Until then this section stays empty — we do not write reviews for a school.</span>
                </span>
              </p>
            ) : (
              <ul>{site.reviews.quotes.map((q, i) => <li key={i}>{q.text} — {q.name}</li>)}</ul>
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <CallBar lang={lang} t={t} />
    </>
  );
}
