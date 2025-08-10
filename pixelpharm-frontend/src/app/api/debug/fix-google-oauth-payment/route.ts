import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { email, paymentIntentId } = await request.json();

    console.log('🔧 Fixing Google OAuth payment for:', { email, paymentIntentId });

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        userId: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        provider: true,
        createdAt: true,
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

    // If payment intent provided, try to find related checkout session
    let sessionInfo = null;
    if (paymentIntentId && stripe) {
      try {
        // Get payment intent details
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('💳 Payment Intent details:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          customer: paymentIntent.customer,
        });

        // Try to find checkout sessions for this customer
        if (paymentIntent.customer) {
          const sessions = await stripe.checkout.sessions.list({
            customer: paymentIntent.customer as string,
            limit: 10,
          });

          console.log('🔍 Found checkout sessions:', sessions.data.length);
          
          // Find session that matches the payment intent amount and is recent
          const matchingSession = sessions.data.find(session => 
            session.amount_total === paymentIntent.amount &&
            session.payment_status === 'paid'
          );

          if (matchingSession) {
            sessionInfo = {
              id: matchingSession.id,
              amount_total: matchingSession.amount_total,
              payment_status: matchingSession.payment_status,
              mode: matchingSession.mode,
              metadata: matchingSession.metadata,
            };
            console.log('✅ Found matching session:', sessionInfo);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch payment intent details:', error);
      }
    }

    // Update user subscription to active pro status
    const planType = 'pro'; // $25 payment with coupon suggests pro plan
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    const updatedUser = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: planType,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Updated user subscription:', {
      userId: updatedUser.userId,
      email: updatedUser.email,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
    });

    return NextResponse.json({
      success: true,
      message: 'User subscription updated successfully',
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      },
      paymentInfo: {
        paymentIntentId,
        sessionInfo,
      },
      previousStatus: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      }
    });

  } catch (error: any) {
    console.error('❌ Error fixing Google OAuth payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}