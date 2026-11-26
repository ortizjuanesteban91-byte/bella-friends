import { NextResponse } from "next/server";
import { LANGS } from "./lib/t.js";
import { LAYOUT_IDS, PALETTE_IDS } from "./lib/layout.js";
import { checkAdmin, clientIp } from "./lib/adminGate.js";

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

  // 0. /admin IS LOCKED, AND IT FAILS CLOSED.
  //    Spicy's security order 2026-11-23: an owner screen must never be reachable
  //    just because somebody forgot a check. If ADMIN_PASSWORD is not set, this
  //    refuses EVERYONE - an unconfigured deploy is shut, never open. Basic auth
  //    is used because it needs no login page and no crypto on the edge.
  //    Lockdown 2026-11-26: constant-time compare + 5 wrong passwords per IP =
  //    locked 15 minutes (lib/adminGate.js). The gate itself is unchanged: no
  //    ADMIN_PASSWORD means nobody gets in.
  if (/^\/[^/]+\/admin(\/|$)/.test(pathname)) {
    const want = process.env.ADMIN_PASSWORD || "";
    const g = checkAdmin({ want, header: req.headers.get("authorization") || "", ip: clientIp(req.headers) });
    if (!g.ok && g.status === 429) return new NextResponse("Too many wrong passwords. Locked for 15 minutes.", { status: 429, headers: { "Retry-After": String(g.retryAfter), "Cache-Control": "no-store" } });
    if (!g.ok) return new NextResponse("Authentication required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Bella Friends admin"', "Cache-Control": "no-store" } });
  }

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
