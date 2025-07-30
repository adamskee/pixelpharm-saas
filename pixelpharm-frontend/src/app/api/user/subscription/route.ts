import { NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/auth/subscription-check';

export async function GET() {
  try {
    const subscription = await getUserSubscription();

    if (!subscription) {
      return NextResponse.json({
        status: 'inactive',
        plan: null,
        expiresAt: null,
        hasAccess: false,
      });
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}