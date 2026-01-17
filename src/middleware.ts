// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that require authentication
const protectedRoutes = ["/dashboard"];

// Define paths that are ONLY for public users (redirect to dashboard if logged in)
const publicRoutes = ["/login", "/signup", "/"];

export function middleware(request: NextRequest) {
  // 1. Get the token from cookies (Best Practice) or assume localStorage logic handled via client
  // NOTE: Middleware cannot access localStorage. You MUST use cookies for server-side protection.
  const token = request.cookies.get("token")?.value;
  
  const { pathname } = request.nextUrl;

  // 2. Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // 3. Scenario: User Tries to access Protected Route without Token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Scenario: User Tries to access Login/Signup while ALREADY Logged In
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Allow request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};