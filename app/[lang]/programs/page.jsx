import { makeT } from "@/lib/t";
import Header from "@/components/kit/Header";
import Programs from "@/components/kit/Programs";
import Facts from "@/components/kit/Facts";
import CallBar from "@/components/kit/CallBar";
import Footer from "@/components/kit/Footer";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return { title: t("Programs and ages"), alternates: { canonical: `/${lang}/programs` } };
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
            <p className="eyebrow">{t("Rooms and ages")}</p>
            <h1>{t("Every room, every age, in one place")}</h1>
            <p>{t("Find your child's age, read what the day looks like, and ask about a place in that room.")}</p>
            <Facts t={t} />
          </div>
        </section>
        <Programs lang={lang} t={t} heading={false} />
      </main>
      <Footer lang={lang} t={t} />
      <CallBar lang={lang} t={t} />
    </>
  );
}
