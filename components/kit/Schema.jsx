import { site, val, ORIGIN } from "@/lib/site";

/**
 * schema.org/Preschool - CONFIRMED by opening https://schema.org/Preschool
 * on 2026-11-23: Thing > Place > CivicStructure > EducationalOrganization >
 * Preschool, usage 1K-10K domains (Google, Aug 2026). The Goddard School ships
 * exactly this type. The model site ships only WebPage/BreadcrumbList/WebSite.
 * EVERY VALUE COMES FROM config/site.json. A fact that is not filled is simply
 * absent - we never emit an invented licence, rating or address to Google.
 */
export default function Schema({ lang }) {
  const n = {
    "@context": "https://schema.org",
    "@type": "Preschool",
    name: site.brand.name,
    url: `${ORIGIN}/${lang}`,
    inLanguage: site.locale.languages,
  };
  const tagline = val(site.brand.tagline);
  if (tagline) n.description = tagline;
  const phone = val(site.contact.phone);
  if (phone) n.telephone = phone;
  const email = val(site.contact.email);
  if (email) n.email = email;
  const hours = val(site.contact.hours);
  if (hours) n.openingHours = hours;
  const addr = val(site.campuses[0]?.address);
  if (addr) n.address = { "@type": "PostalAddress", streetAddress: addr, addressRegion: "NC", addressCountry: "US" };
  const lic = val(site.trust.licence);
  if (lic) {
    n.hasCertification = {
      "@type": "Certification",
      name: "North Carolina child care licence",
      issuedBy: { "@type": "GovernmentOrganization", name: "NC Division of Child Development and Early Education" },
      identifier: lic,
    };
  }
  const founded = val(site.trust.yearsOpen);
  if (founded) n.foundingDate = String(founded);
  n.hasOfferCatalog = {
    "@type": "OfferCatalog",
    name: "Programs",
    itemListElement: site.programs.map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: p.name, description: `Ages ${p.ages}` },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(n) }} />;
}
