import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    console.log("🔐 Middleware protecting:", req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        // Protect upload routes
        if (req.nextUrl.pathname.startsWith("/upload")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
