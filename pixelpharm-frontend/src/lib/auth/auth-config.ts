// src/lib/auth/auth-config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),

    // Username/Password Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your.email@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
        action: {
          label: "Action",
          type: "text", // "signin" or "signup"
        },
        firstName: {
          label: "First Name",
          type: "text",
        },
        lastName: {
          label: "Last Name",
          type: "text",
        },
      },
      async authorize(credentials) {
        console.log("🔐 Credentials auth attempt:", {
          email: credentials?.email,
          action: credentials?.action,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          throw new Error("Email and password are required");
        }

        try {
          // Call our auth API endpoint
          const authUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          const response = await fetch(`${authUrl}/api/auth/credentials`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              action: credentials.action || "signin",
              firstName: credentials.firstName,
              lastName: credentials.lastName,
            }),
          });

          const result = await response.json();

          if (response.ok && result.user) {
            console.log("✅ Credentials auth successful:", result.user.email);

            return {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              provider: "credentials",
            };
          } else {
            console.log("❌ Credentials auth failed:", result.error);
            throw new Error(result.error || "Authentication failed");
          }
        } catch (error: any) {
          console.error("❌ Credentials auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 Sign In Attempt:", {
        email: user.email,
        name: user.name,
        provider: account?.provider,
        id: user.id,
      });

      // Handle Google OAuth sign in
      if (account?.provider === "google") {
        try {
          // Sync Google user to database
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/sync-user`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                provider: "google",
              }),
            }
          );

          if (response.ok) {
            console.log("✅ Google user synced successfully");
          } else {
            console.log("⚠️ Google user sync failed, but allowing sign in");
          }
        } catch (error) {
          console.error("❌ Error syncing Google user:", error);
          // Don't block sign in if sync fails
        }
      }

      // Credentials provider already handled user creation/validation
      return true;
    },

    async session({ session, token }) {
      console.log(
        "📋 Session callback - Processing session for:",
        session.user?.email
      );

      // Enhanced session with user data
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.userId = token.sub!;
        session.user.email = token.email!;
        session.user.name = token.name;
        session.user.image = token.picture as string;
        session.user.provider = token.provider as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }

      return session;
    },

    async jwt({ token, user, account }) {
      console.log("🔑 JWT callback - Processing token");

      // Store user data in JWT token on first sign in
      if (user && account) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name || `${user.firstName} ${user.lastName}`.trim();
        token.picture = user.image;
        token.provider = account.provider;
        token.firstName = user.firstName;
        token.lastName = user.lastName;

        console.log("🔑 New JWT token created:", {
          sub: token.sub,
          email: token.email,
          name: token.name,
          provider: token.provider,
        });
      }

      return token;
    },

    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", { url, baseUrl });

      // Redirect to dashboard after successful sign in
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: "/auth/signin", // This will use our custom page
    error: "/auth/error",
    signOut: "/auth/signout",
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("🎉 Sign in event:", {
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ session, token }) {
      console.log("👋 Sign out event:", {
        email: session?.user?.email || token?.email,
      });
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
