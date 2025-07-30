import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
export const stripePromise: Promise<Stripe | null> = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Product configuration
export const STRIPE_CONFIG = {
  // Basic Plan - Monthly Subscription ($24.95/month) - prod_Sm0iyKll1xyb0D
  BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID || 'price_1RqSh0GVgvO6qb0jeFElxwz8',
  
  // Pro Plan - One-time Payment ($49.95) - prod_Sm0hcAKQdJjoKK
  PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || 'price_1RqSgJGVgvO6qb0jAyntHejz',
  
  // Success and Cancel URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/payment/success`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/payment/cancel`,
  
  // Webhook endpoint
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Price information for display
export const PRICING_PLANS = {
  basic: {
    name: 'Basic',
    price: 24.95,
    priceId: STRIPE_CONFIG.BASIC_PRICE_ID,
    type: 'subscription' as const,
    interval: 'month' as const,
  },
  pro: {
    name: 'Pro',
    price: 49.95,
    priceId: STRIPE_CONFIG.PRO_PRICE_ID,
    type: 'payment' as const,
    interval: null,
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;