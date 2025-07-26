// src/lib/auth/auth-context.tsx
"use client";

import React, { createContext, useContext } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

interface User {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  dateOfBirth?: Date;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (
    email: string,
    password: string,
    isSignUp?: boolean,
    firstName?: string,
    lastName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  console.log("🔍 Auth Context Status:", {
    status,
    hasSession: !!session,
    userEmail: session?.user?.email,
    userId: session?.user?.id,
    provider: session?.user?.provider,
  });

  // Convert session user to our User type
  const user: User | null = session?.user
    ? {
        userId: session.user.id || session.user.userId,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        firstName: session.user.firstName || session.user.name?.split(" ")[0],
        lastName:
          session.user.lastName ||
          session.user.name?.split(" ").slice(1).join(" "),
        provider: session.user.provider || "unknown",
        dateOfBirth: session.user.dateOfBirth || undefined,
        gender: session.user.gender || undefined,
      }
    : null;

  const handleGoogleSignIn = async () => {
    console.log("🔑 Initiating Google sign in...");
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
      console.log("🔑 Google sign in result:", result);
    } catch (error) {
      console.error("❌ Google sign in error:", error);
      throw error;
    }
  };

  const handleCredentialsSignIn = async (
    email: string,
    password: string,
    isSignUp: boolean = false,
    firstName?: string,
    lastName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    console.log("🔑 Initiating credentials auth:", { email, isSignUp });

    try {
      const result = await signIn("credentials", {
        email,
        password,
        action: isSignUp ? "signup" : "signin",
        firstName,
        lastName,
        redirect: false,
      });

      console.log("🔑 Credentials auth result:", result);

      if (result?.error) {
        return { success: false, error: result.error };
      } else if (result?.ok) {
        return { success: true };
      } else {
        return { success: false, error: "Authentication failed" };
      }
    } catch (error: any) {
      console.error("❌ Credentials auth error:", error);
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  };

  const handleSignOut = async () => {
    console.log("👋 Initiating sign out...");
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signInWithGoogle: handleGoogleSignIn,
    signInWithCredentials: handleCredentialsSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session && !!user,
    session,
  };

  console.log("🔍 Auth Context Value:", {
    hasUser: !!user,
    isAuthenticated: !!session && !!user,
    provider: user?.provider,
    loading,
  });

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Type augmentation for NextAuth to include custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userId?: string;
      email: string;
      name?: string;
      image?: string;
      firstName?: string;
      lastName?: string;
      provider?: string;
      dateOfBirth?: Date;
      gender?: string;
    };
  }

  interface User {
    id: string;
    userId?: string;
    email: string;
    name?: string;
    image?: string;
    firstName?: string;
    lastName?: string;
    provider?: string;
    dateOfBirth?: Date;
    gender?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    provider?: string;
    firstName?: string;
    lastName?: string;
  }
}
