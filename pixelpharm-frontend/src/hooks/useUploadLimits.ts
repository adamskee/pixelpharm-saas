"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/lib/auth/auth-context';

export interface UploadUsage {
  currentMonth: number;
  totalUploads: number;
  remainingThisMonth: number;
  remainingTotal: number | null;
  canUpload: boolean;
  limitType: 'monthly' | 'total' | 'none';
  resetDate?: Date;
  loading: boolean;
}

export function useUploadLimits() {
  const { data: session } = useSession();
  const { user: customUser } = useAuth();
  const [uploadUsage, setUploadUsage] = useState<UploadUsage>({
    currentMonth: 0,
    totalUploads: 0,
    remainingThisMonth: 0,
    remainingTotal: null,
    canUpload: false,
    limitType: 'none',
    loading: true,
  });

  const fetchUploadUsage = async () => {
    // Try custom auth first, then NextAuth
    const userId = customUser?.userId || session?.user?.id;
    
    if (!userId) {
      setUploadUsage(prev => ({ ...prev, loading: false }));
      return;
    }

    console.log('🔍 Fetching upload usage for user:', userId);

    try {
      let response;
      let data;

      if (customUser?.userId) {
        // Use custom auth endpoint
        response = await fetch('/api/user/upload-usage-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: customUser.userId }),
        });
        data = await response.json();
      } else {
        // Use NextAuth endpoint
        response = await fetch('/api/user/upload-usage');
        data = await response.json();
      }

      if (response.ok) {
        setUploadUsage({
          ...data,
          resetDate: data.resetDate ? new Date(data.resetDate) : undefined,
          loading: false,
        });
      } else {
        console.error('Error fetching upload usage:', data.error);
        setUploadUsage(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching upload usage:', error);
      setUploadUsage(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUploadUsage();
  }, [session?.user?.id, customUser?.userId]);

  // Refresh usage after upload
  const refreshUsage = () => {
    fetchUploadUsage();
  };

  return { ...uploadUsage, refreshUsage };
}

// Helper function to get limit display text
export function getUploadLimitText(usage: UploadUsage, planName: string): string {
  if (usage.limitType === 'monthly') {
    return `${usage.remainingThisMonth} uploads remaining this month (${planName} Plan)`;
  } else if (usage.limitType === 'total') {
    return `${usage.remainingTotal} uploads remaining (${planName} Plan)`;
  }
  return 'Unlimited uploads';
}

// Helper function to get upgrade prompt text
export function getUpgradePromptText(usage: UploadUsage): string {
  if (usage.limitType === 'monthly' && usage.remainingThisMonth === 0) {
    return 'Monthly upload limit reached. Upgrade to Pro for more uploads!';
  } else if (usage.limitType === 'total' && (usage.remainingTotal || 0) === 0) {
    return 'Upload limit reached. Renew your Pro plan for more uploads!';
  }
  return '';
}