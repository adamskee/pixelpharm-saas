import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";
import { localHealthAnalyzer } from "@/lib/medical/local-health-analyzer";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priority = "standard", forceRefresh = false } =
      await request.json();
    const userEmail = session.user.email;
    const userId =
      session.user.id || `user-${userEmail.replace(/[^a-z0-9]/g, "")}`;

    console.log(
      `🔍 Starting health analysis for authenticated user: ${userEmail}`
    );
    console.log(`⚡ Priority: ${priority}, Force refresh: ${forceRefresh}`);

    const startTime = Date.now();

    // Fetch real biomarker data for authenticated user
    let biomarkers = [];
    try {
      biomarkers = await prisma.biomarkerValue.findMany({
        where: { userId },
        orderBy: { testDate: "desc" },
        take: 50,
      });
      console.log(`📊 Found ${biomarkers.length} real biomarkers for user`);
    } catch (dbError) {
      console.log("Database query failed:", dbError.message);
    }

    // If no real data found, provide welcome message for authenticated user
    if (!biomarkers || biomarkers.length === 0) {
      console.log(
        "📝 No real biomarker data found, providing welcome message for authenticated user"
      );

      const welcomeAnalysis = {
        healthScore: 85,
        riskLevel: "LOW",
        keyFindings: [
          "Welcome to PixelPharm!",
          "No uploaded blood test data yet",
          "Upload your first blood test to get personalized insights",
        ],
        recommendations: [
          {
            category: "Getting Started",
            priority: "high",
            recommendation: "Upload your most recent blood test results",
            reasoning:
              "Personalized health analysis requires your actual biomarker data",
            actionable: true,
            evidenceLevel: "high",
            timeline: "Upload now",
            difficulty: "Easy",
          },
          {
            category: "Profile Setup",
            priority: "moderate",
            recommendation: "Complete your health profile information",
            reasoning:
              "Additional profile data helps provide more accurate health insights",
            actionable: true,
            evidenceLevel: "moderate",
            timeline: "Within a week",
            difficulty: "Easy",
          },
        ],
        abnormalValues: [],
        normalValues: [],
        trends: [],
        alerts: [],
        summary: `Welcome to PixelPharm, ${session.user.name}! You're successfully signed in with Google. Upload your blood test results to get AI-powered health insights, biomarker analysis, and personalized recommendations tailored specifically to your health profile.`,
        confidence: 1.0,
        lastAnalysisDate: new Date(),
        dataCompleteness: 0.0,
        processingTime: Date.now() - startTime,
        modelVersion: "google-auth-welcome-v1.0",
        cacheHit: false,
        isWelcomeMessage: true,
        nextSteps: [
          "Upload your blood test results",
          "Complete your health profile",
          "Review personalized insights",
        ],
      };

      return NextResponse.json({
        success: true,
        analysis: welcomeAnalysis,
        metadata: {
          userId,
          userEmail,
          userName: session.user.name,
          analysisType: "welcome_google_user",
          timestamp: new Date().toISOString(),
          processingTime: `${Date.now() - startTime}ms`,
          dataSource: "no_uploads_yet",
          message:
            "Welcome! Upload your first blood test for personalized insights",
        },
      });
    }

    // Process real biomarker data using local health analyzer
    console.log(`🔬 Analyzing real biomarker data for ${session.user.name}`);

    const healthAnalysis = await localHealthAnalyzer.analyzeHealth(biomarkers, {
      email: session.user.email,
      name: session.user.name,
    });

    return NextResponse.json({
      success: true,
      analysis: {
        ...healthAnalysis,
        summary: `Health analysis for ${session.user.name}: ${healthAnalysis.summary}`,
        personalizedInsights: true,
        realData: true,
      },
      metadata: {
        userId,
        userEmail,
        userName: session.user.name,
        analysisType: "real_user_data",
        biomarkerCount: biomarkers.length,
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
        dataSource: "uploaded_blood_tests",
      },
    });
  } catch (error: any) {
    console.error("❌ Health analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Analysis temporarily unavailable",
        fallback: {
          healthScore: 75,
          riskLevel: "UNKNOWN",
          keyFindings: ["Health analysis temporarily unavailable"],
          recommendations: [
            {
              category: "System",
              priority: "low",
              recommendation: "Please try again later or contact support",
              reasoning: "System error occurred during analysis",
              actionable: true,
              evidenceLevel: "low",
            },
          ],
          abnormalValues: [],
          trends: [],
          summary:
            "Health analysis is temporarily unavailable. Please try again later.",
          confidence: 0,
          lastAnalysisDate: new Date(),
          dataCompleteness: 0,
          processingTime: 0,
        },
      },
      { status: 500 }
    );
  }
}
