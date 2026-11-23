import { ORIGIN, INDEXABLE } from "@/lib/site";
/** No live domain, or SITE_LIVE != 1 => nothing is indexed. A preview must never rank. */
export default function robots() {
  return INDEXABLE
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }], sitemap: `${ORIGIN}/sitemap.xml` }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
