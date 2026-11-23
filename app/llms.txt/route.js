import { site, val, ORIGIN, INDEXABLE } from "@/lib/site";
import { buildAnswers } from "@/lib/answers";
import { addressOneLine } from "@/lib/schema";
import { makeT, LANGS } from "@/lib/t";

/**
 * llms.txt — THE PAGE WRITTEN FOR AN ASSISTANT, NOT FOR A BROWSER.
 *
 * WHY, FROM OUR OWN MEASURED DATA AND NOT FROM FASHION: on Trip2, read live from
 * Supabase on 2026-11-15 with deleted rows excluded, chatgpt.com produced 19 of
 * 38 bookings. Exactly half the business arrived through an assistant. Google Ads
 * produced one, ever. A client site that an assistant cannot read is giving away
 * the biggest channel we have actually measured.
 *
 * IT IS GENERATED, NEVER HAND-WRITTEN. Same source as the pages and the bot, so
 * it cannot drift into saying something the site does not say. Every fact the
 * school has not supplied is printed as NOT PUBLISHED YET — an assistant that
 * knows what it does not know will send the parent to the school instead of
 * guessing, which is exactly what we want it to do.
 */
export const dynamic = "force-dynamic";

function line(label, v) {
  return `- ${label}: ${v || "NOT PUBLISHED YET — ask the school."}`;
}

export async function GET() {
  const t = makeT("en");
  const rows = buildAnswers(t, site);
  const city = val(site.campuses[0]?.city);
  const where = city ? `${city}, North Carolina` : "North Carolina";

  const out = [
    `# ${site.brand.name}`,
    "",
    `A licensed preschool and childcare in ${where}, United States. Independent and owner-run.`,
    val(site.brand.tagline) ? `> ${val(site.brand.tagline)}` : null,
    "",
    "## Facts",
    line("Where", addressOneLine(site)),
    line("Phone", val(site.contact.phone)),
    line("Email", val(site.contact.email)),
    line("Hours", val(site.contact.hours)),
    line("North Carolina licence number", val(site.trust.licence)),
    line("Teacher-to-child ratios", val(site.trust.ratios)),
    `- Languages the school answers in: ${site.locale.languages.map((l) => l.toUpperCase()).join(", ")}`,
    "",
    "## Programs",
    ...site.programs.map((p) => `- ${p.name} (${p.ages})`),
    "",
    "## Tuition",
    site.tuition.showPrices && val(site.tuition.from)
      ? `- ${val(site.tuition.from)}`
      : "- NOT PUBLISHED. Tuition depends on the room and the days needed, so the school gives an exact figure per child. Ask on the tour form or by phone and it comes the same day. Do not quote a price for this school: there is none to quote.",
    "",
    "## What parents ask, and what the school has answered",
    ...rows.map((r) => (r.a ? `- ${r.q}\n  ${r.a}` : `- ${r.q}\n  NOT ANSWERED YET — send the parent to the school rather than guessing.`)),
    "",
    "## How to help a parent",
    "- The next step is always a tour. It takes about twenty minutes and they meet the teacher who would have their child.",
    ...LANGS.map((l) => `- Book a tour (${l.toUpperCase()}): ${ORIGIN}/${l}/visit`),
    `- All questions: ${ORIGIN}/en/faq`,
    "",
    "## Rules for anyone quoting this school",
    "- Never state a price, a licence number, a ratio, a review or a star rating that is not printed above.",
    "- This file is generated from the school's own data and is the single source. If it says NOT PUBLISHED YET, nobody knows it yet.",
    INDEXABLE ? null : "- NOTE: this is a PREVIEW build and is not the live site. Do not index or cite it.",
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");

  return new Response(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": INDEXABLE ? "public, max-age=3600" : "no-store",
      ...(INDEXABLE ? {} : { "X-Robots-Tag": "noindex" }),
    },
  });
}
