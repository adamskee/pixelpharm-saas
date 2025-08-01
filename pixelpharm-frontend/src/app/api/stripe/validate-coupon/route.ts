import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

// Define available coupon codes with their discounts
const COUPON_CODES = {
  'LAUNCH50': {
    discount: 50,
    discountType: 'percent',
    description: 'Special Launch Pricing - 50% off',
    isActive: true,
  },
  'WELCOME25': {
    discount: 25,
    discountType: 'percent',
    description: 'Welcome Discount - 25% off',
    isActive: true,
  },
  'HEALTH20': {
    discount: 20,
    discountType: 'percent',
    description: 'Health Journey - 20% off',
    isActive: true,
  },
  'SAVE10': {
    discount: 10,
    discountType: 'percent',
    description: 'Save 10% on your purchase',
    isActive: true,
  },
  'TESTUSER': {
    discount: 49.95,
    discountType: 'amount',
    description: 'Test User - Free Pro Plan',
    isActive: true,
  },
} as const;

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if coupon exists in our predefined codes
    const coupon = COUPON_CODES[normalizedCode as keyof typeof COUPON_CODES];

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon code has expired' },
        { status: 400 }
      );
    }

    // Optionally, you can also validate against Stripe coupons if you create them there
    // This allows for more advanced features like usage limits, expiry dates, etc.
    try {
      const stripeCoupon = await stripe.coupons.retrieve(normalizedCode);
      if (stripeCoupon && stripeCoupon.valid) {
        if (stripeCoupon.percent_off) {
          return NextResponse.json({
            isValid: true,
            discount: stripeCoupon.percent_off,
            discountType: 'percent',
            message: `Applied ${stripeCoupon.percent_off}% discount`,
            stripeId: stripeCoupon.id,
          });
        } else if (stripeCoupon.amount_off) {
          const discountAmount = stripeCoupon.amount_off / 100; // Convert cents to dollars
          return NextResponse.json({
            isValid: true,
            discount: discountAmount,
            discountType: 'amount',
            message: `Applied $${discountAmount.toFixed(2)} discount`,
            stripeId: stripeCoupon.id,
          });
        }
      }
    } catch (stripeError) {
      // If Stripe coupon doesn't exist, fall back to our predefined coupons
      console.log('Stripe coupon not found, using predefined coupon');
    }

    // Return success for predefined coupon
    const discountMessage = coupon.discountType === 'percent' 
      ? `${coupon.description} - ${coupon.discount}% off`
      : `${coupon.description} - $${coupon.discount} off`;

    return NextResponse.json({
      isValid: true,
      discount: coupon.discount,
      discountType: coupon.discountType,
      message: discountMessage,
    });

  } catch (error: any) {
    console.error('❌ Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
}