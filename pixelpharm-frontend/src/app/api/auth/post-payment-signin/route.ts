import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';
import { stripe } from '@/lib/stripe/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Processing post-payment signin for session:', sessionId);

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 404 }
      );
    }

    // Check if this is a new user session
    const isNewUser = checkoutSession.metadata?.newUser === 'true';
    if (!isNewUser) {
      return NextResponse.json(
        { error: 'Not a new user session' },
        { status: 400 }
      );
    }

    const userEmail = checkoutSession.metadata?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'No user email in session metadata' },
        { status: 400 }
      );
    }

    console.log('📧 Looking for user with email:', userEmail);

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        userId: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        isAnonymous: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        createdAt: true,
      }
    });

    if (!user) {
      console.error('❌ User not found after payment:', userEmail);
      return NextResponse.json(
        { error: 'User account not found. Please contact support.' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', { userId: user.userId, email: user.email });

    // Create a temporary token for automatic signin
    const token = nanoid(32);
    
    // Store the token temporarily (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // You could store this in Redis or a temporary tokens table
    // For now, we'll use the user table with a temp field
    // Note: You might want to add a tempSigninToken field to your schema
    
    // Return user data and signin token
    return NextResponse.json({
      user: {
        id: user.userId,
        userId: user.userId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        isAnonymous: user.isAnonymous,
        provider: 'credentials',
      },
      sessionId: checkoutSession.id,
      planType: user.subscriptionPlan,
      status: user.subscriptionStatus,
      signinToken: token, // This would be used for automatic signin
    });

  } catch (error: any) {
    console.error('❌ Error in post-payment signin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}