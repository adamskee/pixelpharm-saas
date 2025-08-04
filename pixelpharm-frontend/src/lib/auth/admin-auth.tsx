// Admin Authentication System
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
  'admin@pixelpharm.com': {
    password: 'PixelPharmAdmin2025!',
    user: {
      id: 'admin-1',
      email: 'admin@pixelpharm.com',
      name: 'System Administrator',
      role: 'super_admin' as const,
      permissions: ['*'] // All permissions
    }
  },
  'support@pixelpharm.com': {
    password: 'PixelPharmSupport2025!',
    user: {
      id: 'admin-2',
      email: 'support@pixelpharm.com',
      name: 'Support Team',
      role: 'admin' as const,
      permissions: ['view_users', 'manage_subscriptions', 'view_analytics']
    }
  }
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin session
    const stored = localStorage.getItem('pixelpharm_admin_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          setAdmin(session.admin);
        } else {
          localStorage.removeItem('pixelpharm_admin_session');
        }
      } catch (error) {
        console.error('Error parsing admin session:', error);
        localStorage.removeItem('pixelpharm_admin_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const credentials = ADMIN_CREDENTIALS[email as keyof typeof ADMIN_CREDENTIALS];
    
    if (!credentials || credentials.password !== password) {
      throw new Error('Invalid admin credentials');
    }

    const session = {
      admin: credentials.user,
      expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
    };

    localStorage.setItem('pixelpharm_admin_session', JSON.stringify(session));
    setAdmin(credentials.user);
  };

  const signOut = () => {
    localStorage.removeItem('pixelpharm_admin_session');
    setAdmin(null);
  };

  const hasPermission = (permission: string) => {
    if (!admin) return false;
    return admin.permissions.includes('*') || admin.permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        loading,
        signIn,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}