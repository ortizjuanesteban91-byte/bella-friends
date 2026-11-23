import { isFact, filled } from "@/lib/site";

/**
 * EVERY UNFILLED FACT IS VISIBLY A PLACEHOLDER. No silent blanks, no invented
 * filler, no lorem. Spicy's rule: "mark every invented block as a placeholder."
 * The question Alex has to answer is printed right where the fact will go.
 */
export function Placeholder({ ask, block = false }) {
  return (
    <span className={block ? "ph ph--block" : "ph"} data-placeholder="1">
      PLACEHOLDER
      <span className="ph__ask">{ask}</span>
    </span>
  );
}

/** <F fact={site.trust.licence} /> renders the value, or the placeholder. Never a guess. */
export default function F({ fact, block = false, children }) {
  if (filled(fact)) {
    const v = isFact(fact) ? fact.value : fact;
    return children ? children(v) : <>{v}</>;
  }
  return <Placeholder ask={isFact(fact) ? fact.ask : "Not provided yet."} block={block} />;
}
