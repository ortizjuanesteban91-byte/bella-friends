import { makeT } from "@/lib/t";
import { buildAnswers } from "@/lib/answers";
import { site } from "@/lib/site";
import Header from "@/components/kit/Header";
import CallBar from "@/components/kit/CallBar";
import Footer from "@/components/kit/Footer";
import { Placeholder } from "@/components/kit/Placeholder";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return { title: t("Questions parents ask"), alternates: { canonical: `/${lang}/faq` } };
}

/**
 * THE SAME SOURCE AS THE BOT. lib/answers.js feeds this page, the FAQPage
 * schema below and bot/dictionary.json. One fact, one source — the page and the
 * bot cannot contradict each other because there is only one of them.
 * Only ANSWERED questions go into the schema. We never show Google an answer we
 * do not have.
 */
export default async function Page({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  const rows = buildAnswers(t, site);
  const answered = rows.filter((r) => r.a);
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((r) => ({
      "@type": "Question",
      name: r.q,
      acceptedAnswer: { "@type": "Answer", text: r.a },
    })),
  };
  return (
    <>
      <Header lang={lang} t={t} />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <section>
          <div className="shell" style={{ maxWidth: 740 }}>
            <p className="eyebrow">{t("Questions")}</p>
            <h1>{t("The questions parents actually ask")}</h1>
            <p className="hint">
              {t("{answered} of {total} answered. The rest are waiting on the school and are marked.", {
                answered: answered.length, total: rows.length,
              })}
            </p>
            <dl>
              {rows.map((r) => (
                <div key={r.id} style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
                  <dt><h3 style={{ margin: 0 }}>{r.q}</h3></dt>
                  <dd style={{ margin: ".5em 0 0" }}>
                    {r.a ? <span style={{ color: "var(--ink-soft)" }}>{r.a}</span> : <Placeholder ask={r.ask} block />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <CallBar lang={lang} t={t} />
    </>
  );
}
