import Link from "next/link";
import { buildAnswers } from "@/lib/answers";
import { site } from "@/lib/site";

/**
 * THE HOME FAQ, ANSWERED ONLY. Layout 3 ends on an FAQ accordion, so Bella
 * does too (his pick 2026-11-24). The difference: it renders ONLY questions
 * we can actually answer. The unanswered ones are not hidden - they stay on
 * /faq marked as placeholders, where they are a list of what Brittany owes us.
 * Putting ten "PLACEHOLDER" rows on the home page would read as a broken site.
 * Same source as the bot: lib/answers.js. One fact, one source.
 */
export default function HomeFaq({ lang, t, max = 6 }) {
  const rows = buildAnswers(t, site);
  const answered = rows.filter((r) => r.a).slice(0, max);
  if (!answered.length) return null;
  return (
    <section id="faq">
      <div className="shell">
        <div className="head">
          <p className="eyebrow">{t("Questions")}</p>
          <h2>{t("The questions parents actually ask")}</h2>
        </div>
        <div className="faq">
          {answered.map((r, i) => (
            <details className="faq__item" key={r.id} open={i === 0}>
              <summary>{r.q}</summary>
              <p>{r.a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 20 }}>
          <Link className="btn btn--ghost" href={`/${lang}/faq`}>{t("See all the questions")}</Link>
        </p>
      </div>
    </section>
  );
}
