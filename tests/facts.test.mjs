import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isFact, filled, val, openFactsIn } from "../lib/facts.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(path.join(ROOT, "config/site.json"), "utf8"));

test("a fact with value null is NOT filled and never yields a value", () => {
  const f = { value: null, ask: "x" };
  assert.equal(isFact(f), true);
  assert.equal(filled(f), false);
  assert.equal(val(f), null);
});

test("a whitespace-only value is not a filled fact", () => {
  assert.equal(filled({ value: "   ", ask: "x" }), false);
});

test("every unfilled fact carries the question the client must answer", () => {
  const open = openFactsIn(cfg);
  assert.ok(open.length > 0, "there should be open facts before the client sends content");
  for (const o of open) {
    assert.ok(o.ask && o.ask.length > 10, `${o.path} has no usable question`);
    assert.ok(o.path.length > 0);
  }
});

test("NO PRICE, NO LICENCE, NO RATIO AND NO REVIEW IS EVER INVENTED", () => {
  assert.equal(cfg.tuition.showPrices, false, "prices must stay off until the school sets them");
  assert.equal(val(cfg.tuition.from), null);
  assert.equal(val(cfg.trust.licence), null);
  assert.equal(val(cfg.trust.ratios), null);
  assert.deepEqual(cfg.reviews.quotes, [], "we never write a review for a school");
});

test("config holds no Texas sample data from the audited model site", () => {
  const raw = JSON.stringify(cfg);
  for (const bad of ["Lewisville", "The Colony", "TX", "75056", "75067", "940-314-5437", "tryplayground"]) {
    assert.equal(raw.includes(bad), false, `sample data leaked: ${bad}`);
  }
});
