import Link from "next/link";
import { LANGS, LANG_NAMES } from "@/lib/t";
import { site, val } from "@/lib/site";
import F from "./Placeholder";

/** THE SITE NEVER MOVES A VISITOR AUTOMATICALLY. It offers; they choose. */
export default function Header({ lang, t, qs = "" }) {
  const logo = val(site.brand.logo);
  return (
    <header className="hdr">
      <div className="shell">
        <div className="hdr__row">
          <Link className="hdr__mark" href={`/${lang}${qs}`}>
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logo} alt={site.brand.name} width={160} height={44} />
            ) : (
              <>
                {site.brand.word1}
                <small>{site.brand.word2}</small>
              </>
            )}
          </Link>
          <div className="hdr__spacer" />
          <nav className="langs" aria-label={t("Language")}>
            {LANGS.map((l) => (
              <Link key={l} href={`/${l}${qs}`} hrefLang={l} aria-current={l === lang ? "true" : undefined}>
                {l.toUpperCase()}
                <span className="skip">{LANG_NAMES[l]}</span>
              </Link>
            ))}
          </nav>
        </div>
        <nav className="nav" aria-label={t("Main")}>
          <Link href={`/${lang}/programs${qs}`}>{t("Programs")}</Link>
          <Link href={`/${lang}/about${qs}`}>{t("About us")}</Link>
          <Link href={`/${lang}/visit${qs}`}>{t("Book a tour")}</Link>
          <Link href={`/${lang}/faq${qs}`}>{t("Questions")}</Link>
        </nav>
      </div>
    </header>
  );
}
