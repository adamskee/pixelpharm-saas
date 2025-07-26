import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 Google Sign In:", {
        email: user.email,
        name: user.name,
        provider: account?.provider,
      });
      return true;
    },
    async session({ session, token }) {
      // Add token data to session for JWT strategy
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.email = token.email!;
        session.user.name = token.name;
        session.user.image = token.picture as string;
      }
      console.log("📋 Session callback - user:", session.user?.email);
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist user data in JWT token
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Log for debugging
      console.log("🔑 JWT callback - token:", {
        sub: token.sub,
        email: token.email,
        name: token.name,
      });

      return token;
    },
  },
  session: {
    strategy: "jwt", // Use JWT sessions (no database required)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
