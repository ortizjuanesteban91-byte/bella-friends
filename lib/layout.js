/**
 * LAYOUT IS A TOKEN, NEVER HARD-CODED. Spicy, 2026-11-22:
 * "we can just switch layout to any other layouts."
 * Six layouts that differ in LAYOUT, not colour (his locked decision).
 * Nothing in any component names a layout; components read CSS custom properties
 * that each layout redefines, so a new layout is a block of CSS and one row here.
 */
export const LAYOUTS = [
  { id: "modern",    name: "Modern Warm",     note: "One column, oversized headline, facts band under the hero. The default." },
  { id: "classic",   name: "Classic Academy", note: "Serif, centred, framed cards, rule lines. The 'classic' half of his brief." },
  { id: "playhouse", name: "Sunny Playhouse", note: "Playful: rounded everything, offset cards, big age badges." },
  { id: "calm",      name: "Calm Modern",     note: "Airy, wide margins, thin rules, small type scale." },
  { id: "academy",   name: "Bright Academy",  note: "Structured grid, two-up cards from tablet, dense facts table." },
  { id: "storybook", name: "Storybook",       note: "Editorial: asymmetric hero, overlapping panels, drop caps." },
];
export const LAYOUT_IDS = LAYOUTS.map((l) => l.id);
export const DEFAULT_LAYOUT = "modern";

export function resolveLayout(requested, configured) {
  if (requested && LAYOUT_IDS.includes(requested)) return requested;
  if (configured && LAYOUT_IDS.includes(configured)) return configured;
  return DEFAULT_LAYOUT;
}

export const PALETTES = [
  { id: "sunny",  name: "Sunny" },
  { id: "forest", name: "Forest" },
  { id: "berry",  name: "Berry" },
];
export const PALETTE_IDS = PALETTES.map((p) => p.id);
export function resolvePalette(requested, configured) {
  if (requested && PALETTE_IDS.includes(requested)) return requested;
  if (configured && PALETTE_IDS.includes(configured)) return configured;
  return "sunny";
}
