// File: src/app/api/health/body-composition/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId =
      searchParams.get("userId") ||
      session.user.id ||
      `user-${session.user.email.replace(/[^a-z0-9]/g, "")}`;

    console.log(`📊 Fetching body composition data for user: ${userId}`);

    // Get latest body composition result
    const latestResult = await prisma.bodyCompositionResult
      ?.findFirst({
        where: { userId },
        orderBy: { testDate: "desc" },
      })
      .catch((error) => {
        console.warn(
          "Failed to fetch from bodyCompositionResult:",
          error.message
        );
        return null;
      });

    if (!latestResult) {
      console.log(`📊 No body composition data found for user: ${userId}`);
      return NextResponse.json(
        {
          message: "No body composition data found",
          userId,
        },
        { status: 404 }
      );
    }

    // Get historical data for trends
    const historicalData = await prisma.bodyCompositionResult
      ?.findMany({
        where: { userId },
        orderBy: { testDate: "desc" },
        take: 10,
      })
      .catch((error) => {
        console.warn(
          "Failed to fetch historical body composition data:",
          error.message
        );
        return [];
      });

    console.log(`📊 Found body composition data for user: ${userId}`, {
      totalWeight: latestResult.totalWeight,
      bodyFatPercentage: latestResult.bodyFatPercentage,
      skeletalMuscleMass: latestResult.skeletalMuscleMass,
      bmr: latestResult.bmr,
    });

    return NextResponse.json({
      success: true,
      latest: latestResult,
      history: historicalData,
      trends: {
        weightChange: calculateTrend(historicalData, "totalWeight"),
        bodyFatChange: calculateTrend(historicalData, "bodyFatPercentage"),
        muscleChange: calculateTrend(historicalData, "skeletalMuscleMass"),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching body composition data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch body composition data",
        details: error.message,
        userId: searchParams?.get("userId") || "unknown",
      },
      { status: 500 }
    );
  }
}

function calculateTrend(
  data: any[],
  field: string
): { direction: string; magnitude: number } {
  if (data.length < 2) return { direction: "stable", magnitude: 0 };

  const latest = data[0]?.[field];
  const previous = data[1]?.[field];

  if (!latest || !previous) return { direction: "stable", magnitude: 0 };

  const change = latest - previous;
  const magnitude = Math.abs(change);

  return {
    direction: change > 0 ? "increasing" : change < 0 ? "decreasing" : "stable",
    magnitude,
  };
}
