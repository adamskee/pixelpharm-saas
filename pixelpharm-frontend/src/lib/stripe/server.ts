import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Helper function to create checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  userEmail,
  userId,
  mode = 'payment',
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  userEmail: string;
  userId: string;
  mode?: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      customer_email: !customerId ? userEmail : undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        userEmail,
      },
      // For subscriptions, we can add trial period or setup fee
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            userId,
            userEmail,
          },
        },
      }),
      // For one-time payments, we can add custom fields
      ...(mode === 'payment' && {
        payment_intent_data: {
          metadata: {
            userId,
            userEmail,
            plan: 'pro_30_days',
          },
        },
      }),
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Helper function to retrieve checkout session
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

// Helper function to create or retrieve customer
export async function getOrCreateCustomer(userEmail: string, userId: string) {
  try {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer if not found
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving customer:', error);
    throw error;
  }
}

// Helper function to cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Helper function to get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });
    return subscriptions.data;
  } catch (error) {
    console.error('Error retrieving customer subscriptions:', error);
    throw error;
  }
}