import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

const PUBLIC_PAGES = ["/signin", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoints and the sign-in/up pages are always reachable.
  if (pathname.startsWith("/api/auth") || PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const uid = token ? await verifySession(token) : null;

  if (!uid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
