import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserBiomarkers } from "@/lib/database/user-operations";
import { prisma } from "@/lib/database/client";
// TEMPORARILY DISABLED - PLAN FIELDS REMOVED FROM SCHEMA
// import { limitBiomarkersForPlan, getUserPlanStatus } from "@/lib/plans/plan-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    
    // Try to get session first
    const session = await getServerSession(authOptions);
    
    // Use session user ID if available, otherwise fall back to URL parameter
    let userId = session?.user?.id || userIdParam;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // If using URL parameter without session, log for debugging
    if (!session && userIdParam) {
      console.log("🔬 Fetching biomarkers for userId from parameter:", userIdParam);
    }

    const limit = parseInt(searchParams.get("limit") || "50");
    const biomarkerNames = searchParams.get("biomarkers")?.split(",");
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    const biomarkers = await getUserBiomarkers(userId, {
      limit,
      biomarkerNames,
      dateFrom,
      dateTo,
    });

    // PLAN-BASED BIOMARKER FILTERING
    let filteredBiomarkers = biomarkers;
    let planStatus = null;
    
    // Try to get user's actual plan from database
    let userPlan = 'free'; // default
    let uploadsUsed = 0;
    
    try {
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          planType: true,
          uploadsUsed: true,
          isAnonymous: true,
          provider: true,
          email: true
        }
      });
      
      if (user) {
        console.log(`🔍 User found: ${user.email}, planType: ${user.planType}, provider: ${user.provider}`);
        
        // Set plan based on user data
        if (user.planType) {
          userPlan = user.planType.toLowerCase();
          console.log(`✅ Using planType: ${user.planType} → ${userPlan}`);
        } else {
          // For existing Google OAuth users like adampiro@gmail.com, give them PRO access
          if (user.provider === 'google' && !user.isAnonymous) {
            userPlan = 'pro';
            console.log(`🎯 Google OAuth user detected (${user.email}), granting PRO access`);
          } else {
            userPlan = 'free';
            console.log(`⚠️ No planType found, defaulting to free for ${user.email}`);
          }
        }
        uploadsUsed = user.uploadsUsed || 0;
      } else {
        console.log(`❌ No user found with userId: ${userId}`);
      }
    } catch (dbError) {
      console.warn('⚠️ Could not fetch user plan from database:', dbError.message);
      userPlan = 'free'; // fallback
    }

    // Apply plan-based filtering
    const FREE_PLAN_BIOMARKER_LIMIT = 3;
    const PRO_PLAN_BIOMARKER_LIMIT = 50; // Generous limit for pro users
    
    let currentPlan = userPlan;
    let biomarkerLimit = biomarkers.length; // No limit by default
    
    if (userPlan === 'free') {
      biomarkerLimit = FREE_PLAN_BIOMARKER_LIMIT;
      if (biomarkers.length > biomarkerLimit) {
        filteredBiomarkers = biomarkers.slice(0, biomarkerLimit);
        console.log(`🔬 Applied FREE plan limit: ${biomarkers.length} → ${filteredBiomarkers.length} biomarkers`);
      }
    } else if (userPlan === 'basic' || userPlan === 'pro' || userPlan === 'elite') {
      // Basic, Pro and Elite users get all biomarkers
      console.log(`🔬 ${userPlan.toUpperCase()} user: showing all ${biomarkers.length} biomarkers`);
    } else {
      // Unknown plan - treat as free for safety
      biomarkerLimit = FREE_PLAN_BIOMARKER_LIMIT;
      if (biomarkers.length > biomarkerLimit) {
        filteredBiomarkers = biomarkers.slice(0, biomarkerLimit);
        console.log(`🔬 Unknown plan (${userPlan}), applied FREE plan limit: ${biomarkers.length} → ${filteredBiomarkers.length} biomarkers`);
      }
      currentPlan = 'free';
    }
    
    // Set plan status for frontend
    planStatus = {
      currentPlan: currentPlan,
      uploadsUsed: uploadsUsed,
      uploadsRemaining: currentPlan === 'free' ? Math.max(0, 1 - uploadsUsed) : 999, // Pro users get unlimited
      canUpload: currentPlan === 'free' ? uploadsUsed < 1 : true, // Pro users can always upload
      needsUpgrade: currentPlan === 'free' && biomarkers.length > FREE_PLAN_BIOMARKER_LIMIT,
    };

    // try {
    //   planStatus = await getUserPlanStatus(userId);
    //   filteredBiomarkers = limitBiomarkersForPlan(biomarkers, planStatus.currentPlan);
    //   console.log(`🔬 Biomarker filtering applied for ${planStatus.currentPlan} plan: ${biomarkers.length} → ${filteredBiomarkers.length}`);
    // } catch (planError) {
    //   console.warn("⚠️ Could not apply plan filtering (likely missing DB fields):", planError.message);
    //   filteredBiomarkers = limitBiomarkersForPlan(biomarkers, 'free');
    // }

    return NextResponse.json({
      biomarkers: filteredBiomarkers,
      count: filteredBiomarkers.length,
      totalCount: biomarkers.length, // Include original count for debugging
      userId: userId,
      planStatus: planStatus,
    });
  } catch (error) {
    console.error("Error fetching user biomarkers:", error);
    return NextResponse.json(
      { error: "Failed to fetch biomarkers" },
      { status: 500 }
    );
  }
}
