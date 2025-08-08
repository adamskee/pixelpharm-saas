// src/lib/auth/auth-config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/client";

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
        isAnonymous: {
          label: "Anonymous Account",
          type: "text", // "true" or "false"
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

        const { email, password, action, firstName, lastName, isAnonymous } = credentials;

        // Validate inputs
        if (!email.includes("@")) {
          throw new Error("Please enter a valid email address");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        try {
          // Debug database connection in production
          if (process.env.NODE_ENV === "production") {
            console.log("🔍 Production DB Debug:", {
              hasDbUrl: !!process.env.DATABASE_URL,
              dbUrlStart: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
            });
          }

          if (action === "signup") {
            // Handle signup
            console.log("🔐 Processing signup for:", normalizedEmail);

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });

            if (existingUser) {
              console.log("❌ User already exists:", normalizedEmail);
              throw new Error("An account with this email already exists. Please sign in instead.");
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Generate user ID
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create new user
            const newUser = await prisma.user.create({
              data: {
                userId,
                email: normalizedEmail,
                firstName: firstName || null,
                lastName: lastName || null,
                name: `${firstName || ""} ${lastName || ""}`.trim() || null,
                passwordHash: hashedPassword,
                provider: "credentials",
                emailVerified: null,
                // TODO: Add isAnonymous after database migration
                // isAnonymous: isAnonymous === "true",
              },
            });

            console.log("✅ New user created:", {
              userId: newUser.userId,
              email: newUser.email,
            });

            return {
              id: newUser.userId,
              email: newUser.email,
              name: newUser.name,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              provider: "credentials",
            };
          } else {
            // Handle signin
            console.log("🔐 Processing signin for:", normalizedEmail);

            // Find user by email
            const user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });

            if (!user) {
              console.log("❌ User not found:", normalizedEmail);
              throw new Error("Invalid email or password");
            }

            // Check if user signed up with credentials (has password)
            if (!user.passwordHash) {
              console.log("❌ User exists but has no password (OAuth user):", normalizedEmail);
              throw new Error("This email is associated with a Google account. Please sign in with Google.");
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);

            if (!isValidPassword) {
              console.log("❌ Invalid password for user:", normalizedEmail);
              throw new Error("Invalid email or password");
            }

            console.log("✅ User authenticated successfully:", normalizedEmail);

            return {
              id: user.userId,
              email: user.email,
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              provider: "credentials",
            };
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
          // Sync Google user to database directly (avoid HTTP call)
          console.log("🔄 Syncing Google user to database:", user.email);

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // Update existing user with Google info
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                name: user.name,
                image: user.image,
                provider: "google", // Update provider if it changed
              },
            });
            console.log("✅ Existing Google user updated");
          } else {
            // Create new Google user
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.user.create({
              data: {
                userId,
                email: user.email!,
                name: user.name,
                image: user.image,
                provider: "google",
                emailVerified: new Date(), // Google emails are verified
              },
            });
            console.log("✅ New Google user created");
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
