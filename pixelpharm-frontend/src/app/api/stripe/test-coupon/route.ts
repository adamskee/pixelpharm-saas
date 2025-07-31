import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/server';
import { STRIPE_CONFIG, PRICING_PLANS } from '@/lib/stripe/config';

export async function POST(request: Request) {
  try {
    const { couponCode } = await request.json();

    console.log('🧪 Testing coupon application:', couponCode);

    // Create a test checkout session with the Pro plan
    const plan = PRICING_PLANS.pro;
    const testSession = await createCheckoutSession({
      priceId: plan.priceId,
      userEmail: 'test@example.com',
      userId: 'test-user',
      mode: 'payment',
      successUrl: STRIPE_CONFIG.SUCCESS_URL,
      cancelUrl: STRIPE_CONFIG.CANCEL_URL,
      couponCode,
    });

    return NextResponse.json({
      success: true,
      sessionId: testSession.sessionId,
      url: testSession.url,
      message: `Test checkout session created${couponCode ? ` with coupon: ${couponCode}` : ''}`,
    });

  } catch (error: any) {
    console.error('❌ Error testing coupon:', error);
    return NextResponse.json(
      { error: `Failed to test coupon: ${error.message}` },
      { status: 500 }
    );
  }
}