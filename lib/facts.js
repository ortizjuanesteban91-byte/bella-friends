/**
 * PURE. No config import, no JSX, no Next. That is deliberate: the tests and the
 * scripts import this exact file and run it in plain Node, so what is tested is
 * the code that ships, not a copy of it.
 * A fact is { value, ask }. value === null means NOT PROVIDED YET.
 */
export function isFact(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x) && "ask" in x;
}
export function filled(f) {
  if (!isFact(f)) return f !== null && f !== undefined && f !== "";
  return f.value !== null && f.value !== undefined && String(f.value).trim() !== "";
}
export function val(f) {
  if (!isFact(f)) return filled(f) ? f : null;
  return filled(f) ? f.value : null;
}
/** Every unfilled fact, with the question the client must answer. */
export function openFactsIn(node, path = []) {
  const out = [];
  if (isFact(node)) {
    if (!filled(node)) out.push({ path: path.join("."), ask: node.ask });
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((n, i) => out.push(...openFactsIn(n, [...path, String(i)])));
    return out;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("_")) continue;
      out.push(...openFactsIn(v, [...path, k]));
    }
  }
  return out;
}
