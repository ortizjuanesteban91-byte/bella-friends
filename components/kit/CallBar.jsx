import Link from "next/link";
import { site, val } from "@/lib/site";

/**
 * THE PARENT DECIDES AT 10PM WITH NOBODY TO ASK. Two thumbs-reach actions,
 * always on screen: reach a human, or book the tour. 48px minimum each -
 * we shipped a 262x23px WhatsApp tap target once with 1,713 green tests.
 */
export default function CallBar({ lang, t, qs = "" }) {
  const phone = val(site.contact.phone);
  return (
    <div className="callbar">
      {phone ? (
        <a className="btn btn--ghost" href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}>
          {t("Call us")}
        </a>
      ) : (
        <Link className="btn btn--ghost" href={`/${lang}/visit${qs}`}>
          {t("Contact us")}
        </Link>
      )}
      <Link className="btn" href={`/${lang}/visit${qs}`}>
        {t("Book a tour")}
      </Link>
    </div>
  );
}
