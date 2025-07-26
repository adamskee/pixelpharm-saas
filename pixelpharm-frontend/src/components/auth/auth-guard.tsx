"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import GoogleSignIn from "./google-signin";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return fallback || <GoogleSignIn />;
  }

  return <>{children}</>;
}
