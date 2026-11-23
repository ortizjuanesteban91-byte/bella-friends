import { ask } from "@/lib/bot";
import { site, val } from "@/lib/site";
import { makeT, isLang } from "@/lib/t";

export const dynamic = "force-dynamic";

/** THE BOT'S FAILURES ARE LOUD. Every miss is logged with the question asked. */
export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }
  const lang = isLang(b.lang) ? b.lang : "en";
  const t = makeT(lang);
  const r = ask(b.q, t, site);

  const phone = val(site.contact.phone);
  const human = phone
    ? t("Call {phone} and you will get the school, not a call centre.", { phone })
    : t("Use the tour form and the school answers you directly.");

  if (r.kind === "unknown") {
    console.warn("[bot MISS]", JSON.stringify({ lang, q: b.q, reason: r.reason, needs: r.needs || null }));
    return Response.json({
      kind: "unknown",
      say: t("I do not know that one yet, and I am not going to guess about your child.") + " " + human,
      reason: r.reason,
      next: { label: t("Book a tour"), href: `/${lang}/visit` },
    });
  }
  return Response.json({
    kind: "answer",
    say: r.a,
    id: r.id,
    next: { label: t("Book a tour"), href: `/${lang}/visit` },
  });
}
