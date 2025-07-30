import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'inactive';
export type SubscriptionPlan = 'basic' | 'pro';

export interface UserSubscription {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  expiresAt: Date | null;
  isActive: boolean;
  hasAccess: boolean;
}

// Check if user has active subscription - works with both auth systems
export async function getUserSubscription(userIdOverride?: string): Promise<UserSubscription | null> {
  let userId = userIdOverride;
  
  // If no user ID provided, try to get from NextAuth session
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const now = new Date();
  const status = (user.subscriptionStatus as SubscriptionStatus) || 'inactive';
  const plan = user.subscriptionPlan as SubscriptionPlan | null;
  const expiresAt = user.subscriptionExpiresAt;
  
  // Check if subscription is active
  const isActive = status === 'active';
  
  // Check if user has access (not expired for Pro plan)
  const hasAccess = isActive && (
    !expiresAt || // No expiration (Basic plan)
    expiresAt > now // Not expired (Pro plan)
  );

  return {
    status,
    plan,
    expiresAt,
    isActive,
    hasAccess,
  };
}

// Hook for client-side subscription checking
export async function checkSubscriptionAccess(requiredPlan?: SubscriptionPlan): Promise<boolean> {
  const subscription = await getUserSubscription();
  
  if (!subscription?.hasAccess) {
    return false;
  }

  // If specific plan required, check if user has that plan or higher
  if (requiredPlan) {
    if (requiredPlan === 'basic') {
      return subscription.plan === 'basic' || subscription.plan === 'pro';
    }
    if (requiredPlan === 'pro') {
      return subscription.plan === 'pro';
    }
  }

  return true;
}