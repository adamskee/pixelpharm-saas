import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking user password storage for:', email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        userId: true,
        email: true,
        passwordHash: true,
        provider: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('👤 User found:', {
      userId: user.userId,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
      provider: user.provider,
      createdAt: user.createdAt,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
    });

    let passwordValid = false;
    if (password && user.passwordHash) {
      try {
        passwordValid = await bcrypt.compare(password, user.passwordHash);
        console.log('🔐 Password check result:', passwordValid);
      } catch (error) {
        console.error('❌ Password comparison error:', error);
      }
    }

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
        provider: user.provider,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt,
      },
      passwordCheck: {
        hasPasswordHash: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
        passwordProvided: !!password,
        passwordValid: passwordValid,
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking user password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}