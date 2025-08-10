// File: src/app/api/user/plan-status/route.ts
// API endpoint for checking user plan status and limits

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
// TEMPORARILY DISABLED - PLAN FIELDS REMOVED FROM SCHEMA
// import { getUserPlanStatus, checkUploadPermission } from "@/lib/plans/plan-utils";
import { prisma } from "@/lib/database/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || 
      session.user.id || 
      `user-${session.user.email.replace(/[^a-z0-9]/g, "")}`;

    console.log(`📊 Getting plan status for user: ${userId}`);

    // PLAN-BASED LOGIC - Determine actual user plan
    let userPlan = 'free'; // Default
    let planType = 'free';
    let uploadsUsed = 0;
    
    try {
      // Get user details including plan and provider info
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          planType: true,
          uploadsUsed: true,
          isAnonymous: true,
          provider: true,
          email: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      });
      
      if (user) {
        // Check subscription plan first (for paid users), then planType enum, then fallback logic
        if (user.subscriptionPlan && user.subscriptionStatus === 'active') {
          userPlan = user.subscriptionPlan.toLowerCase();
          planType = user.subscriptionPlan.toLowerCase();
          console.log(`💳 Active subscription detected: ${user.subscriptionPlan} (${user.email})`);
        } else if (user.planType) {
          userPlan = user.planType.toLowerCase();
          planType = user.planType.toLowerCase();
        } else {
          // For existing Google OAuth users like adampiro@gmail.com, give them PRO access
          if (user.provider === 'google' && !user.isAnonymous) {
            userPlan = 'pro';
            planType = 'pro';
            console.log(`🎯 Google OAuth user detected (${user.email}), granting PRO access`);
          } else {
            userPlan = 'free';
            planType = 'free';
          }
        }
        uploadsUsed = user.uploadsUsed || 0;
      }
      
      // Also count file uploads as backup
      const userFileUploads = await prisma.file_uploads.count({
        where: { user_id: userId }
      });
      
      // Use the higher count (database field or actual uploads)
      uploadsUsed = Math.max(uploadsUsed, userFileUploads);
      
    } catch (dbError) {
      console.warn("⚠️ Could not fetch user plan from database:", dbError.message);
      // Fallback - count uploads only
      const userFileUploads = await prisma.file_uploads.count({
        where: { user_id: userId }
      });
      uploadsUsed = userFileUploads;
    }
    
    const userBiomarkers = await prisma.biomarker_values.count({
      where: { user_id: userId }
    });
    
    const uniqueBiomarkers = await prisma.biomarker_values.findMany({
      where: { user_id: userId },
      select: { biomarker_name: true },
      distinct: ['biomarker_name']
    });
    
    console.log(`📊 User ${userId}: ${uploadsUsed} uploads, ${userBiomarkers} biomarkers, ${uniqueBiomarkers.length} unique, plan: ${userPlan.toUpperCase()}`);
    
    // Calculate plan limits based on actual plan
    const FREE_PLAN_BIOMARKER_LIMIT = 3;
    let uploadLimit, biomarkerLimit, hasAdvancedAnalytics;
    
    if (userPlan === 'free') {
      uploadLimit = 1;
      biomarkerLimit = FREE_PLAN_BIOMARKER_LIMIT;
      hasAdvancedAnalytics = false;
    } else if (userPlan === 'basic') {
      uploadLimit = 10; // Basic plan gets 10 uploads
      biomarkerLimit = 999; // Unlimited biomarkers for basic
      hasAdvancedAnalytics = true;
    } else if (userPlan === 'pro') {
      uploadLimit = 20; // Pro plan gets 20 uploads
      biomarkerLimit = 999; // Unlimited for pro users
      hasAdvancedAnalytics = true;
    } else if (userPlan === 'elite') {
      uploadLimit = 999; // Unlimited for elite users
      biomarkerLimit = 999; // Unlimited for elite users  
      hasAdvancedAnalytics = true;
    } else {
      // Unknown plan - treat as free for safety
      uploadLimit = 1;
      biomarkerLimit = FREE_PLAN_BIOMARKER_LIMIT;
      hasAdvancedAnalytics = false;
      userPlan = 'free';
    }
    
    const uploadsRemaining = Math.max(0, uploadLimit - uploadsUsed);
    const canUpload = uploadsUsed < uploadLimit;
    const needsUpgrade = userPlan === 'free' && uniqueBiomarkers.length > biomarkerLimit;
    
    const planStatus = {
      currentPlan: userPlan,
      uploadsUsed: uploadsUsed,
      uploadsRemaining: uploadsRemaining,
      canUpload: canUpload,
      needsUpgrade: needsUpgrade,
      limits: {
        maxUploads: uploadLimit,
        maxBiomarkers: biomarkerLimit,
        hasHealthOptimization: true,
        hasAdvancedAnalytics: hasAdvancedAnalytics,
      }
    };
    
    const uploadPermission = {
      canUpload: canUpload,
      reason: canUpload ? "Upload allowed" : `${userPlan.toUpperCase()} plan upload limit reached (${uploadsUsed}/${uploadLimit} uploads used)`,
      upgradeRequired: !canUpload && userPlan === 'free'
    };

    return NextResponse.json({
      success: true,
      userId,
      planStatus,
      uploadPermission,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Error getting plan status:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get plan status",
      details: error.message,
    }, { status: 500 });
  }
}