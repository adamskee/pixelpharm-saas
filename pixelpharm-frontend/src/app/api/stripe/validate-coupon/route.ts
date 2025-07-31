import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

// Define available coupon codes with their discounts
const COUPON_CODES = {
  'LAUNCH50': {
    discount: 50,
    description: 'Special Launch Pricing - 50% off',
    isActive: true,
  },
  'WELCOME25': {
    discount: 25,
    description: 'Welcome Discount - 25% off',
    isActive: true,
  },
  'HEALTH20': {
    discount: 20,
    description: 'Health Journey - 20% off',
    isActive: true,
  },
  'SAVE10': {
    discount: 10,
    description: 'Save 10% on your purchase',
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
        const discountPercent = stripeCoupon.percent_off || 0;
        return NextResponse.json({
          isValid: true,
          discount: discountPercent,
          message: `Applied ${discountPercent}% discount`,
          stripeId: stripeCoupon.id,
        });
      }
    } catch (stripeError) {
      // If Stripe coupon doesn't exist, fall back to our predefined coupons
      console.log('Stripe coupon not found, using predefined coupon');
    }

    // Return success for predefined coupon
    return NextResponse.json({
      isValid: true,
      discount: coupon.discount,
      message: `${coupon.description} - ${coupon.discount}% off`,
    });

  } catch (error: any) {
    console.error('❌ Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
}