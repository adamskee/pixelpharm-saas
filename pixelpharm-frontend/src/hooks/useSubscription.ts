"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface SubscriptionInfo {
  status: 'active' | 'canceled' | 'past_due' | 'inactive';
  plan: 'basic' | 'pro' | null;
  expiresAt: Date | null;
  hasAccess: boolean;
  loading: boolean;
}

export function useSubscription() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'inactive',
    plan: null,
    expiresAt: null,
    hasAccess: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchSubscription() {
      if (!session?.user?.id) {
        setSubscription(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch('/api/user/subscription');
        const data = await response.json();

        if (response.ok) {
          setSubscription({
            status: data.status,
            plan: data.plan,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            hasAccess: data.hasAccess,
            loading: false,
          });
        } else {
          setSubscription(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    }

    fetchSubscription();
  }, [session]);

  return subscription;
}

// Helper function to check if user can access a feature
export function useFeatureAccess(requiredPlan?: 'basic' | 'pro') {
  const subscription = useSubscription();

  if (!subscription.hasAccess) return false;

  if (requiredPlan === 'basic') {
    return subscription.plan === 'basic' || subscription.plan === 'pro';
  }
  
  if (requiredPlan === 'pro') {
    return subscription.plan === 'pro';
  }

  return subscription.hasAccess;
}