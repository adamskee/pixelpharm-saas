import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.WEBHOOK_SECRET
      );
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

    const userId = session.metadata?.userId;
    const userEmail = session.metadata?.userEmail;

    if (!userId || !userEmail) {
      console.error('❌ Missing user metadata in checkout session');
      return;
    }

    // Determine plan type based on session mode
    const planType = session.mode === 'subscription' ? 'basic' : 'pro';
    const expiresAt = session.mode === 'subscription' 
      ? null // Subscriptions don't expire, managed by Stripe
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for pro

    // Update user subscription status
    await prisma.user.update({
      where: { id: userId },
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
        where: { id: userId },
        data: {
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

  } catch (error: any) {
    console.error('❌ Error handling checkout session completed:', error);
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
      where: { id: user.id },
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
      where: { id: user.id },
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
      where: { id: user.id },
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
        where: { id: userId },
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