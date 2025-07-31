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
    name: 'Elite Athlete',
    price: 24.95,
    period: 'per month',
    priceId: STRIPE_CONFIG.BASIC_PRICE_ID,
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Created for elite athletes, coaches, and dedicated health optimizers who demand clinical-grade insights',
    features: [
      'Up to 5 blood test uploads per month',
      'Advanced AI health analysis',
      'Health score tracking',
      'Standard biomarker insights',
      'Comprehensive health reports',
      'Trend analysis & predictions',
      'Risk assessment reports',
      'Email support',
      'Performance optimization recommendations based on hormonal profiles',
      'Recovery protocol suggestions using HRV & inflammatory markers',
      'Sports nutritionist-grade supplement timing & dosage recommendations',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49.95,
    period: '30 days access',
    priceId: STRIPE_CONFIG.PRO_PRICE_ID,
    type: 'payment' as const,
    interval: null,
    description: 'One-time purchase for lifetime access to professional-grade health insights from your blood tests',
    features: [
      '20 blood test uploads',
      'Advanced AI health analysis',
      'Comprehensive health reports',
      'Trend analysis & predictions',
      'Priority email support',
      'Custom health recommendations',
      'Body composition tracking',
      'Risk assessment reports',
      '30 days full dashboard access',
      'Complete insights & analytics',
    ],
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;