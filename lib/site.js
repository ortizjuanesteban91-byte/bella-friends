import cfg from "@/config/site.json";
import { isFact, filled, val, openFactsIn } from "./facts.js";

/** THE ONLY DOOR TO THE CLIENT'S FACTS. Pages, schema, sitemap and bot read this. */
export const site = cfg;
export { isFact, filled, val };
export const openFacts = () => openFactsIn(cfg);

export const DOMAIN = val(cfg.site.domain);
export const ORIGIN = DOMAIN ? `https://${DOMAIN}` : (process.env.PREVIEW_ORIGIN || "http://localhost:3000");
/** No live domain, or SITE_LIVE != 1, and NOTHING is indexed. A preview must never rank. */
export const INDEXABLE = Boolean(DOMAIN) && process.env.SITE_LIVE === "1";
