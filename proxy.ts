import { NextResponse, type NextRequest } from "next/server";

// Kept in sync with SESSION_COOKIE in lib/api.ts (proxy can't import server-only code).
const SESSION_COOKIE = "tr_admin";

/**
 * Cheap gate: no cookie, no dashboard. The token itself is verified by
 * theround-service on every call, and a 401 there sends the admin back here.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|forgot-password|reset-password|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|woff2)$).*)"],
};
