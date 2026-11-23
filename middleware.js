import { NextResponse } from "next/server";
import { LANGS } from "./lib/t.js";
import { LAYOUT_IDS, PALETTE_IDS } from "./lib/layout.js";

/**
 * THREE JOBS, ALL OF THEM LAYOUT-TOKEN PLUMBING:
 * 1. "/" -> "/en". The site NEVER guesses a language from the browser; Spicy's
 *    rule is that it offers and the visitor chooses.
 * 2. "?layout=classic" is turned into a header the server render can read on
 *    THIS request, AND a cookie so it sticks for the next one. That is why the
 *    layout can be switched with no rebuild and why ONE preview link is enough.
 * 3. Same for "?palette=".
 */
export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;
  const seg = pathname.split("/")[1];

  if (pathname === "/" || !LANGS.includes(seg)) {
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = "/en";
      return NextResponse.redirect(url);
    }
  }

  const want = searchParams.get("layout");
  const pal = searchParams.get("palette");
  const headers = new Headers(req.headers);
  if (want && LAYOUT_IDS.includes(want)) headers.set("x-bf-layout", want);
  if (pal && PALETTE_IDS.includes(pal)) headers.set("x-bf-palette", pal);

  const res = NextResponse.next({ request: { headers } });
  if (want && LAYOUT_IDS.includes(want)) res.cookies.set("bf_layout", want, { path: "/", sameSite: "lax" });
  if (pal && PALETTE_IDS.includes(pal)) res.cookies.set("bf_palette", pal, { path: "/", sameSite: "lax" });
  return res;
}

export const config = { matcher: ["/((?!_next|favicon|api).*)"] };
