import Link from "next/link";
import { LANGS, LANG_NAMES } from "@/lib/t";
import { site, val } from "@/lib/site";

/**
 * THE MODERNISED HEADER. His word 2026-11-24 on layout 3: "make it more
 * modern. The header better."
 * What changed from Bright Academy's original: it is STICKY and glassy, the
 * logo is a real mark, the phone menu is a proper drawer instead of a wrapped
 * row of links, and the tour button is always reachable. No JS: the drawer is
 * a checkbox, so this stays a server component and costs the page nothing.
 * THE SITE NEVER MOVES A VISITOR AUTOMATICALLY. It offers; they choose.
 */
export default function Header({ lang, t, qs = "" }) {
  const logo = val(site.brand.logo);
  const phone = val(site.contact.phone);
  const hours = val(site.contact.hours);
  const city = val(site.campuses[0]?.city);
  const links = [
    [`/${lang}/programs${qs}`, t("Programs")],
    [`/${lang}/about${qs}`, t("About us")],
    [`/${lang}/faq${qs}`, t("Questions")],
  ];

  return (
    <>
      <div className="topbar">
        <div className="shell">
          <span>
            {phone ? <>📞 <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a></>
                   : <>📞 <span className="todo">{t("Phone — to add")}</span></>}
          </span>
          <span className="hide-sm">
            {hours || <span className="todo">{t("Hours — to add")}</span>}
          </span>
          <span>{city ? `${city}, North Carolina` : "North Carolina"}</span>
        </div>
      </div>

      <header className="hdr">
        <div className="shell">
          <input type="checkbox" id="menu" className="menu-tgl" />
          <div className="hdr__row">
            <Link className="hdr__mark" href={`/${lang}${qs}`}>
              {logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo} alt={site.brand.name} width={168} height={46} />
              ) : (
                <>
                  <span className="hdr__badge" aria-hidden="true">★</span>
                  <span>
                    {site.brand.word1}
                    <small>{site.brand.word2}</small>
                  </span>
                </>
              )}
            </Link>

            <div className="hdr__spacer" />

            <nav className="nav" aria-label={t("Main")}>
              {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>

            <nav className="langs" aria-label={t("Language")}>
              {LANGS.map((l) => (
                <Link key={l} href={`/${l}${qs}`} hrefLang={l} aria-current={l === lang ? "true" : undefined}>
                  {l.toUpperCase()}
                  <span className="skip">{LANG_NAMES[l]}</span>
                </Link>
              ))}
            </nav>

            <Link className="btn" href={`/${lang}/visit${qs}`}>{t("Book a tour")}</Link>

            <label className="menu-btn" htmlFor="menu" aria-label={t("Menu")}>☰</label>
          </div>

          <nav className="nav nav--drawer" aria-label={t("Main")}>
            {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            <Link className="btn" href={`/${lang}/visit${qs}`}>{t("Book a tour")}</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
