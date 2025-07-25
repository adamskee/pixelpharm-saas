// File: src/app/api/health/analyze/route.ts
// Replace your existing file with this optimized version

import { NextResponse } from "next/server";
import { optimizedBedrockAnalyzer } from "@/lib/aws/bedrock-optimized";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      userId,
      forceRefresh = false,
      priority = "standard",
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting optimized health analysis for user: ${userId}`);
    console.log(`⚡ Priority: ${priority}, Force refresh: ${forceRefresh}`);

    // Fetch biomarkers with enhanced query
    const biomarkers = await prisma.biomarkerValue.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
      take: 50, // Limit for performance
    });

    if (biomarkers.length === 0) {
      console.log("❌ No biomarker data found for user");
      return NextResponse.json(
        {
          error: "No biomarker data available for analysis",
          suggestion: "Please upload blood test results first",
        },
        { status: 404 }
      );
    }

    // Fetch body composition data
    const bodyComposition = await prisma.bodyCompositionResult.findFirst({
      where: { userId },
      orderBy: { testDate: "desc" },
    });

    // Fetch user profile
    const userProfile = await prisma.user.findUnique({
      where: { userId },
      select: {
        dateOfBirth: true,
        gender: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Found ${biomarkers.length} biomarkers for analysis`);
    console.log(
      `👤 User profile: Age ${
        userProfile?.dateOfBirth
          ? new Date().getFullYear() -
            new Date(userProfile.dateOfBirth).getFullYear()
          : "unknown"
      }, Gender: ${userProfile?.gender || "unknown"}`
    );

    // Determine priority based on abnormal values if not specified
    const abnormalCount = biomarkers.filter((b) => b.isAbnormal).length;
    const finalPriority =
      priority === "standard" && abnormalCount > 3 ? "urgent" : priority;

    console.log(
      `🎯 Final priority: ${finalPriority} (${abnormalCount} abnormal values)`
    );

    // Run optimized analysis
    const startTime = Date.now();
    const insights = await optimizedBedrockAnalyzer.getHealthInsights(
      userId,
      biomarkers,
      bodyComposition,
      userProfile
    );

    const totalTime = Date.now() - startTime;
    console.log(
      `✅ Analysis completed in ${totalTime}ms (${
        insights.cacheHit ? "cache hit" : "fresh analysis"
      })`
    );

    // Store results in database for future reference
    try {
      await prisma.healthInsight.upsert({
        where: { userId },
        update: {
          healthScore: insights.healthScore,
          riskLevel: insights.riskLevel,
          keyFindings: insights.keyFindings,
          summary: insights.summary,
          confidence: insights.confidence,
          processingTime: insights.processingTime,
          modelVersion: insights.modelVersion,
          updatedAt: new Date(),
        },
        create: {
          userId,
          healthScore: insights.healthScore,
          riskLevel: insights.riskLevel,
          keyFindings: insights.keyFindings,
          summary: insights.summary,
          confidence: insights.confidence,
          processingTime: insights.processingTime,
          modelVersion: insights.modelVersion,
        },
      });
      console.log("💾 Results saved to database");
    } catch (dbError) {
      console.error("⚠️  Database save failed (continuing anyway):", dbError);
    }

    // Enhanced response with performance metrics
    return NextResponse.json({
      ...insights,
      metadata: {
        totalBiomarkers: biomarkers.length,
        abnormalCount,
        hasBodyComposition: !!bodyComposition,
        analysisTimestamp: new Date().toISOString(),
        performance: {
          processingTime: insights.processingTime,
          cacheHit: insights.cacheHit,
          modelVersion: insights.modelVersion,
          priority: finalPriority,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Health analysis failed:", error);

    return NextResponse.json(
      {
        error: "Health analysis failed",
        details: error.message,
        fallback: {
          healthScore: 50,
          riskLevel: "UNKNOWN",
          keyFindings: ["Analysis temporarily unavailable"],
          summary:
            "Please try again later or contact support if the issue persists.",
          confidence: 0,
          lastAnalysisDate: new Date(),
          dataCompleteness: 0,
          recommendations: [],
          abnormalValues: [],
          trends: [],
          trendAnalysis: [],
          alerts: [],
        },
      },
      { status: 500 }
    );
  }
}
