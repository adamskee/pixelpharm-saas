"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { LoginForm } from "./login-form";
import { Loader2 } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || <LoginForm />;
  }

  return <>{children}</>;
}
