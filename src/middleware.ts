import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token    = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isCashierLogin = pathname === "/login";
  const isAdminLogin   = pathname === "/admin/login";
  const isAuthPage     = isCashierLogin || isAdminLogin;
  const isDashboard    = !isAuthPage &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/favicon");

  // Not logged in → send to cashier login (default)
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in → send to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
