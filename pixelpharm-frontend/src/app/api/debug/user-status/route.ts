import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { getUserSubscription } from '@/lib/auth/subscription-check';
import { getUserUploadUsage } from '@/lib/subscription/upload-limits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

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
    const subscription = await getUserSubscription();

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
      session: {
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