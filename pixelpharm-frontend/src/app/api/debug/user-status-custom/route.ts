import { NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/auth/subscription-check';
import { getUserUploadUsage } from '@/lib/subscription/upload-limits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    });

    // Get subscription info
    const subscription = await getUserSubscription(userId);

    // Get upload usage
    const uploadUsage = await getUserUploadUsage(userId);

    // Get actual upload count
    const actualUploads = await prisma.fileUpload.count({
      where: {
        userId,
        uploadType: 'BLOOD_TESTS',
      },
    });

    return NextResponse.json({
      requestedUser: {
        userId,
        userEmail,
      },
      user,
      subscription,
      uploadUsage,
      actualUploads,
      debug: {
        userExists: !!user,
        hasSubscription: !!subscription,
        hasAccess: subscription?.hasAccess || false,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: `Debug failed: ${error.message}` },
      { status: 500 }
    );
  }
}