import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking subscription for:', email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check subscription logic (same as subscription-status API)
    const hasActiveSubscription = checkSubscriptionActive(
      user.subscriptionStatus,
      user.subscriptionExpiresAt
    );

    console.log('📊 Subscription check result:', {
      userId: user.userId,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      hasActiveSubscription,
      provider: user.provider,
    });

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscriptionCheck: {
        hasActiveSubscription,
        checkDetails: {
          statusExists: !!user.subscriptionStatus,
          statusValue: user.subscriptionStatus,
          planExists: !!user.subscriptionPlan,
          planValue: user.subscriptionPlan,
          expiresAt: user.subscriptionExpiresAt,
          isExpired: user.subscriptionExpiresAt ? new Date() > new Date(user.subscriptionExpiresAt) : null,
          isFree: user.subscriptionStatus === 'free',
          isActive: user.subscriptionStatus === 'active',
          hasExpiry: !!user.subscriptionExpiresAt,
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function checkSubscriptionActive(status: string | null, expiresAt: Date | null): boolean {
  console.log('🔍 Checking subscription active:', { status, expiresAt });
  
  if (!status) {
    console.log('❌ No status found');
    return false;
  }
  
  // For free plan, always active
  if (status === 'free') {
    console.log('✅ Free plan is always active');
    return true;
  }
  
  // For active subscriptions without expiry (Stripe managed), check status
  if (!expiresAt && status === 'active') {
    console.log('✅ Active subscription without expiry');
    return true;
  }
  
  // For subscriptions with expiry date (one-time payments), check if not expired
  if (expiresAt && status === 'active') {
    const isExpired = new Date() > new Date(expiresAt);
    console.log('🗓️ Checking expiry:', { 
      expiresAt, 
      now: new Date(), 
      isExpired 
    });
    return !isExpired;
  }
  
  console.log('❌ Subscription not active');
  return false;
}