import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { preschoolSchema, faqSchema, addressOneLine } from "../lib/schema.js";
import { buildAnswers } from "../lib/answers.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(path.join(ROOT, "config/site.json"), "utf8"));
const t = (s, v) => { let o = s; if (v) for (const [k, x] of Object.entries(v)) o = o.split(`{${k}}`).join(String(x)); return o; };
const ORIGIN = "https://example.test";
const deep = (o) => JSON.parse(JSON.stringify(o));
// THE EMPTY-CONFIG GUARD MUST NOT DEPEND ON THE LIVE CONFIG STAYING EMPTY.
// 2026-11-25: three tests here asserted "nothing unfilled is sent to Google" by
// reading config/site.json and trusting it was still blank. On 2026-11-24 the real
// Thomasville address was filled in and all three went red - the CODE was fine, the
// tests' premise had expired. `blank` clears every { value } leaf so the guard tests
// what lib/schema.js actually does with nothing, whatever the live config holds.
const blank = (o) => {
  const c = deep(o);
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    if ("value" in n && "ask" in n) { n.value = Array.isArray(n.value) ? [] : ""; return; }
    Object.values(n).forEach(walk);
  })(c);
  if (c.contact) { c.contact.hoursSpec = []; c.contact.geo = null; }
  return c;
};

test("the type is Preschool, confirmed on schema.org 2026-11-23", () => {
  const n = preschoolSchema(cfg, "en", ORIGIN);
  assert.equal(n["@type"], "Preschool");
  assert.equal(n["@context"], "https://schema.org");
  assert.equal(n.name, cfg.brand.name);
  assert.equal(n.url, `${ORIGIN}/en`);
});

test("NOTHING UNFILLED IS EVER SENT TO GOOGLE — no licence, no rating, no address, no hours", () => {
  const n = preschoolSchema(blank(cfg), "en", ORIGIN);
  assert.equal("hasCertification" in n, false, "a licence was emitted with none on file");
  assert.equal("aggregateRating" in n, false, "we never emit a rating for a school");
  assert.equal("address" in n, false, "an address was emitted with none on file");
  assert.equal("openingHoursSpecification" in n, false);
  assert.equal("geo" in n, false);
  assert.equal(JSON.stringify(n).includes("null"), false, "a null leaked into the JSON-LD");
});

test("the address carries every sub-property we hold — Google's REQUIRED property", () => {
  const c = deep(cfg);
  c.campuses[0].street.value = "118 Maple St";
  c.campuses[0].city.value = "Greensboro";
  c.campuses[0].zip.value = "27401";
  const a = preschoolSchema(c, "en", ORIGIN).address;
  assert.deepEqual(a, {
    "@type": "PostalAddress",
    addressRegion: "NC",
    addressCountry: "US",
    streetAddress: "118 Maple St",
    addressLocality: "Greensboro",
    postalCode: "27401",
  });
});

test("a part-filled address emits only the parts we actually hold", () => {
  const c = blank(cfg);
  c.campuses[0].city.value = "Greensboro";
  const a = preschoolSchema(c, "en", ORIGIN).address;
  assert.equal(a.addressLocality, "Greensboro");
  assert.equal("streetAddress" in a, false);
  assert.equal("postalCode" in a, false);
});

test('"NC" IS NOT AN ADDRESS — the empty config yields nothing, not a bare state', () => {
  assert.equal(addressOneLine(blank(cfg)), null);
  const c = blank(cfg);
  c.campuses[0].city.value = "Greensboro";
  assert.equal(addressOneLine(c), "Greensboro NC");
  c.campuses[0].street.value = "118 Maple St";
  c.campuses[0].zip.value = "27401";
  assert.equal(addressOneLine(c), "118 Maple St, Greensboro NC 27401");
});

test("hours go out as openingHoursSpecification objects, the form Google recommends", () => {
  const c = deep(cfg);
  c.contact.hoursSpec = [{ days: ["Monday", "Tuesday"], opens: "06:30", closes: "18:00" }];
  const n = preschoolSchema(c, "en", ORIGIN);
  assert.deepEqual(n.openingHoursSpecification, [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday"], opens: "06:30", closes: "18:00" },
  ]);
});

test("a half-written hours row is dropped, never half-emitted", () => {
  const c = deep(cfg);
  c.contact.hoursSpec = [{ days: ["Monday"], opens: "06:30" }, { days: [], opens: "1", closes: "2" }];
  assert.equal("openingHoursSpecification" in preschoolSchema(c, "en", ORIGIN), false);
});

test("the licence becomes a Certification issued by the NC division, with the number", () => {
  const c = deep(cfg);
  c.trust.licence.value = "41000123";
  const n = preschoolSchema(c, "en", ORIGIN);
  assert.equal(n.hasCertification["@type"], "Certification");
  assert.equal(n.hasCertification.identifier, "41000123");
  assert.match(n.hasCertification.issuedBy.name, /Child Development and Early Education/);
});

test("geo is emitted only from real coordinates, never from a string", () => {
  const c = deep(cfg);
  c.campuses[0].geo = { lat: "36.07", lng: "-79.79" };
  assert.equal("geo" in preschoolSchema(c, "en", ORIGIN), false, "a string pretended to be a coordinate");
  c.campuses[0].geo = { lat: 36.07264, lng: -79.79198 };
  assert.deepEqual(preschoolSchema(c, "en", ORIGIN).geo, {
    "@type": "GeoCoordinates", latitude: 36.07264, longitude: -79.79198,
  });
});

test("the Google profile link becomes sameAs, so the site and Maps are one entity", () => {
  const c = deep(cfg);
  c.reviews.googlePlaceId.value = "not a url";
  assert.equal("sameAs" in preschoolSchema(c, "en", ORIGIN), false);
  c.reviews.googlePlaceId.value = "https://maps.google.com/?cid=1";
  assert.deepEqual(preschoolSchema(c, "en", ORIGIN).sameAs, ["https://maps.google.com/?cid=1"]);
});

test("every program becomes an Offer, and the catalogue matches the config exactly", () => {
  const n = preschoolSchema(cfg, "en", ORIGIN);
  assert.equal(n.hasOfferCatalog.itemListElement.length, cfg.programs.length);
  assert.equal(n.hasOfferCatalog.itemListElement[0].itemOffered.name, cfg.programs[0].name);
});

test("the FAQ schema holds ONLY answered questions, and comes from the bot's own source", () => {
  const rows = buildAnswers(t, cfg);
  const ld = faqSchema(rows);
  assert.equal(ld.mainEntity.length, rows.filter((r) => r.a).length);
  assert.ok(ld.mainEntity.length < rows.length, "some answers are still missing and must not be in the schema");
  for (const q of ld.mainEntity) assert.ok(q.acceptedAnswer.text.trim().length > 0);
});

test("with no answers at all the FAQ node is absent, not an empty FAQPage", () => {
  assert.equal(faqSchema([]), null);
  assert.equal(faqSchema([{ q: "x", a: null }]), null);
});
