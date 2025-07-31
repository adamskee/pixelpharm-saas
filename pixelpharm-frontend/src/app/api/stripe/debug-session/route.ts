import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the session with expanded data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'total_details', 'discounts']
    });

    console.log('🔍 Retrieved session details:');
    console.log('Session ID:', session.id);
    console.log('Amount Total:', session.amount_total);
    console.log('Amount Subtotal:', session.amount_subtotal);
    console.log('Currency:', session.currency);
    console.log('Discounts:', session.discounts);
    console.log('Total Details:', session.total_details);
    
    if (session.line_items?.data) {
      console.log('Line Items:');
      session.line_items.data.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`, {
          price_id: item.price?.id,
          quantity: item.quantity,
          amount_total: item.amount_total,
          amount_subtotal: item.amount_subtotal,
        });
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        amount_total: session.amount_total,
        amount_subtotal: session.amount_subtotal,
        currency: session.currency,
        status: session.status,
        payment_status: session.payment_status,
        discounts: session.discounts?.map(discount => ({
          coupon_id: discount.coupon?.id,
          amount: discount.amount,
          discount: discount.discount,
        })),
        total_details: {
          amount_discount: session.total_details?.amount_discount,
          amount_shipping: session.total_details?.amount_shipping,
          amount_tax: session.total_details?.amount_tax,
        },
        line_items: session.line_items?.data?.map(item => ({
          price_id: item.price?.id,
          quantity: item.quantity,
          amount_total: item.amount_total,
          amount_subtotal: item.amount_subtotal,
        })),
        url: session.url,
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving session:', error);
    return NextResponse.json(
      { error: `Failed to retrieve session: ${error.message}` },
      { status: 500 }
    );
  }
}