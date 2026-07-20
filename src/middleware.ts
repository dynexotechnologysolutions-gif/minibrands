import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define route categories
const PUBLIC_PATHS = [
  "/",
  "/products",
  "/catalog",
  "/category",
  "/search",
  "/sellers",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
  "/api/webhooks",
];

const BUYER_PROTECTED_PATHS = [
  "/cart",
  "/account",
  "/orders",
  "/wishlist",
  "/address",
  "/checkout",
];

const SELLER_PROTECTED_PATHS = [
  "/seller",
];

const ADMIN_PROTECTED_PATHS = [
  "/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Security Response Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Allow static assets, next internal files, and images to bypass middleware logic
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // 2. Check for Session Cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;

  // 3. Guest-only Auth Pages (login, signup) - redirect authenticated users
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const roleIntent = request.nextUrl.searchParams.get("role");
    if (roleIntent === "seller") {
      return NextResponse.redirect(new URL("/seller/dashboard", request.url));
    }
    const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Allow /admin/login page without auth redirect
  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return response;
  }

  // Allow /seller/login and /seller/forgot-password without auth redirect
  if (pathname === "/seller/login" || pathname === "/seller/forgot-password") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/seller/dashboard", request.url));
    }
    return response;
  }

  // 4. Protected Route Checking
  const isBuyerRoute = BUYER_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isSellerRoute = SELLER_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminRoute = ADMIN_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // If trying to access a protected route without session token -> redirect to login with redirectTo
  if (!isAuthenticated && (isBuyerRoute || isSellerRoute || isAdminRoute)) {
    if (isAdminRoute) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
    if (isSellerRoute) {
      const sellerLoginUrl = new URL("/seller/login", request.url);
      sellerLoginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(sellerLoginUrl);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and _next
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
