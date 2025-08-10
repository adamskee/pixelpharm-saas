import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';
import { stripe } from '@/lib/stripe/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email, password } = await request.json();

    console.log('🔧 Manual user creation from Stripe session:', { 
      sessionId: sessionId?.substring(0, 20) + '...',
      sessionIdLength: sessionId?.length,
      email,
      hasPassword: !!password
    });

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!sessionId || sessionId.length < 10) {
      return NextResponse.json(
        { error: 'Valid Session ID is required' },
        { status: 400 }
      );
    }

    // Validate session ID format
    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Invalid session ID format. Should start with cs_' },
        { status: 400 }
      );
    }

    // Get checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 404 }
      );
    }

    console.log('📋 Retrieved Stripe session:', {
      id: checkoutSession.id,
      status: checkoutSession.status,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_details?.email,
      metadata: checkoutSession.metadata,
    });

    // Extract user data from session metadata
    const metadata = checkoutSession.metadata || {};
    const userEmail = metadata.email || checkoutSession.customer_details?.email || email;
    const hashedPassword = metadata.hashedPassword;
    const firstName = metadata.firstName || '';
    const lastName = metadata.lastName || '';
    const isAnonymous = metadata.isAnonymous === 'true';
    const planType = metadata.planType || (checkoutSession.mode === 'subscription' ? 'basic' : 'pro');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email found in session or metadata' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          message: 'User already exists',
          user: {
            userId: existingUser.userId,
            email: existingUser.email,
            subscriptionStatus: existingUser.subscriptionStatus,
            subscriptionPlan: existingUser.subscriptionPlan,
          }
        }
      );
    }

    // If no hashed password in metadata and password provided, hash it
    let finalPasswordHash = hashedPassword;
    if (!finalPasswordHash && password) {
      const bcrypt = require('bcryptjs');
      finalPasswordHash = await bcrypt.hash(password, 12);
      console.log('🔐 Generated new password hash for user');
    }

    if (!finalPasswordHash) {
      return NextResponse.json(
        { error: 'No password hash available. Please provide the original password.' },
        { status: 400 }
      );
    }

    // Generate new user ID
    const newUserId = nanoid();
    const displayName = isAnonymous 
      ? `Anonymous User ${newUserId.slice(-6)}` 
      : `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];

    // Determine subscription expiration
    const expiresAt = checkoutSession.mode === 'subscription' 
      ? null // Subscriptions don't expire, managed by Stripe
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    // Create user account
    const newUser = await prisma.user.create({
      data: {
        userId: newUserId,
        email: userEmail.toLowerCase().trim(),
        passwordHash: finalPasswordHash,
        firstName: isAnonymous ? null : firstName || null,
        lastName: isAnonymous ? null : lastName || null,
        name: displayName,
        provider: 'credentials',
        isAnonymous,
        stripeCustomerId: checkoutSession.customer as string,
        subscriptionStatus: 'active',
        subscriptionPlan: planType,
        subscriptionExpiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // For subscriptions, store the subscription ID
    if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
      await prisma.user.update({
        where: { userId: newUserId },
        data: {
          stripeSubscriptionId: checkoutSession.subscription as string,
        },
      });
    }

    console.log('✅ User created successfully:', {
      userId: newUser.userId,
      email: newUser.email,
      planType,
      subscriptionStatus: newUser.subscriptionStatus,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        subscriptionStatus: newUser.subscriptionStatus,
        subscriptionPlan: newUser.subscriptionPlan,
        stripeCustomerId: newUser.stripeCustomerId,
        stripeSubscriptionId: checkoutSession.mode === 'subscription' ? checkoutSession.subscription : null,
      },
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        paymentStatus: checkoutSession.payment_status,
        mode: checkoutSession.mode,
        amountTotal: checkoutSession.amount_total,
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating user from Stripe session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}