// File: src/app/api/user/plan-status/route.ts
// API endpoint for checking user plan status and limits

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { getUserPlanStatus, checkUploadPermission } from "@/lib/plans/plan-utils";

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

    // Get plan status and upload permissions
    const [planStatus, uploadPermission] = await Promise.all([
      getUserPlanStatus(userId),
      checkUploadPermission(userId)
    ]);

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