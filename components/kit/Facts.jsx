import { site, filled } from "@/lib/site";
import F from "./Placeholder";

/**
 * THE FACTS BAND. This is the one thing NO competitor we audited publishes.
 * Measured 2026-11-23 in the built-in browser: kidscounttoousa.com states no
 * licence number, no ratio and no staff credential; Primrose and Goddard state
 * no ratio either. A parent checking a preschool checks exactly these.
 * Whatever is not yet supplied shows as a placeholder - never as a claim.
 */
export default function Facts({ t }) {
  const rows = [
    { k: t("NC licence"), f: site.trust.licence },
    { k: t("Star-rated licence"), f: site.trust.starRating },
    { k: t("Teacher-to-child ratio"), f: site.trust.ratios },
    { k: t("Open since"), f: site.trust.yearsOpen },
    { k: t("Hours"), f: site.contact.hours },
  ];
  return (
    <>
    <ul className="facts">
      {rows.map((r) => (
        <li key={r.k}>
          <dl style={{ margin: 0 }}>
            <dt>{r.k}</dt>
            <dd>{filled(r.f) ? r.f.value : <F fact={r.f} block />}</dd>
          </dl>
        </li>
      ))}
    </ul>
    {/* The SWIPE rail that used to sit here was REMOVED 2026-11-24.
        His word, with the screenshot: "Not that all much noise under it."
        It is not needed any more - the band now slides on its own, which
        says it is a slider far better than a label did. */}
    </>
  );
}
