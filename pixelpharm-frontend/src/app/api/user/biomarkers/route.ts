import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserBiomarkers } from "@/lib/database/user-operations";

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

    return NextResponse.json({
      biomarkers,
      count: biomarkers.length,
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching user biomarkers:", error);
    return NextResponse.json(
      { error: "Failed to fetch biomarkers" },
      { status: 500 }
    );
  }
}
