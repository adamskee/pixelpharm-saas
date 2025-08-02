/**
 * User Management Utility Script
 * 
 * Usage:
 * node user-management.js <command> <email> [options]
 * 
 * Commands:
 * - reset-password <email> <newPassword>    Reset user password
 * - activate-pro <email> [days]             Activate Pro subscription (default: 30 days)
 * - activate-basic <email>                  Activate Basic subscription
 * - deactivate <email>                      Deactivate subscription
 * - user-info <email>                       Show user information
 * - extend-subscription <email> <days>      Extend existing subscription
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

async function resetPassword(email, newPassword) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Password reset successful for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error resetting password:`, error);
    return false;
  }
}

async function activateProSubscription(email, days = 30) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Pro subscription activated for ${email} until ${expiresAt.toISOString()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error activating Pro subscription:`, error);
    return false;
  }
}

async function activateBasicSubscription(email) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: 'basic',
        subscriptionExpiresAt: null, // Basic plans don't expire
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Basic subscription activated for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error activating Basic subscription:`, error);
    return false;
  }
}

async function deactivateSubscription(email) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'inactive',
        subscriptionPlan: null,
        subscriptionExpiresAt: null,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Subscription deactivated for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deactivating subscription:`, error);
    return false;
  }
}

async function extendSubscription(email, days) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }

    if (!user.subscriptionExpiresAt) {
      console.error(`❌ User ${email} has no expiration date (might be Basic plan)`);
      return false;
    }

    const currentExpiration = new Date(user.subscriptionExpiresAt);
    const newExpiration = new Date(currentExpiration.getTime() + days * 24 * 60 * 60 * 1000);
    
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionExpiresAt: newExpiration,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Subscription extended for ${email} until ${newExpiration.toISOString()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error extending subscription:`, error);
    return false;
  }
}

async function showUserInfo(email) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }

    console.log('\n📋 User Information:');
    console.log('====================');
    console.log(`User ID: ${user.userId}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`Subscription Status: ${user.subscriptionStatus || 'None'}`);
    console.log(`Subscription Plan: ${user.subscriptionPlan || 'None'}`);
    console.log(`Expires At: ${user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : 'Never'}`);
    console.log(`Stripe Customer ID: ${user.stripeCustomerId || 'None'}`);
    console.log(`Stripe Subscription ID: ${user.stripeSubscriptionId || 'None'}`);
    console.log(`Created: ${user.createdAt.toISOString()}`);
    console.log(`Updated: ${user.updatedAt.toISOString()}`);

    // Check if subscription is active and not expired
    const now = new Date();
    const hasAccess = user.subscriptionStatus === 'active' && 
                     (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > now);
    console.log(`\n🔐 Access Status: ${hasAccess ? '✅ ACTIVE' : '❌ NO ACCESS'}`);

    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
      const daysLeft = Math.ceil((user.subscriptionExpiresAt - now) / (1000 * 60 * 60 * 24));
      console.log(`⏰ Days Remaining: ${daysLeft}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error fetching user info:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📖 User Management Utility

Usage: node user-management.js <command> <email> [options]

Commands:
  reset-password <email> <newPassword>     Reset user password
  activate-pro <email> [days]              Activate Pro subscription (default: 30 days)
  activate-basic <email>                   Activate Basic subscription  
  deactivate <email>                       Deactivate subscription
  user-info <email>                        Show user information
  extend-subscription <email> <days>       Extend existing subscription

Examples:
  node user-management.js user-info jedimaster@pixelpharm.com
  node user-management.js activate-pro jedimaster@pixelpharm.com 30
  node user-management.js reset-password jedimaster@pixelpharm.com PixelPharm2025!
  node user-management.js extend-subscription jedimaster@pixelpharm.com 7
`);
    process.exit(1);
  }

  const [command, email, ...options] = args;

  try {
    switch (command) {
      case 'reset-password':
        if (!options[0]) {
          console.error('❌ Password required for reset-password command');
          process.exit(1);
        }
        await resetPassword(email, options[0]);
        break;

      case 'activate-pro':
        const days = options[0] ? parseInt(options[0]) : 30;
        await activateProSubscription(email, days);
        break;

      case 'activate-basic':
        await activateBasicSubscription(email);
        break;

      case 'deactivate':
        await deactivateSubscription(email);
        break;

      case 'user-info':
        await showUserInfo(email);
        break;

      case 'extend-subscription':
        if (!options[0]) {
          console.error('❌ Days required for extend-subscription command');
          process.exit(1);
        }
        await extendSubscription(email, parseInt(options[0]));
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getUserByEmail,
  resetPassword,
  activateProSubscription,
  activateBasicSubscription,
  deactivateSubscription,
  extendSubscription,
  showUserInfo,
};