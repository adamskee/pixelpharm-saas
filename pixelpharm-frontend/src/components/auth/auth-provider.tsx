"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";

// Configure Amplify to use email
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-southeast-2_FU5uEtcIq",
      userPoolClientId: "7mli3kka1pldc1lgdmaf8ibef",
      region: "ap-southeast-2",
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
    },
  },
});

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
