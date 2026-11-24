import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";
import { LANGS, isLang, makeT } from "@/lib/t";
import { resolveLayout, resolvePalette } from "@/lib/layout";
import { site, val, ORIGIN, INDEXABLE } from "@/lib/site";

/**
 * THIS IS THE ROOT LAYOUT AND IT LIVES INSIDE [lang] ON PURPOSE.
 * Trip2's bug, paid for and never to be repeated: app/layout.jsx hardcoded
 * lang="en", so every /es, /fr and /de page shipped as English in the SERVER
 * HTML and was patched afterwards by an inline script. Google and the AI
 * crawlers read the server HTML. A nested layout cannot own <html>, so the only
 * real fix is a [lang] root segment - which is what this is, from day one.
 */
export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = makeT(lang);
  const area = val(site.campuses[0]?.city) || "North Carolina";
  return {
    title: {
      default: t("{name} — Licensed Preschool and Childcare in {area}", { name: site.brand.name, area }),
      template: `%s — ${site.brand.name}`,
    },
    description: t(
      "Licensed preschool and childcare in {area}. Infants through after-school. Book a tour and talk to the school directly.",
      { area }
    ),
    metadataBase: new URL(ORIGIN),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])),
    },
    robots: INDEXABLE ? undefined : { index: false, follow: false },
    openGraph: { type: "website", locale: lang, siteName: site.brand.name },
  };
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const h = await headers();
  const c = await cookies();
  const layout = resolveLayout(h.get("x-bf-layout") || c.get("bf_layout")?.value, site.brand.layout);
  const palette = resolvePalette(h.get("x-bf-palette") || c.get("bf_palette")?.value, site.brand.palette);
  return (
    <html lang={lang} data-layout={layout} data-palette={palette}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
