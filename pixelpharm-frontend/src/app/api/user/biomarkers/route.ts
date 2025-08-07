import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserBiomarkers } from "@/lib/database/user-operations";
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

    // TEMPORARILY DISABLED - Plan filtering removed until schema is updated
    let filteredBiomarkers = biomarkers; // Show all biomarkers
    let planStatus = null;

    console.log(`🔬 Returning all biomarkers (plan filtering temporarily disabled): ${biomarkers.length}`);
    
    // Default plan status for compatibility
    planStatus = {
      currentPlan: 'free',
      uploadsUsed: 0,
      uploadsRemaining: 1,
      canUpload: true,
      needsUpgrade: false,
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
