// Admin API: Create new user with subscription
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const validTokens = ['admin_token_super_admin', 'admin_token_support'];

  if (!validTokens.includes(token)) {
    throw new Error('Invalid admin token');
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    verifyAdminAuth(request);

    const body = await request.json();
    const { email, firstName, lastName, password = 'PixelPharm2025!', subscriptionPlan = null, subscriptionDays = 30 } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `User already exists: ${email}` },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calculate subscription expiration if pro plan
    let subscriptionExpiresAt = null;
    let subscriptionStatus = 'inactive';
    
    if (subscriptionPlan === 'pro') {
      subscriptionExpiresAt = new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000);
      subscriptionStatus = 'active';
    } else if (subscriptionPlan === 'basic') {
      subscriptionStatus = 'active';
      // Basic plans don't expire
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        passwordHash: hashedPassword,
        provider: 'credentials',
        subscriptionStatus: subscriptionStatus,
        subscriptionPlan: subscriptionPlan,
        subscriptionExpiresAt: subscriptionExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`✅ User created successfully: ${newUser.email}`);

    return NextResponse.json({
      success: true,
      user: {
        userId: newUser.userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        subscriptionStatus: newUser.subscriptionStatus,
        subscriptionPlan: newUser.subscriptionPlan,
        subscriptionExpiresAt: newUser.subscriptionExpiresAt,
        provider: newUser.provider,
        createdAt: newUser.createdAt
      },
      credentials: {
        email: newUser.email,
        password: password
      }
    });

  } catch (error) {
    console.error('Admin create user API error:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}