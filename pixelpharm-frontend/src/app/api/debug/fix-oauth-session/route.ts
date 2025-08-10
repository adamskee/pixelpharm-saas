import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json();

    console.log('🔧 Fixing OAuth user session:', { 
      sessionId: sessionId?.substring(0, 20) + '...',
      email
    });

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Valid Session ID is required (cs_...)' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
      amountTotal: checkoutSession.amount_total,
      customerEmail: checkoutSession.customer_details?.email,
      metadata: checkoutSession.metadata,
    });

    // Find the OAuth user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        provider: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'OAuth user not found' },
        { status: 404 }
      );
    }

    if (user.provider !== 'google') {
      return NextResponse.json(
        { error: 'User is not a Google OAuth user' },
        { status: 400 }
      );
    }

    console.log('👤 Found OAuth user:', {
      userId: user.userId,
      email: user.email,
      currentStatus: user.subscriptionStatus,
      currentPlan: user.subscriptionPlan,
      provider: user.provider,
    });

    // Determine plan type from session or default to pro for 100% discount
    const planType = checkoutSession.metadata?.planType || 
                    (checkoutSession.mode === 'subscription' ? 'basic' : 'pro');

    // Determine subscription expiration
    const expiresAt = checkoutSession.mode === 'subscription' 
      ? null // Subscriptions don't expire, managed by Stripe
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    // Update user subscription status
    const updatedUser = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        stripeCustomerId: checkoutSession.customer as string,
        subscriptionStatus: 'active',
        subscriptionPlan: planType,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated OAuth user ${user.userId} subscription:`, {
      planType,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
    });

    // For subscriptions, store the subscription ID
    if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          stripeSubscriptionId: checkoutSession.subscription as string,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth user subscription updated successfully',
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      },
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        paymentStatus: checkoutSession.payment_status,
        mode: checkoutSession.mode,
        amountTotal: checkoutSession.amount_total,
      },
      previousStatus: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      }
    });

  } catch (error: any) {
    console.error('❌ Error fixing OAuth user session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}