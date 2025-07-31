import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId, firstName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Set Pro subscription for the user
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    console.log('🔧 Fixing Pro subscription for user:', userId);

    const updateData: any = {
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro',
      subscriptionExpiresAt: expiresAt,
      updatedAt: new Date(),
    };

    // Add firstName if provided
    if (firstName) {
      updateData.firstName = firstName;
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
    });

    console.log('✅ User subscription updated successfully:', {
      userId: updatedUser.userId,
      email: updatedUser.email,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Pro subscription activated successfully',
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