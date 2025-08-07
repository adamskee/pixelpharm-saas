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

    // TEMPORARY FREE PLAN LOGIC - Check if user has uploaded before
    const userFileUploads = await prisma.fileUpload.count({
      where: { userId }
    });
    
    const userBiomarkers = await prisma.biomarkerValue.count({
      where: { userId }
    });
    
    const uniqueBiomarkers = await prisma.biomarkerValue.findMany({
      where: { userId },
      select: { biomarkerName: true },
      distinct: ['biomarkerName']
    });
    
    console.log(`📊 User ${userId}: ${userFileUploads} uploads, ${userBiomarkers} biomarkers, ${uniqueBiomarkers.length} unique`);
    
    // Hardcoded free plan logic until schema is restored
    const FREE_PLAN_BIOMARKER_LIMIT = 3;
    const hasUsedUpload = userFileUploads > 0;
    
    const planStatus = {
      currentPlan: 'free',
      uploadsUsed: hasUsedUpload ? 1 : 0,
      uploadsRemaining: hasUsedUpload ? 0 : 1,
      canUpload: !hasUsedUpload,
      needsUpgrade: uniqueBiomarkers.length > FREE_PLAN_BIOMARKER_LIMIT,
      limits: {
        maxUploads: 1,
        maxBiomarkers: FREE_PLAN_BIOMARKER_LIMIT,
        hasHealthOptimization: true,
        hasAdvancedAnalytics: false,
      }
    };
    
    const uploadPermission = {
      canUpload: !hasUsedUpload,
      reason: hasUsedUpload ? "Free plan upload limit reached (1 lifetime upload used)" : "Upload allowed",
      upgradeRequired: hasUsedUpload
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