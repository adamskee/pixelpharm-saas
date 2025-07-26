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
  dateOfBirth?: Date;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const user: User | null = session?.user
    ? {
        userId: session.user.userId || session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        firstName: session.user.firstName || undefined,
        lastName: session.user.lastName || undefined,
        dateOfBirth: session.user.dateOfBirth || undefined,
        gender: session.user.gender || undefined,
      }
    : null;

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session,
    session,
  };

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
