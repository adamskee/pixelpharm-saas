import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching recent checkout sessions...');

    // Get recent checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.customer']
    });

    const sessionData = sessions.data.map(session => ({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      created: new Date(session.created * 1000).toLocaleString(),
      mode: session.mode,
      amountTotal: session.amount_total,
      metadata: session.metadata,
      customerId: session.customer,
    }));

    console.log(`✅ Found ${sessions.data.length} recent sessions`);

    return NextResponse.json({
      sessions: sessionData,
      count: sessions.data.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching Stripe sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}