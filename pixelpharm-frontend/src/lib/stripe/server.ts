import Stripe from 'stripe';

// Initialize Stripe with secret key - handle missing key gracefully
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

export { stripe };

// Helper function to create checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  userEmail,
  userId,
  mode = 'payment',
  successUrl,
  cancelUrl,
  couponCode,
}: {
  priceId: string;
  customerId?: string;
  userEmail: string;
  userId: string;
  mode?: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured - STRIPE_SECRET_KEY environment variable is missing');
  }
  
  try {
    // Prepare discount configuration if coupon code is provided
    let discounts = undefined;
    if (couponCode) {
      try {
        // Try to get Stripe coupon
        const stripeCoupon = await stripe.coupons.retrieve(couponCode.toUpperCase());
        if (stripeCoupon) {
          discounts = [{ coupon: stripeCoupon.id }];
          const discountDescription = stripeCoupon.percent_off 
            ? `${stripeCoupon.percent_off}% off`
            : `$${(stripeCoupon.amount_off! / 100).toFixed(2)} off`;
          console.log(`✅ Applying coupon: ${stripeCoupon.id} (${discountDescription})`);
        }
      } catch (error: any) {
        console.log(`❌ Stripe coupon '${couponCode}' not found:`, error.message);
        // Don't throw error, just proceed without coupon
      }
    }

    console.log('🔧 Creating checkout session with:', {
      mode,
      priceId,
      couponCode,
      discounts,
    });

    const sessionParams = {
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
        planType: mode === 'subscription' ? 'basic' : 'pro',
        ...(couponCode && { couponCode }),
      },
      // Apply discount if coupon is valid
      ...(discounts && { discounts }),
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
    };

    console.log('📦 Final session params:', JSON.stringify(sessionParams, null, 2));

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Session created:', {
      id: session.id,
      url: session.url?.substring(0, 50) + '...',
      discounts: session.total_details?.amount_discount || 0,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency,
      line_items_count: session.line_items?.data?.length || 'N/A',
    });

    // Also log the full session object for debugging
    console.log('🔍 Full session details:', JSON.stringify({
      id: session.id,
      discounts: session.discounts,
      total_details: session.total_details,
      line_items: session.line_items?.data?.map(item => ({
        price: item.price?.id,
        quantity: item.quantity,
        amount_total: item.amount_total,
        amount_subtotal: item.amount_subtotal,
      })),
    }, null, 2));

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Helper function to retrieve checkout session
export async function getCheckoutSession(sessionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured - STRIPE_SECRET_KEY environment variable is missing');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe is not configured - STRIPE_SECRET_KEY environment variable is missing');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe is not configured - STRIPE_SECRET_KEY environment variable is missing');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe is not configured - STRIPE_SECRET_KEY environment variable is missing');
  }
  
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