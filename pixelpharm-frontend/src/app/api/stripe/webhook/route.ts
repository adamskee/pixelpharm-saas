import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { prisma } from '@/lib/database/client';
import { nanoid } from 'nanoid';

// Stripe webhook events we want to handle
const WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      // Check if webhook secret is configured
      if (!STRIPE_CONFIG.WEBHOOK_SECRET || STRIPE_CONFIG.WEBHOOK_SECRET === 'whsec_your_webhook_secret') {
        console.warn('⚠️ Webhook secret not configured, skipping signature verification');
        event = JSON.parse(body);
      } else {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          STRIPE_CONFIG.WEBHOOK_SECRET
        );
      }
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event.data.object);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object);
        break;

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object);
        break;

      case WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Handle successful checkout session completion
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('💳 Processing checkout session completed:', session.id);
    console.log('📋 Session metadata:', JSON.stringify(session.metadata, null, 2));

    const isNewUser = session.metadata?.newUser === 'true';
    const userId = session.metadata?.userId;
    const userEmail = session.metadata?.userEmail || session.customer_details?.email;
    const planType = session.metadata?.planType || (session.mode === 'subscription' ? 'basic' : 'pro');

    if (isNewUser) {
      // Handle new user signup with payment (credentials-based signup)
      await handleNewUserCheckout(session, planType);
    } else if (userId && userEmail) {
      // Handle existing user payment (Google OAuth users)
      console.log('🔄 Handling existing user checkout for OAuth user:', userEmail);
      await handleExistingUserCheckout(session, userId, planType);
    } else {
      // Try to find user by customer email (fallback for OAuth users)
      console.log('🔍 Trying to find user by customer email:', userEmail);
      if (userEmail) {
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { userId: true }
        });
        
        if (user) {
          console.log('✅ Found user by email, updating subscription:', user.userId);
          await handleExistingUserCheckout(session, user.userId, planType);
        } else {
          console.error('❌ No user found with email:', userEmail);
        }
      } else {
        console.error('❌ No user identification available in checkout session');
      }
    }

  } catch (error: any) {
    console.error('❌ Error handling checkout session completed:', error);
    throw error;
  }
}

// Handle checkout for new users (create account after payment)
async function handleNewUserCheckout(session: any, planType: string) {
  try {
    const metadata = session.metadata;
    const email = metadata?.email;
    const hashedPassword = metadata?.hashedPassword;
    const firstName = metadata?.firstName || '';
    const lastName = metadata?.lastName || '';
    const isAnonymous = metadata?.isAnonymous === 'true';
    
    if (!email || !hashedPassword) {
      console.error('❌ Missing user data in checkout session metadata');
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('👤 User already exists, updating subscription status');
      await updateUserSubscription(existingUser.userId, session, planType);
      return;
    }

    // Generate new user ID
    const newUserId = nanoid();
    const displayName = isAnonymous 
      ? `Anonymous User ${newUserId.slice(-6)}` 
      : `${firstName} ${lastName}`.trim();

    // Determine subscription expiration
    const expiresAt = session.mode === 'subscription' 
      ? null // Subscriptions don't expire, managed by Stripe
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    // Create new user account
    const newUser = await prisma.user.create({
      data: {
        userId: newUserId,
        email,
        passwordHash: hashedPassword,
        firstName: isAnonymous ? null : firstName,
        lastName: isAnonymous ? null : lastName,
        name: displayName,
        provider: 'credentials',
        isAnonymous,
        stripeCustomerId: session.customer as string,
        subscriptionStatus: 'active',
        subscriptionPlan: planType,
        subscriptionExpiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ New user created and subscription activated:`, {
      userId: newUser.userId,
      email: newUser.email,
      planType,
      hasPasswordHash: !!newUser.passwordHash,
      provider: newUser.provider,
      isAnonymous: newUser.isAnonymous,
      subscriptionStatus: newUser.subscriptionStatus,
      subscriptionPlan: newUser.subscriptionPlan,
    });

    // For subscriptions, store the subscription ID
    if (session.mode === 'subscription' && session.subscription) {
      await prisma.user.update({
        where: { userId: newUserId },
        data: {
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

  } catch (error: any) {
    console.error('❌ Error creating new user from checkout:', error);
    throw error;
  }
}

// Handle checkout for existing users
async function handleExistingUserCheckout(session: any, userId: string, planType: string) {
  try {
    const userEmail = session.metadata?.userEmail;

    if (!userId || !userEmail) {
      console.error('❌ Missing user metadata in checkout session');
      return;
    }

    await updateUserSubscription(userId, session, planType);

  } catch (error: any) {
    console.error('❌ Error handling existing user checkout:', error);
    throw error;
  }
}

// Update user subscription status
async function updateUserSubscription(userId: string, session: any, planType: string) {
  try {
    // Determine subscription expiration
    const expiresAt = session.mode === 'subscription' 
      ? null // Subscriptions don't expire, managed by Stripe
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    // Update user subscription status
    await prisma.user.update({
      where: { userId: userId },
      data: {
        stripeCustomerId: session.customer as string,
        subscriptionStatus: 'active',
        subscriptionPlan: planType,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ User ${userId} subscription activated: ${planType}`);

    // For subscriptions, store the subscription ID
    if (session.mode === 'subscription' && session.subscription) {
      await prisma.user.update({
        where: { userId: userId },
        data: {
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

  } catch (error: any) {
    console.error('❌ Error updating user subscription:', error);
    throw error;
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('📅 Processing subscription created:', subscription.id);

    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error('❌ User not found for customer:', customerId);
      return;
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: 'basic',
        subscriptionExpiresAt: null, // Managed by Stripe
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Subscription created for user ${user.id}`);
  } catch (error: any) {
    console.error('❌ Error handling subscription created:', error);
    throw error;
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Processing subscription updated:', subscription.id);

    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!user) {
      console.error('❌ User not found for subscription:', subscription.id);
      return;
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Subscription updated for user ${user.id}: ${subscription.status}`);
  } catch (error: any) {
    console.error('❌ Error handling subscription updated:', error);
    throw error;
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('❌ Processing subscription deleted:', subscription.id);

    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!user) {
      console.error('❌ User not found for subscription:', subscription.id);
      return;
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Subscription canceled for user ${user.id}`);
  } catch (error: any) {
    console.error('❌ Error handling subscription deleted:', error);
    throw error;
  }
}

// Handle successful one-time payment
async function handlePaymentIntentSucceeded(payment: any) {
  try {
    console.log('💰 Processing payment intent succeeded:', payment.id);

    const userId = payment.metadata?.userId;
    const plan = payment.metadata?.plan;

    if (!userId || !plan) {
      console.error('❌ Missing metadata in payment intent');
      return;
    }

    // For Pro plan one-time payments, set 30-day expiration
    if (plan === 'pro_30_days') {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await prisma.user.update({
        where: { userId: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlan: 'pro',
          subscriptionExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Pro plan activated for user ${userId} until ${expiresAt}`);
    }
  } catch (error: any) {
    console.error('❌ Error handling payment intent succeeded:', error);
    throw error;
  }
}