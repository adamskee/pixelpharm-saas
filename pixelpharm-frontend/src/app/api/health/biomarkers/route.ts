import { NextRequest, NextResponse } from "next/server";
import { getBiomarkerTrends } from "@/lib/database/ai-results";
import { getUserHealthSummary } from "@/lib/database/users";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const biomarkerName = searchParams.get("biomarker");
    const months = parseInt(searchParams.get("months") || "12");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    console.log("📊 Getting biomarker data:", {
      userId,
      biomarkerName,
      months,
    });

    // Get biomarker trends
    const trends = await getBiomarkerTrends(
      userId,
      biomarkerName || undefined,
      months
    );

    // Get overall health summary
    const healthSummary = await getUserHealthSummary(userId);

    // Group trends by biomarker name
    const trendsByBiomarker = trends.reduce((acc, trend) => {
      if (!acc[trend.biomarkerName]) {
        acc[trend.biomarkerName] = [];
      }
      acc[trend.biomarkerName].push({
        value: Number(trend.value),
        unit: trend.unit,
        testDate: trend.testDate,
        referenceRange: trend.referenceRange,
        isAbnormal: trend.isAbnormal,
        labName: trend.result.labName,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      userId,
      biomarkerName: biomarkerName || "all",
      timeRange: `${months} months`,
      data: {
        trends: trendsByBiomarker,
        totalDataPoints: trends.length,
        summary: {
          totalUploads: healthSummary?._count?.fileUploads || 0,
          totalBloodTests: healthSummary?._count?.bloodTestResults || 0,
          totalBiomarkers: healthSummary?._count?.biomarkerValues || 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Failed to get biomarker data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get biomarker data",
        details: error instanceof Error ? error.message : "Unknown error",
        data: {
          trends: {},
          totalDataPoints: 0,
          summary: {
            totalUploads: 0,
            totalBloodTests: 0,
            totalBiomarkers: 0,
          },
        },
      },
      { status: 500 }
    );
  }
}
