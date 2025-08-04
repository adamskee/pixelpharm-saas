import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, password = 'PixelPharm2025!' } = await request.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, firstName, and lastName required' }, { status: 400 });
    }

    console.log('🔧 Creating user:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: `User already exists: ${email}`,
        existingUser: {
          userId: existingUser.userId,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          subscriptionPlan: existingUser.subscriptionPlan,
          subscriptionStatus: existingUser.subscriptionStatus
        }
      }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        passwordHash: hashedPassword,
        provider: 'credentials',
        subscriptionStatus: 'inactive',
        subscriptionPlan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ User created successfully:', {
      userId: newUser.userId,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        provider: newUser.provider,
        subscriptionStatus: newUser.subscriptionStatus,
        subscriptionPlan: newUser.subscriptionPlan,
        createdAt: newUser.createdAt,
      },
      credentials: {
        email: newUser.email,
        password: password
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: `Failed to create user: ${error.message}` },
      { status: 500 }
    );
  }
}