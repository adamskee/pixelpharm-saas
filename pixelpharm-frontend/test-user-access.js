#!/usr/bin/env node

/**
 * User Access and Biomarker Limit Testing Script
 * 
 * This script tests:
 * 1. User plan detection accuracy
 * 2. Biomarker limit enforcement
 * 3. Plan-based access control
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserAccess() {
  console.log('🧪 Starting User Access Testing...\n');

  try {
    // Get all users with their biomarker data
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        planType: true,
        provider: true,
        isAnonymous: true,
        uploadsUsed: true,
        _count: {
          select: {
            biomarker_values: true,
            file_uploads: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${users.length} users to test\n`);

    // Test each user's access
    for (const user of users) {
      console.log(`\n👤 Testing User: ${user.email || user.userId}`);
      console.log(`   Plan Type: ${user.planType || 'NULL'}`);
      console.log(`   Provider: ${user.provider || 'NULL'}`);
      console.log(`   Anonymous: ${user.isAnonymous}`);
      console.log(`   Total Biomarkers: ${user._count.biomarker_values}`);
      console.log(`   File Uploads: ${user._count.file_uploads}`);

      // Simulate plan detection logic from your APIs
      let expectedPlan = 'free'; // default
      
      if (user.planType) {
        expectedPlan = user.planType.toLowerCase();
        console.log(`   ✅ Using planType: ${user.planType} → ${expectedPlan}`);
      } else {
        // Fallback logic for existing Google OAuth users
        if (user.provider === 'google' && !user.isAnonymous) {
          expectedPlan = 'pro';
          console.log(`   🎯 Google OAuth user detected, granting PRO access`);
        } else {
          expectedPlan = 'free';
          console.log(`   ⚠️ No planType found, defaulting to free`);
        }
      }

      // Calculate expected biomarker limits
      let expectedLimit;
      let shouldShowAll = false;

      switch (expectedPlan) {
        case 'free':
          expectedLimit = 3;
          shouldShowAll = user._count.biomarker_values <= 3;
          break;
        case 'basic':
        case 'pro':
        case 'elite':
          expectedLimit = 999; // Unlimited
          shouldShowAll = true;
          break;
        default:
          expectedLimit = 3; // Unknown plan = free
          shouldShowAll = user._count.biomarker_values <= 3;
      }

      console.log(`   📋 Expected Plan: ${expectedPlan.toUpperCase()}`);
      console.log(`   📊 Expected Limit: ${expectedLimit === 999 ? 'Unlimited' : expectedLimit}`);
      console.log(`   🔍 Should Show All Biomarkers: ${shouldShowAll ? 'YES' : `NO (${Math.min(user._count.biomarker_values, expectedLimit)} of ${user._count.biomarker_values})`}`);

      // Test the actual API endpoint
      await testBiomarkerAPI(user.userId, expectedPlan, expectedLimit, user._count.biomarker_values);
      
      console.log(`   ${'─'.repeat(80)}`);
    }

  } catch (error) {
    console.error('❌ Error during user access testing:', error);
  }
}

async function testBiomarkerAPI(userId, expectedPlan, expectedLimit, totalBiomarkers) {
  try {
    // Test plan status API
    const planResponse = await fetch(`http://localhost:3000/api/user/plan-status?userId=${userId}`);
    
    if (planResponse.ok) {
      const planData = await planResponse.json();
      console.log(`   📡 Plan Status API: ${planData.planStatus.currentPlan.toUpperCase()}`);
      
      if (planData.planStatus.currentPlan !== expectedPlan) {
        console.log(`   ⚠️ PLAN MISMATCH: Expected ${expectedPlan}, got ${planData.planStatus.currentPlan}`);
      }
    } else {
      console.log(`   ❌ Plan Status API Error: ${planResponse.status}`);
    }

    // Test biomarkers API
    const biomarkersResponse = await fetch(`http://localhost:3000/api/user/biomarkers?userId=${userId}`);
    
    if (biomarkersResponse.ok) {
      const biomarkersData = await biomarkersResponse.json();
      const returnedCount = biomarkersData.count;
      const totalCount = biomarkersData.totalCount;
      
      console.log(`   🧬 Biomarkers API: Returned ${returnedCount} of ${totalCount} total`);
      
      // Verify the filtering is correct
      let expectedReturnCount;
      if (expectedPlan === 'free') {
        expectedReturnCount = Math.min(totalCount, 3);
      } else {
        expectedReturnCount = totalCount;
      }
      
      if (returnedCount === expectedReturnCount) {
        console.log(`   ✅ CORRECT: Showing ${returnedCount} biomarkers for ${expectedPlan.toUpperCase()} plan`);
      } else {
        console.log(`   ❌ ERROR: Expected ${expectedReturnCount}, got ${returnedCount} for ${expectedPlan.toUpperCase()} plan`);
      }
    } else {
      console.log(`   ❌ Biomarkers API Error: ${biomarkersResponse.status}`);
    }

  } catch (apiError) {
    console.log(`   ⚠️ API Test Error: ${apiError.message} (Server may not be running)`);
  }
}

async function generateTestSummary() {
  console.log('\n📋 Test Summary Report');
  console.log('='.repeat(80));

  try {
    const stats = await prisma.user.groupBy({
      by: ['planType'],
      _count: {
        userId: true
      }
    });

    console.log('\n📊 Users by Plan Type:');
    stats.forEach(stat => {
      console.log(`   ${(stat.planType || 'NULL').padEnd(10)} : ${stat._count.userId} users`);
    });

    const biomarkerStats = await prisma.$queryRaw`
      SELECT 
        u.plan_type,
        COUNT(u.user_id) as user_count,
        AVG(bv_count.biomarker_count) as avg_biomarkers,
        MAX(bv_count.biomarker_count) as max_biomarkers
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id, 
          COUNT(*) as biomarker_count 
        FROM biomarker_values 
        GROUP BY user_id
      ) bv_count ON u.user_id = bv_count.user_id
      GROUP BY u.plan_type
    `;

    console.log('\n🧬 Biomarker Statistics by Plan:');
    biomarkerStats.forEach(stat => {
      console.log(`   ${(stat.plan_type || 'NULL').padEnd(10)} : Avg: ${parseFloat(stat.avg_biomarkers || 0).toFixed(1)}, Max: ${stat.max_biomarkers || 0}`);
    });

  } catch (error) {
    console.error('❌ Error generating summary:', error);
  }
}

async function main() {
  console.log('🔬 PixelPharm User Access Testing');
  console.log('='.repeat(80));
  
  await testUserAccess();
  await generateTestSummary();
  
  console.log('\n✅ Testing Complete!');
  console.log('\nTo test manually:');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Visit /admin to check user plans');
  console.log('3. Test different user accounts in incognito windows');
  console.log('4. Check browser console for plan detection logs');
  
  await prisma.$disconnect();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}