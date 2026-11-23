import { val, filled } from "./facts.js";

/**
 * THE STRUCTURED DATA, AS A PURE FUNCTION so the tests run the exact code that
 * ships. components/kit/Schema.jsx does nothing but stringify what this returns.
 *
 * TYPE: schema.org/Preschool — CONFIRMED by opening https://schema.org/Preschool
 * on 2026-11-23: Thing > Place > CivicStructure > EducationalOrganization >
 * Preschool, usage 1K-10K domains (Google, August 2026), and `hasCertification`
 * (-> Certification) is available on it. That is where a childcare licence
 * number belongs, and no competitor we opened publishes one.
 *
 * SHAPE: follows Google's own LocalBusiness page, opened the same day
 * (developers.google.com/search/docs/appearance/structured-data/local-business):
 *   REQUIRED     address (PostalAddress, "include as many properties as
 *                possible"), name
 *   RECOMMENDED  geo (latitude/longitude, at least 5 decimal places),
 *                openingHoursSpecification objects, url, telephone
 *   aggregateRating is recommended ONLY for sites that capture reviews about
 *                OTHER businesses. We never emit one. A school's rating comes
 *                from Google's own profile or it does not exist.
 *
 * EVERY VALUE COMES FROM config/site.json. An unfilled fact is simply ABSENT —
 * we never send Google an invented licence, address, rating or opening hour.
 */
export function preschoolSchema(site, lang, origin) {
  const n = {
    "@context": "https://schema.org",
    "@type": "Preschool",
    name: site.brand.name,
    url: `${origin}/${lang}`,
    inLanguage: site.locale.languages,
  };

  const tagline = val(site.brand.tagline);
  if (tagline) n.description = tagline;

  const phone = val(site.contact.phone);
  if (phone) n.telephone = phone;

  const email = val(site.contact.email);
  if (email) n.email = email;

  /* ADDRESS — as many sub-properties as we actually hold, never a guess. */
  const c = site.campuses?.[0] || {};
  const street = val(c.street);
  const city = val(c.city);
  const zip = val(c.zip);
  if (street || city || zip) {
    n.address = { "@type": "PostalAddress", addressRegion: "NC", addressCountry: "US" };
    if (street) n.address.streetAddress = street;
    if (city) n.address.addressLocality = city;
    if (zip) n.address.postalCode = String(zip);
  }

  /* GEO — only when we have real coordinates, read off the Google profile.
     Google asks for 5 decimal places; we emit what we were given, unrounded. */
  if (c.geo && typeof c.geo.lat === "number" && typeof c.geo.lng === "number") {
    n.geo = { "@type": "GeoCoordinates", latitude: c.geo.lat, longitude: c.geo.lng };
  }

  /* HOURS — the structured form Google recommends. The school answers in plain
     words; WE turn it into this. An empty list emits nothing. */
  const spec = Array.isArray(site.contact.hoursSpec) ? site.contact.hoursSpec : [];
  const ok = spec.filter((s) => s && Array.isArray(s.days) && s.days.length && s.opens && s.closes);
  if (ok.length) {
    n.openingHoursSpecification = ok.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: s.days,
      opens: s.opens,
      closes: s.closes,
    }));
  }

  /* THE LICENCE. The single strongest trust fact available to this school, and
     a parent can check it in the state's own registry — the NC DCDEE facility
     search (ncchildcare.ncdhhs.gov/childcaresearch, opened 2026-11-23) searches
     by licence number. So this is a verifiable claim, not a boast. */
  const lic = val(site.trust.licence);
  if (lic) {
    n.hasCertification = {
      "@type": "Certification",
      name: "North Carolina child care licence",
      issuedBy: { "@type": "GovernmentOrganization", name: "NC Division of Child Development and Early Education" },
      identifier: String(lic),
    };
  }

  const founded = val(site.trust.yearsOpen);
  if (founded) n.foundingDate = String(founded);

  /* The Google Business Profile, when there is one, as sameAs — so the entity on
     the site and the entity on Maps are one thing and not two. */
  const gbp = val(site.reviews?.googlePlaceId);
  if (gbp && /^https?:\/\//.test(String(gbp))) n.sameAs = [String(gbp)];

  n.hasOfferCatalog = {
    "@type": "OfferCatalog",
    name: "Programs",
    itemListElement: site.programs.map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: p.name, description: `Ages ${p.ages}` },
    })),
  };
  return n;
}

/** The FAQPage node, from the SAME answers the page and the bot use. */
export function faqSchema(rows) {
  const answered = rows.filter((r) => r.a);
  if (!answered.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((r) => ({
      "@type": "Question",
      name: r.q,
      acceptedAnswer: { "@type": "Answer", text: r.a },
    })),
  };
}

/** One line for the page and for the bot. Null when we hold nothing. */
export function addressOneLine(site) {
  const c = site.campuses?.[0] || {};
  const street = val(c.street);
  const city = val(c.city);
  const zip = val(c.zip);
  /* "NC" IS NOT AN ADDRESS. The first version of this function built the city
     part as [city, "NC", zip].filter(Boolean), so with nothing supplied it
     returned the bare string "NC" and the bot answered "Main campus: NC". The
     question bank caught it the same minute. The state is only ever added to a
     city or a ZIP we actually hold. */
  if (!street && !city && !zip) return null;
  const locality = city || zip ? [city, "NC", zip].filter(Boolean).join(" ") : null;
  return [street, locality].filter(Boolean).join(", ").trim() || null;
}
