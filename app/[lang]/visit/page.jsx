import { makeT } from "@/lib/t";
import { site, val } from "@/lib/site";
import Header from "@/components/kit/Header";
import Footer from "@/components/kit/Footer";
import LeadForm from "@/components/kit/LeadForm";
import F from "@/components/kit/Placeholder";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = makeT(lang);
  return { title: t("Book a tour"), alternates: { canonical: `/${lang}/visit` } };
}

/**
 * NO STICKY CALL BAR ON THIS PAGE, ON PURPOSE.
 * A sticky bottom bar plus an open phone keyboard is how a submit button
 * disappears. On the one page whose whole job is a form, the form IS the bar.
 */
export default async function Page({ params, searchParams }) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = makeT(lang);
  const phone = val(site.contact.phone);

  /* Translated ON THE SERVER and handed over as strings. A function cannot
     cross the client boundary — that was the /en/visit 500. */
  const labels = {
    name: t("Your name"), email: t("Email"), phone: t("Phone"),
    age: t("How old is your child?"), chooseAge: t("Choose an age group"),
    start: t("When would you like to start?"), more: t("Anything we should know?"),
    privacy: t("We use this only to answer you. We do not sell or share it."),
    submit: t("Send and ask for a tour"), sending: t("Sending…"),
    thanks: t("Thank you — your message is in."),
    thanksBody: t("Brittany will come back to you. If it is urgent, call the school."),
    call: t("Call us"), wrong: t("Something went wrong."),
    callInstead: t("Please call the school instead."), tryAgain: t("Please try again shortly."),
  };
  const rooms = site.programs.map((p) => ({ slug: p.slug, label: `${t(p.name)} — ${p.ages}` }));

  return (
    <>
      <Header lang={lang} t={t} />
      <main id="main" className="page-visit">
        <section>
          <div className="shell" style={{ maxWidth: 620 }}>
            <p className="eyebrow">{t("Book a tour")}</p>
            <h1>{t("Tell us about your child")}</h1>
            {/* The form comes BEFORE the prose. With the keyboard open there are
                about 508px of screen, and the parent should land on a field. */}
            <LeadForm labels={labels} rooms={rooms} lang={lang} phone={phone}
              room={typeof sp?.room === "string" ? sp.room : ""} />
            <p className="hint" style={{ marginTop: 20 }}>{t("Twenty minutes, in the room your child would be in, with the person who runs the school. No sales call afterwards.")}</p>
            <p className="hint">{t("Tour times")}: <F fact={site.enquiry.tourSlots} /></p>
            <p className="hint" style={{ marginTop: 18 }}>
              {t("Prefer to talk?")}{" "}
              {phone ? <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}>{phone}</a> : <F fact={site.contact.phone} />}
            </p>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
    </>
  );
}
