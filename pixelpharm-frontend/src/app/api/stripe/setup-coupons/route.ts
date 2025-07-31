import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

const COUPONS = [
  {
    id: 'LAUNCH50',
    percent_off: 50,
    name: 'Launch Special - 50% Off',
    duration: 'once',
  },
  {
    id: 'WELCOME25',
    percent_off: 25,
    name: 'Welcome Discount - 25% Off',
    duration: 'once',
  },
  {
    id: 'HEALTH20',
    percent_off: 20,
    name: 'Health Journey - 20% Off',
    duration: 'once',
  },
  {
    id: 'SAVE10',
    percent_off: 10,
    name: 'Save 10% on your purchase',
    duration: 'once',
  },
];

export async function POST() {
  try {
    console.log('🎟️ Setting up Stripe coupons...');
    const results = [];

    for (const couponData of COUPONS) {
      try {
        // Check if coupon already exists
        const existingCoupon = await stripe.coupons.retrieve(couponData.id);
        console.log(`✅ Coupon ${couponData.id} already exists`);
        results.push({
          id: couponData.id,
          status: 'exists',
          percent_off: existingCoupon.percent_off,
        });
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          // Coupon doesn't exist, create it
          try {
            const coupon = await stripe.coupons.create({
              id: couponData.id,
              percent_off: couponData.percent_off,
              name: couponData.name,
              duration: couponData.duration,
            });

            console.log(`✅ Created coupon: ${coupon.id} (${coupon.percent_off}% off)`);
            results.push({
              id: coupon.id,
              status: 'created',
              percent_off: coupon.percent_off,
            });
          } catch (createError: any) {
            console.error(`❌ Failed to create coupon ${couponData.id}:`, createError.message);
            results.push({
              id: couponData.id,
              status: 'error',
              error: createError.message,
            });
          }
        } else {
          console.error(`❌ Error checking coupon ${couponData.id}:`, error.message);
          results.push({
            id: couponData.id,
            status: 'error',
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon setup completed',
      coupons: results,
    });

  } catch (error: any) {
    console.error('❌ Error setting up coupons:', error);
    return NextResponse.json(
      { error: `Failed to setup coupons: ${error.message}` },
      { status: 500 }
    );
  }
}