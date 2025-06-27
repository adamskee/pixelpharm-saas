// File: src/lib/auth/auth-context.tsx

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem("pixelpharm-user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log("🔧 Restored user from storage:", userData);
        }
      } catch (error) {
        console.error("🔧 Error checking stored auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredAuth();
  }, []);

  // Generate consistent userId based on email
  const generateConsistentUserId = (email: string): string => {
    const emailHash = email.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `user-${emailHash}`;
  };

  const handleSignIn = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setLoading(true);
    try {
      if (email && password) {
        const consistentUserId = generateConsistentUserId(email);

        const newUser = {
          userId: consistentUserId,
          email: email,
          firstName: firstName || email.split("@")[0],
          lastName: lastName || "User",
        };

        setUser(newUser);
        localStorage.setItem("pixelpharm-user", JSON.stringify(newUser));
        console.log("🔧 User signed in with consistent ID:", newUser);

        // Sync user with database
        try {
          await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newUser),
          });
          console.log("🔧 User synced with database");
        } catch (syncError) {
          console.error("🔧 User sync failed:", syncError);
        }
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("🔧 Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      setUser(null);
      localStorage.removeItem("pixelpharm-user");
      console.log("🔧 User signed out");
    } catch (error) {
      console.error("🔧 Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
