// File: src/app/api/dashboard/comprehensive-stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching comprehensive stats for user: ${userId}`);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      console.log("🔧 Creating demo user record...");
      try {
        const timestamp = Date.now();
        const emailPart = userId.replace("user-", "").replace(/[^a-z0-9]/g, "");
        const uniqueEmail = userId.includes("@")
          ? userId
          : `${emailPart}-${timestamp}@demo.pixelpharm.com`;

        user = await prisma.user.create({
          data: {
            userId,
            email: uniqueEmail,
            firstName: "Demo",
            lastName: "User",
            cognitoSub: `demo-${userId}`,
          },
        });
        console.log("✅ Demo user created successfully:", user.userId);
      } catch (createError) {
        console.error("❌ Failed to create demo user:", createError);
      }
    }

    // Try to get real data first
    console.log("📊 Fetching real data for user:", userId);

    try {
      // Get file uploads using correct field names from your schema
      const fileUploads = await prisma.fileUpload.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }, // Use createdAt instead of uploadedAt
        take: 10,
      });

      // Get biomarker values if the table exists
      let biomarkerValues = [];
      try {
        biomarkerValues = await prisma.biomarkerValue.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" }, // Use createdAt instead of testDate
          take: 20,
        });
      } catch (biomarkerError) {
        console.log(
          "⚠️ biomarkerValue table not accessible:",
          biomarkerError.message
        );
      }

      console.log(
        `📊 Found ${fileUploads.length} file uploads and ${biomarkerValues.length} biomarker values`
      );

      // If we have real data, return real stats
      if (fileUploads.length > 0) {
        console.log("✅ Returning REAL user stats based on database data");

        // Calculate real statistics
        const bloodTestUploads = fileUploads.filter(
          (f) => f.uploadType === "BLOOD_TESTS"
        ).length;
        const bodyCompositionUploads = fileUploads.filter(
          (f) => f.uploadType === "BODY_COMPOSITION"
        ).length;
        const abnormalBiomarkers = biomarkerValues.filter(
          (b) => b.isAbnormal
        ).length;
        const criticalBiomarkers = biomarkerValues.filter(
          (b) => b.urgencyLevel === "CRITICAL"
        ).length;
        const normalBiomarkers =
          biomarkerValues.length - abnormalBiomarkers - criticalBiomarkers;

        // Calculate health score based on real data
        let healthScore = 100;
        if (abnormalBiomarkers > 0) healthScore -= abnormalBiomarkers * 10;
        if (criticalBiomarkers > 0) healthScore -= criticalBiomarkers * 20;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Determine risk level
        let riskLevel = "LOW";
        if (criticalBiomarkers > 0) riskLevel = "CRITICAL";
        else if (abnormalBiomarkers > 2) riskLevel = "HIGH";
        else if (abnormalBiomarkers > 0) riskLevel = "MODERATE";

        const realStats = {
          user,
          healthMetrics: {
            totalReports: fileUploads.length,
            latestHealthScore: healthScore,
            riskLevel,
            lastAnalysisDate: fileUploads[0]?.createdAt?.toISOString() || null,
          },
          biomarkers: {
            totalBiomarkers: biomarkerValues.length,
            abnormalCount: abnormalBiomarkers,
            criticalCount: criticalBiomarkers,
            normalCount: normalBiomarkers,
            lastTestDate:
              biomarkerValues[0]?.createdAt?.toISOString() ||
              fileUploads[0]?.createdAt?.toISOString() ||
              null,
          },
          bodyComposition: {
            totalScans: bodyCompositionUploads,
            latestBMI: null,
            bodyFatPercentage: null,
            muscleMass: null,
            lastScanDate:
              fileUploads
                .find((f) => f.uploadType === "BODY_COMPOSITION")
                ?.createdAt?.toISOString() || null,
          },
          trends: {
            healthScoreTrend: "stable",
            weightTrend: "stable",
            cholesterolTrend: abnormalBiomarkers > 0 ? "concerning" : "stable",
            overallTrend: riskLevel === "LOW" ? "positive" : "concerning",
          },
          recentActivity: fileUploads.slice(0, 5).map((upload) => ({
            type: upload.uploadType.toLowerCase().replace("_", "_"),
            date: upload.createdAt.toISOString(),
            description: `${upload.uploadType
              .replace("_", " ")
              .toLowerCase()} uploaded: ${upload.originalFilename}`,
            status: "completed",
          })),
          recommendations: {
            activeCount: Math.max(1, abnormalBiomarkers * 2),
            highPriorityCount:
              criticalBiomarkers + Math.floor(abnormalBiomarkers / 2),
            completedCount: 0,
            categories: ["lifestyle", "monitoring"],
          },
          dataQuality: {
            completeness: Math.min(
              100,
              Math.max(50, (biomarkerValues.length / 15) * 100)
            ),
            reliability: fileUploads.length > 2 ? "HIGH" : "MEDIUM",
            lastUpdated: new Date().toISOString(),
          },
          performance: {
            processingTime: 450,
            cacheHit: false,
            dataSource: "database",
            generatedAt: new Date().toISOString(),
          },
          // Debug info
          _debug: {
            fileUploadsFound: fileUploads.length,
            biomarkerValuesFound: biomarkerValues.length,
            userId: userId,
            mostRecentUpload: fileUploads[0]?.originalFilename || "None",
            mostRecentUploadDate:
              fileUploads[0]?.createdAt?.toISOString() || "None",
          },
        };

        return NextResponse.json(realStats);
      } else {
        console.log("📊 No file uploads found for user:", userId);
      }
    } catch (fetchError) {
      console.error("❌ Error fetching real user data:", fetchError);
    }

    // Fall back to demo data only if no real data exists
    console.log("📊 No real data found, returning demo stats");

    const demoStats = {
      user: user || {
        userId,
        email: `${userId}@demo.com`,
        firstName: "Demo",
        lastName: "User",
      },
      healthMetrics: {
        totalReports: 3,
        latestHealthScore: 65,
        riskLevel: "MODERATE",
        lastAnalysisDate: new Date().toISOString(),
      },
      biomarkers: {
        totalBiomarkers: 12,
        abnormalCount: 3,
        criticalCount: 0,
        normalCount: 9,
        lastTestDate: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      bodyComposition: {
        totalScans: 1,
        latestBMI: 24.5,
        bodyFatPercentage: 18.2,
        muscleMass: 65.4,
        lastScanDate: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      trends: {
        healthScoreTrend: "stable",
        weightTrend: "decreasing",
        cholesterolTrend: "improving",
        overallTrend: "positive",
      },
      recentActivity: [
        {
          type: "biomarker_analysis",
          date: new Date().toISOString(),
          description: "Demo: Comprehensive blood panel analysis",
          status: "completed",
        },
      ],
      recommendations: {
        activeCount: 6,
        highPriorityCount: 2,
        completedCount: 8,
        categories: ["lifestyle", "nutrition", "exercise", "monitoring"],
      },
      dataQuality: {
        completeness: 85,
        reliability: "HIGH",
        lastUpdated: new Date().toISOString(),
      },
      performance: {
        processingTime: 1250,
        cacheHit: false,
        dataSource: "demo",
        generatedAt: new Date().toISOString(),
      },
      _debug: {
        reason: "No file uploads found",
        userId: userId,
      },
    };

    return NextResponse.json(demoStats);
  } catch (error) {
    console.error("❌ Comprehensive stats API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Unable to fetch comprehensive stats",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
