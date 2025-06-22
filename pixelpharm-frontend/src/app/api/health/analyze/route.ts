import { NextRequest, NextResponse } from "next/server";
import { bedrockAnalyzer } from "@/lib/aws/bedrock";
import { storeHealthInsights } from "@/lib/database/health-insights";

export async function POST(request: NextRequest) {
  try {
    const { userId, forceRefresh = false } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if we should use cached insights or generate new ones
    if (!forceRefresh) {
      const { getLatestHealthInsights } = await import(
        "@/lib/database/health-insights"
      );
      const existingInsights = await getLatestHealthInsights(userId);

      // Return cached insights if they're less than 24 hours old
      if (
        existingInsights &&
        new Date().getTime() - new Date(existingInsights.created_at).getTime() <
          24 * 60 * 60 * 1000
      ) {
        return NextResponse.json({
          insights: {
            healthScore: existingInsights.health_score,
            riskLevel: existingInsights.risk_level,
            keyFindings: existingInsights.key_findings,
            recommendations: existingInsights.recommendations,
            abnormalValues: existingInsights.abnormal_values,
            trends: existingInsights.trends,
            summary: existingInsights.summary,
          },
          cached: true,
          analyzedAt: existingInsights.analysis_date,
        });
      }
    }

    // Generate new insights
    const insights = await bedrockAnalyzer.getHealthInsights(userId);

    // Store the insights
    await storeHealthInsights(userId, insights);

    return NextResponse.json({
      insights,
      cached: false,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze health data", details: error.message },
      { status: 500 }
    );
  }
}
