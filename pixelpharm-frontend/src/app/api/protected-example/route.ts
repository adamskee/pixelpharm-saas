import { NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/auth/subscription-check';

export async function GET() {
  const subscription = await getUserSubscription();

  // Check if user has active subscription
  if (!subscription?.hasAccess) {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 }
    );
  }

  // Optional: Check for specific plan
  if (subscription.plan !== 'pro') {
    return NextResponse.json(
      { error: 'Pro subscription required for this feature' },
      { status: 403 }
    );
  }

  // User has access - return protected data
  return NextResponse.json({
    message: 'Protected data',
    userPlan: subscription.plan,
    expiresAt: subscription.expiresAt,
  });
}