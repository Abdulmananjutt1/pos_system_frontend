import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages only admin can access
const ADMIN_ONLY = [
  "/",
  "/dashboard",
  "/medicines",
  "/inventory",
  "/suppliers",
  "/purchase-orders",
  "/transfers",
  "/stock-count",
  "/login-history",
  "/reports",
  "/settings",
];

// Pages cashier can access
const CASHIER_ALLOWED = [
  "/sales",
  "/customers",
  "/returns",
];

export function middleware(request: NextRequest) {
  const token    = request.cookies.get("token")?.value;
  const userRole = request.cookies.get("userRole")?.value;
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

  // Already logged in → away from auth pages
  if (isAuthPage && token) {
    const dest = userRole === "admin" ? "/" : "/sales";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Cashier trying to access admin-only page → redirect to /sales
  if (isDashboard && token && userRole === "cashier") {
    const isAdminPage = ADMIN_ONLY.some((p) =>
      p === "/" ? pathname === "/" : pathname.startsWith(p)
    );
    const isCashierPage = CASHIER_ALLOWED.some((p) => pathname.startsWith(p));

    if (isAdminPage && !isCashierPage) {
      return NextResponse.redirect(new URL("/sales", request.url));
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
