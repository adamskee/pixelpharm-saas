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
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
    priceId: null,
    type: 'free' as const,
    interval: null,
    description: 'Get started with basic health insights from your blood tests. Perfect for trying out our AI-powered health analytics',
    features: [
      '1 blood test upload (lifetime)',
      'Analysis of 3 biomarkers only',
      'Basic health insights',
      'Simple health report',
      'Recovery protocol suggestions using HRV & inflammatory markers',
      'Sports nutritionist-grade supplement timing & dosage recommendations',
      'Community support',
      'Upgrade anytime for full access',
    ],
    limits: {
      maxUploads: 1,
      maxBiomarkers: 3,
    },
  },
  basic: {
    name: 'Elite Athlete',
    price: 24.95,
    period: 'per month',
    priceId: STRIPE_CONFIG.BASIC_PRICE_ID,
    type: 'subscription' as const,
    interval: 'month' as const,
    description: 'Created for elite athletes, coaches, and dedicated health optimizers who demand clinical-grade insights',
    features: [
      'Up to 20 blood test uploads per month',
      'Analysis of ALL biomarkers (unlimited)',
      'Advanced AI health analysis',
      'Health score tracking',
      'Comprehensive health reports',
      'Trend analysis & predictions',
      'Risk assessment reports',
      'Email support',
      'Performance optimization recommendations based on hormonal profiles',
      'Recovery protocol suggestions using HRV & inflammatory markers',
      'Sports nutritionist-grade supplement timing & dosage recommendations',
    ],
    limits: {
      maxUploads: 20,
      maxBiomarkers: null, // unlimited
    },
  },
  pro: {
    name: 'Pro',
    price: 49.95,
    period: '30 days access',
    priceId: STRIPE_CONFIG.PRO_PRICE_ID,
    type: 'payment' as const,
    interval: null,
    description: 'One-time purchase for comprehensive health insights with full access to all features and unlimited biomarker analysis',
    features: [
      '20 blood test uploads',
      'Analysis of ALL biomarkers (unlimited)',
      'Advanced AI health analysis',
      'Comprehensive health reports',
      'Trend analysis & predictions',
      'Priority email support',
      'Custom health recommendations',
      'Body composition tracking',
      'Risk assessment reports',
      'Recovery protocol suggestions using HRV & inflammatory markers',
      'Sports nutritionist-grade supplement timing & dosage recommendations',
      '30 days full dashboard access',
      'Complete insights & analytics',
    ],
    limits: {
      maxUploads: 20,
      maxBiomarkers: null, // unlimited
    },
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;