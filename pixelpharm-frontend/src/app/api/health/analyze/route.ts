import { NextRequest, NextResponse } from "next/server";
import { bedrockAnalyzer } from "@/lib/aws/bedrock";
import { storeHealthInsights } from "@/lib/database/health-insights";

export async function POST(request: Request) {
  try {
    const { userId, forceRefresh } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Analyzing health data for user: ${userId}`);

    const analyzer = bedrockAnalyzer;

    // This should now return a proper response instead of throwing
    const insights = await analyzer.getHealthInsights(userId);

    // Determine if user has actual health data
    const hasData = insights.healthScore > 0;

    // Only store insights if they contain real data
    if (hasData) {
      try {
        await storeHealthInsights(userId, insights);
      } catch (storeError) {
        console.error("Failed to store health insights:", storeError);
        // Don't fail the request if storage fails
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      hasData,
      message: hasData
        ? "Health analysis completed successfully"
        : "No health data available - upload documents to get started",
    });
  } catch (error) {
    console.error("Health analysis API error:", error);

    // Return structured error instead of 500
    return NextResponse.json(
      {
        error: "Health analysis failed",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        hasData: false,
      },
      { status: 200 } // Changed from 500 to 200
    );
  }
}
