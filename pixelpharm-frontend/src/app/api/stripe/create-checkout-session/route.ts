import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe/server';
import { STRIPE_CONFIG, PRICING_PLANS, PlanType } from '@/lib/stripe/config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        redirect: '/auth/signin' 
      }, { status: 401 });
    }

    const { planType, couponCode }: { planType: PlanType; couponCode?: string } = await request.json();

    if (!planType || !PRICING_PLANS[planType]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const plan = PRICING_PLANS[planType];
    const userEmail = session.user.email;
    const userId = session.user.id;

    // Determine checkout mode based on plan type
    const mode = plan.type === 'subscription' ? 'subscription' : 'payment';

    console.log(`🛒 Creating checkout session for ${planType} plan:`, {
      userId,
      userEmail,
      price: plan.price,
      priceId: plan.priceId,
      type: plan.type,
      mode,
    });

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userEmail, userId);

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      priceId: plan.priceId,
      customerId: customer.id,
      userEmail,
      userId,
      mode,
      successUrl: STRIPE_CONFIG.SUCCESS_URL,
      cancelUrl: STRIPE_CONFIG.CANCEL_URL,
      couponCode,
    });

    console.log('✅ Checkout session created:', {
      sessionId: checkoutSession.sessionId,
      plan: planType,
      mode,
    });

    return NextResponse.json({
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
    });

  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
}