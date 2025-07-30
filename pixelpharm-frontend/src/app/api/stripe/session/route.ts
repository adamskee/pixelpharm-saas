import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { getCheckoutSession } from '@/lib/stripe/server';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    console.log(`🔍 Retrieving checkout session: ${sessionId}`);

    // Get session details from Stripe
    const checkoutSession = await getCheckoutSession(sessionId);

    // Verify this session belongs to the current user
    const userId = checkoutSession.metadata?.userId;
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to session' }, { status: 403 });
    }

    // Return relevant session data for the success page
    return NextResponse.json({
      id: checkoutSession.id,
      mode: checkoutSession.mode,
      status: checkoutSession.status,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      customer_email: checkoutSession.customer_details?.email,
      payment_status: checkoutSession.payment_status,
      created: checkoutSession.created,
    });

  } catch (error: any) {
    console.error('❌ Error retrieving checkout session:', error);
    return NextResponse.json(
      { error: `Failed to retrieve session: ${error.message}` },
      { status: 500 }
    );
  }
}