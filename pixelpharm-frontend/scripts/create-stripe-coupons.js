/**
 * Script to create Stripe coupons for the coupon codes
 * Run this script once to set up the coupons in your Stripe dashboard
 * 
 * Usage: node scripts/create-stripe-coupons.js
 */

const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

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

async function createCoupons() {
  console.log('🎟️ Creating Stripe coupons...\n');

  for (const couponData of COUPONS) {
    try {
      // Check if coupon already exists
      try {
        const existingCoupon = await stripe.coupons.retrieve(couponData.id);
        console.log(`✅ Coupon ${couponData.id} already exists (${existingCoupon.percent_off}% off)`);
        continue;
      } catch (error) {
        // Coupon doesn't exist, create it
      }

      const coupon = await stripe.coupons.create({
        id: couponData.id,
        percent_off: couponData.percent_off,
        name: couponData.name,
        duration: couponData.duration,
        valid: true,
      });

      console.log(`✅ Created coupon: ${coupon.id} (${coupon.percent_off}% off)`);
    } catch (error) {
      console.error(`❌ Failed to create coupon ${couponData.id}:`, error.message);
    }
  }

  console.log('\n🎉 Coupon creation complete!');
  console.log('\nAvailable coupon codes:');
  COUPONS.forEach(coupon => {
    console.log(`- ${coupon.id}: ${coupon.percent_off}% off`);
  });
}

// Run the script
if (require.main === module) {
  createCoupons().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createCoupons };