import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Manually set Pro subscription for testing
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    console.log('🔧 Attempting to fix subscription for:', {
      userId,
      currentEmail: userEmail,
      targetPlan: 'pro',
      expiresAt,
    });

    const updatedUser = await prisma.user.update({
      where: { 
        userId: userId 
      },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro', 
        subscriptionExpiresAt: expiresAt,
        // Update email to match NextAuth session
        email: userEmail,
        updatedAt: new Date(),
      },
    });

    console.log('✅ User subscription updated successfully:', {
      userId: updatedUser.userId,
      email: updatedUser.email,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionPlan: updatedUser.subscriptionPlan,
    });

    return NextResponse.json({
      success: true,
      message: 'User subscription manually updated to Pro plan',
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      },
    });
  } catch (error: any) {
    console.error('Fix subscription error:', error);
    return NextResponse.json(
      { error: `Failed to fix subscription: ${error.message}` },
      { status: 500 }
    );
  }
}