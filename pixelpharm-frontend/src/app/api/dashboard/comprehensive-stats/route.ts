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
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Get ALL biomarker values (not limited to 20)
      let biomarkerValues = [];
      let totalBiomarkerCount = 0;
      let uniqueBiomarkerNames = [];

      try {
        // Get total count of ALL biomarker records
        totalBiomarkerCount = await prisma.biomarkerValue.count({
          where: { userId },
        });

        // Get unique biomarker names
        const uniqueMarkers = await prisma.biomarkerValue.findMany({
          where: { userId },
          select: { biomarkerName: true },
          distinct: ["biomarkerName"],
        });
        uniqueBiomarkerNames = uniqueMarkers.map((m) => m.biomarkerName);

        // Get sample biomarker values for statistics
        biomarkerValues = await prisma.biomarkerValue.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50, // Get more for better statistics
        });

        console.log(`📊 Found ${totalBiomarkerCount} total biomarker records`);
        console.log(
          `📊 Found ${uniqueBiomarkerNames.length} unique biomarker types`
        );
        console.log(
          `📊 Sample biomarkers:`,
          biomarkerValues.slice(0, 5).map((b) => b.biomarkerName)
        );
      } catch (biomarkerError) {
        console.log(
          "⚠️ biomarkerValue table not accessible:",
          biomarkerError.message
        );
      }

      // Get blood test results count
      let bloodTestResults = [];
      try {
        bloodTestResults = await prisma.bloodTestResult.findMany({
          where: { userId },
          orderBy: { testDate: "desc" },
        });
      } catch (error) {
        console.log("⚠️ bloodTestResult table not accessible:", error.message);
      }

      console.log(
        `📊 Found ${fileUploads.length} file uploads and ${totalBiomarkerCount} biomarker records`
      );

      // If we have real data, return real stats
      if (fileUploads.length > 0 || totalBiomarkerCount > 0) {
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

        // For critical, check for high-risk biomarker values
        const criticalBiomarkers = biomarkerValues.filter((b) => {
          if (!b.isAbnormal) return false;

          // Define critical thresholds based on biomarker name and value
          const name = b.biomarkerName.toLowerCase();
          const value = parseFloat(b.value.toString());

          if (name.includes("cholesterol") && value > 7.0) return true;
          if (name.includes("glucose") && value > 11.0) return true;
          if (name.includes("creatinine") && value > 150) return true;

          return false;
        }).length;

        const normalBiomarkers = totalBiomarkerCount - abnormalBiomarkers;

        // Calculate health score based on real data
        let healthScore = 100;
        if (abnormalBiomarkers > 0)
          healthScore -= Math.min(abnormalBiomarkers * 5, 50);
        if (criticalBiomarkers > 0) healthScore -= criticalBiomarkers * 15;
        healthScore = Math.max(20, Math.min(100, healthScore));

        // Determine risk level
        let riskLevel = "LOW";
        if (criticalBiomarkers > 0) riskLevel = "CRITICAL";
        else if (abnormalBiomarkers > 3) riskLevel = "HIGH";
        else if (abnormalBiomarkers > 1) riskLevel = "MODERATE";

        // Calculate data completeness
        const expectedBiomarkers = 25; // Standard comprehensive panel
        const dataCompleteness = Math.min(
          100,
          Math.round((uniqueBiomarkerNames.length / expectedBiomarkers) * 100)
        );

        const realStats = {
          user,
          healthMetrics: {
            totalReports: bloodTestResults.length || bloodTestUploads,
            latestHealthScore: healthScore,
            riskLevel,
            lastAnalysisDate: fileUploads[0]?.createdAt?.toISOString() || null,
          },
          biomarkers: {
            // FIXED: Show total biomarker records, not just sample
            totalBiomarkers: totalBiomarkerCount, // This is the key fix!
            uniqueBiomarkers: uniqueBiomarkerNames.length,
            abnormalCount: abnormalBiomarkers,
            criticalCount: criticalBiomarkers,
            normalCount: normalBiomarkers,
            lastTestDate:
              bloodTestResults[0]?.testDate?.toISOString() ||
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
            healthScoreTrend:
              healthScore >= 75
                ? "positive"
                : healthScore >= 50
                ? "stable"
                : "concerning",
            weightTrend: "stable",
            cholesterolTrend: abnormalBiomarkers > 0 ? "concerning" : "stable",
            overallTrend: riskLevel === "LOW" ? "positive" : "concerning",
          },
          recentActivity: fileUploads.slice(0, 5).map((upload) => ({
            type:
              upload.uploadType?.toLowerCase().replace("_", "_") || "general",
            date: upload.createdAt.toISOString(),
            description: `${
              upload.uploadType?.replace("_", " ").toLowerCase() || "file"
            } uploaded: ${upload.originalFilename}`,
            status: "completed",
          })),
          recommendations: {
            activeCount: Math.max(1, abnormalBiomarkers),
            highPriorityCount:
              criticalBiomarkers + Math.floor(abnormalBiomarkers / 2),
            completedCount: 0,
            categories:
              criticalBiomarkers > 0
                ? ["medical", "monitoring"]
                : ["lifestyle", "monitoring"],
          },
          dataQuality: {
            completeness: dataCompleteness,
            reliability:
              totalBiomarkerCount > 10
                ? "HIGH"
                : fileUploads.length > 2
                ? "MEDIUM"
                : "LOW",
            lastUpdated: new Date().toISOString(),
          },
          performance: {
            processingTime: 450,
            cacheHit: false,
            dataSource: "database",
            generatedAt: new Date().toISOString(),
          },
          // Enhanced debug info
          _debug: {
            fileUploadsFound: fileUploads.length,
            totalBiomarkerRecords: totalBiomarkerCount, // Total count
            uniqueBiomarkerTypes: uniqueBiomarkerNames.length, // Unique types
            bloodTestResults: bloodTestResults.length,
            userId: userId,
            mostRecentUpload: fileUploads[0]?.originalFilename || "None",
            mostRecentUploadDate:
              fileUploads[0]?.createdAt?.toISOString() || "None",
            sampleBiomarkers: uniqueBiomarkerNames.slice(0, 10), // Show sample names
          },
        };

        return NextResponse.json(realStats);
      } else {
        console.log("📊 No file uploads or biomarkers found for user:", userId);
      }
    } catch (fetchError) {
      console.error("❌ Error fetching real user data:", fetchError);
    }

    // Return empty stats for new users (no demo data)
    console.log("📊 No real data found, returning empty stats for new user");

    const emptyStats = {
      user: user || {
        userId,
        email: `${userId}@demo.com`,
        firstName: "New",
        lastName: "User",
      },
      healthMetrics: {
        totalReports: 0,
        latestHealthScore: 0,
        riskLevel: "UNKNOWN",
        lastAnalysisDate: null,
      },
      biomarkers: {
        totalBiomarkers: 0,
        uniqueBiomarkers: 0,
        abnormalCount: 0,
        criticalCount: 0,
        normalCount: 0,
        lastTestDate: null,
      },
      bodyComposition: {
        totalScans: 0,
        latestBMI: null,
        bodyFatPercentage: null,
        muscleMass: null,
        lastScanDate: null,
      },
      trends: {
        healthScoreTrend: "unknown",
        weightTrend: "unknown",
        cholesterolTrend: "unknown",
        overallTrend: "unknown",
      },
      recentActivity: [],
      recommendations: {
        activeCount: 0,
        highPriorityCount: 0,
        completedCount: 0,
        categories: [],
      },
      dataQuality: {
        completeness: 0,
        reliability: "NONE",
        lastUpdated: new Date().toISOString(),
      },
      performance: {
        processingTime: 150,
        cacheHit: false,
        dataSource: "empty",
        generatedAt: new Date().toISOString(),
      },
      _debug: {
        reason: "New user - no health data uploaded yet",
        userId: userId,
        isNewUser: true,
      },
    };

    return NextResponse.json(emptyStats);
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
