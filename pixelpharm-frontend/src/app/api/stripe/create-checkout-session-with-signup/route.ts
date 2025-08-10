import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICING_PLANS, STRIPE_CONFIG, PlanType } from '@/lib/stripe/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface UserDetails {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAnonymous: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { planType, couponCode, userDetails }: { 
      planType: PlanType; 
      couponCode?: string;
      userDetails: UserDetails;
    } = await request.json();

    console.log('🛒 Creating checkout session with signup:', { planType, userDetails: { ...userDetails, password: '[HIDDEN]' } });

    if (!planType || planType === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const plan = PRICING_PLANS[planType];
    if (!plan || !plan.priceId) {
      return NextResponse.json(
        { error: 'Plan not found or invalid' },
        { status: 400 }
      );
    }

    // Validate user details
    if (!userDetails.email || !userDetails.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!userDetails.isAnonymous && (!userDetails.firstName || !userDetails.lastName)) {
      return NextResponse.json(
        { error: 'First name and last name are required for non-anonymous accounts' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userDetails.password, 12);

    // Prepare user data for metadata
    const userData = {
      email: userDetails.email,
      hashedPassword,
      firstName: userDetails.isAnonymous ? '' : userDetails.firstName,
      lastName: userDetails.isAnonymous ? '' : userDetails.lastName,
      isAnonymous: userDetails.isAnonymous.toString(),
    };

    // Validate coupon if provided
    let coupon: Stripe.Coupon | undefined;
    if (couponCode) {
      try {
        const coupons = await stripe.coupons.list({ limit: 100 });
        coupon = coupons.data.find(c => c.name === couponCode || c.id === couponCode);
        
        if (!coupon || !coupon.valid) {
          console.log('❌ Invalid coupon:', couponCode);
          return NextResponse.json(
            { error: 'Invalid or expired coupon code' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('❌ Error validating coupon:', error);
        return NextResponse.json(
          { error: 'Error validating coupon code' },
          { status: 500 }
        );
      }
    }

    // Create checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: plan.type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${STRIPE_CONFIG.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      customer_email: userDetails.email,
      metadata: {
        planType,
        newUser: 'true',
        ...userData,
        // Store password hash in metadata for user creation after payment
        userId: nanoid(), // Generate unique ID for reference
      },
      // Add coupon if valid
      ...(coupon && { discounts: [{ coupon: coupon.id }] }),
    };

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}