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

    console.log('🔧 Manually fixing subscription for:', email);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        provider: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('👤 Found user:', {
      userId: user.userId,
      email: user.email,
      currentStatus: user.subscriptionStatus,
      currentPlan: user.subscriptionPlan,
      provider: user.provider,
    });

    // Activate pro subscription for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updatedUser = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Manually activated subscription for ${user.userId}:`, {
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription manually activated',
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      },
      previousStatus: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      }
    });

  } catch (error: any) {
    console.error('❌ Error manually fixing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}