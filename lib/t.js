import en from "@/content/en.json";
import es from "@/content/es.json";

/**
 * TRIP2'S TRANSLATION SYSTEM IS THE STANDARD FOR EVERY CLIENT SITE.
 * Spicy's locked decision, 2026-11-14. Keyed on THE EXACT ENGLISH STRING;
 * a missing key renders English instead of breaking the page.
 * Two traps that already cost us, both guarded by tests/i18n.test.mjs:
 *  1. Editing a price or a word INSIDE a string orphans its translation.
 *  2. A key that merely EXISTS is not a translation - English pasted into
 *     es.json stays "green" and ships English to a Spanish parent.
 */
const MAPS = { en, es };
export const LANGS = ["en", "es"];
export const LANG_NAMES = { en: "English", es: "Español" };

export function isLang(x) { return LANGS.includes(x); }

export function makeT(lang) {
  const map = MAPS[lang] || {};
  return function t(english, vars) {
    let out = lang === "en" ? english : (map[english] ?? english);
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
    return out;
  };
}
export const sourceStrings = () => Object.keys(en);
