import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/database/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if subscription is active
    const hasActiveSubscription = checkSubscriptionActive(
      user.subscriptionStatus,
      user.subscriptionExpiresAt
    );

    return NextResponse.json({
      hasActiveSubscription,
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      expiresAt: user.subscriptionExpiresAt,
      stripeCustomerId: user.stripeCustomerId,
      hasStripeSubscription: !!user.stripeSubscriptionId,
    });

  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkSubscriptionActive(status: string | null, expiresAt: Date | null): boolean {
  if (!status) return false;
  
  // For free plan, always active
  if (status === 'free') return true;
  
  // For active subscriptions without expiry (Stripe managed), check status
  if (!expiresAt && status === 'active') return true;
  
  // For subscriptions with expiry date (one-time payments), check if not expired
  if (expiresAt && status === 'active') {
    return new Date() < new Date(expiresAt);
  }
  
  return false;
}