// middleware.ts (in root directory, not src/)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log("🔒 Middleware executing for:", req.nextUrl.pathname);
    console.log("🔒 User token:", !!req.nextauth.token);

    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        console.log("🔒 Authorization check:", {
          pathname,
          hasToken: !!token,
          email: token?.email,
        });

        // Allow access to public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/auth/") ||
          pathname.startsWith("/api/auth/") ||
          pathname.startsWith("/_next/") ||
          pathname.startsWith("/favicon") ||
          pathname.startsWith("/about") ||
          pathname.startsWith("/pricing") ||
          pathname.startsWith("/payment") ||
          pathname.startsWith("/checkout") ||
          pathname.startsWith("/support") ||
          pathname.startsWith("/privacy") ||
          pathname.startsWith("/terms") ||
          pathname.startsWith("/demo")
        ) {
          return true;
        }

        // Protect dashboard and other authenticated routes
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/upload") ||
          pathname.startsWith("/profile")
        ) {
          return !!token; // Require authentication
        }

        // Allow all other routes by default
        return true;
      },
    },
    pages: {
      signIn: "/auth/signin", // Redirect to your custom sign-in page
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ],
};
