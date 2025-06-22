import { NextRequest, NextResponse } from "next/server";
import {
  getLatestHealthInsights,
  getHealthInsightsHistory,
} from "@/lib/database/health-insights";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const history = searchParams.get("history") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (history) {
      const insights = await getHealthInsightsHistory(userId);
      return NextResponse.json({ insights });
    } else {
      const insights = await getLatestHealthInsights(userId);
      return NextResponse.json({ insights });
    }
  } catch (error: any) {
    console.error("Error fetching health insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch health insights", details: error.message },
      { status: 500 }
    );
  }
}
