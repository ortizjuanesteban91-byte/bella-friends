import { filled, val } from "@/lib/site";

/**
 * A SIZED SLOT, ALWAYS. width/height are set on every slot, filled or not, so
 * CLS is 0 before the photo exists. We measured the model site at 56 images with
 * 5 missing dimensions and Goddard at 20 of 30 missing; this is the cheapest
 * thing we do better, and CLS has the strongest money link we can source
 * (3.1% lower exit rate per 0.01 - Farfetch, web.dev).
 * While empty it draws CSS art and says, in words, what photo belongs here.
 * We never put a stock photo on a school page.
 */
export default function PhotoSlot({ fact, w = 1200, h = 800, alt = "", label, priority = false, art = 0 }) {
  const src = filled(fact) ? val(fact) : null;
  const ratio = `${w} / ${h}`;
  if (src) {
    return (
      <span className="photo" style={{ aspectRatio: ratio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={w} height={h} loading={priority ? "eager" : "lazy"} decoding="async" />
      </span>
    );
  }
  const hues = [
    ["var(--accent)", "var(--brand)"],
    ["var(--accent-2)", "var(--accent)"],
    ["var(--brand)", "var(--accent-2)"],
  ][art % 3];
  return (
    <span className="photo" style={{ aspectRatio: ratio }} data-photo-missing="1">
      <svg className="photo__art" viewBox="0 0 120 80" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g${art}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hues[0]} stopOpacity=".30" />
            <stop offset="100%" stopColor={hues[1]} stopOpacity=".16" />
          </linearGradient>
        </defs>
        <rect width="120" height="80" fill={`url(#g${art})`} />
        <circle cx="26" cy="22" r="13" fill={hues[0]} opacity=".40" />
        <circle cx="92" cy="58" r="20" fill={hues[1]} opacity=".26" />
        <path d="M0 68 Q30 50 60 64 T120 56 L120 80 L0 80 Z" fill={hues[1]} opacity=".30" />
      </svg>
      <span className="photo__note">
        <strong>PHOTO PLACEHOLDER</strong>
        <br />
        {label || "Photo to come from the school."}
      </span>
    </span>
  );
}
