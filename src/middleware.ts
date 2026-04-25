import { NextRequest, NextResponse } from "next/server";

import { IDLE_COOKIE_NAME, IDLE_TIMEOUT_MS } from "@/lib/idle-config";

const PUBLIC_EXACT = new Set<string>(["/"]);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/account-deactivated",
  "/api",
];

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(IDLE_COOKIE_NAME);
  if (!cookie) return NextResponse.next();

  const last = Number(cookie.value);
  if (!Number.isFinite(last) || last <= 0) return NextResponse.next();

  const now = Date.now();
  const secure = req.nextUrl.protocol === "https:";

  if (now - last > IDLE_TIMEOUT_MS) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?reason=idle";
    const res = NextResponse.redirect(url);
    res.cookies.set({
      name: IDLE_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure,
    });
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set({
    name: IDLE_COOKIE_NAME,
    value: String(now),
    maxAge: Math.floor(IDLE_TIMEOUT_MS / 1000),
    path: "/",
    sameSite: "lax",
    secure,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
