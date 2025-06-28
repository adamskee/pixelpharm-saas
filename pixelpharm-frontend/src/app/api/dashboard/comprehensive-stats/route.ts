// src/app/api/dashboard/comprehensive-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

interface ComprehensiveDashboardStats {
  totalUploads: number;
  bloodTestUploads: number;
  bodyCompositionUploads: number;
  fitnessActivityUploads: number;
  biomarkersTracked: number;
  uniqueBiomarkers: number;
  lastUploadDate: string | null;
  firstUploadDate: string | null;
  aiAnalysesRun: number;
  healthInsightsGenerated: number;
  abnormalValues: number;
  criticalValues: number;
  healthScore: number | null;
  trendingBiomarkers: Array<{
    name: string;
    trend: "improving" | "stable" | "concerning";
    changePercent: number;
  }>;
  dataCompleteness: number;
  lastAnalysisDate: string | null;
  consecutiveDaysTracked: number;
  healthGoalsAchieved: number;
  riskAssessments: {
    cardiovascular: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    metabolic: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    overall: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all file uploads with counts by type
    const uploadStats = await prisma.fileUpload.groupBy({
      by: ["uploadType"],
      where: { userId },
      _count: {
        uploadId: true,
      },
    });

    // Get fitness activities count (they might be stored separately)
    const fitnessActivitiesCount = await prisma.fitnessActivity.count({
      where: { userId },
    });

    // Calculate upload statistics
    const totalUploads = uploadStats.reduce(
      (sum, stat) => sum + stat._count.uploadId,
      0
    );
    const bloodTestUploads =
      uploadStats.find((s) => s.uploadType === "BLOOD_TESTS")?._count
        .uploadId || 0;
    const bodyCompositionUploads =
      uploadStats.find((s) => s.uploadType === "BODY_COMPOSITION")?._count
        .uploadId || 0;
    const fitnessActivityUploads =
      uploadStats.find((s) => s.uploadType === "FITNESS_ACTIVITIES")?._count
        .uploadId || 0;

    // Use the actual fitness activities count if it's higher (in case activities are stored separately)
    const actualFitnessCount = Math.max(
      fitnessActivityUploads,
      fitnessActivitiesCount
    );

    // Get upload date range
    const uploadDateRange = await prisma.fileUpload.aggregate({
      where: { userId },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    // Get biomarker statistics
    const biomarkerStats = await prisma.biomarkerValue.aggregate({
      where: { userId },
      _count: { valueId: true },
    });

    const uniqueBiomarkersCount = await prisma.biomarkerValue.groupBy({
      by: ["biomarkerName"],
      where: { userId },
    });

    // Get abnormal and critical values
    const abnormalValues = await prisma.biomarkerValue.count({
      where: {
        userId,
        isAbnormal: true,
      },
    });

    // Count critical values (you may need to add this logic based on your criteria)
    const criticalValues = await prisma.biomarkerValue.count({
      where: {
        userId,
        isAbnormal: true,
        // Add your critical value criteria here
        // For example: value outside severe ranges
      },
    });

    // Get AI processing results count
    const aiAnalysesCount = await prisma.aiProcessingResult.count({
      where: { userId },
    });

    // Get health insights count
    const healthInsightsCount = await prisma.healthInsight.count({
      where: { userId },
    });

    // Get latest analysis date
    const latestAnalysis = await prisma.aiProcessingResult.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Calculate health score (simplified algorithm)
    const healthScore = await calculateHealthScore(userId);

    // Get trending biomarkers
    const trendingBiomarkers = await getTrendingBiomarkers(userId);

    // Calculate data completeness with fitness data
    const dataCompleteness = calculateDataCompleteness({
      hasBloodTests: bloodTestUploads > 0,
      hasBodyComposition: bodyCompositionUploads > 0,
      hasFitnessData: actualFitnessCount > 0,
      biomarkerCount: uniqueBiomarkersCount.length,
      hasRecentData: uploadDateRange._max
        ? Date.now() - new Date(uploadDateRange._max.createdAt).getTime() <
          30 * 24 * 60 * 60 * 1000
        : false,
    });

    // Calculate consecutive tracking days including fitness activities
    const consecutiveDays = await calculateConsecutiveTrackingDays(userId);

    // Calculate risk assessments
    const riskAssessments = await calculateRiskAssessments(userId);

    // Calculate health goals achieved (include fitness goals)
    const healthGoalsAchieved = await calculateHealthGoalsAchieved(
      userId,
      actualFitnessCount
    );

    const stats: ComprehensiveDashboardStats = {
      totalUploads:
        totalUploads +
        (actualFitnessCount > fitnessActivityUploads
          ? actualFitnessCount - fitnessActivityUploads
          : 0),
      bloodTestUploads,
      bodyCompositionUploads,
      fitnessActivityUploads: actualFitnessCount,
      biomarkersTracked: biomarkerStats._count.valueId,
      uniqueBiomarkers: uniqueBiomarkersCount.length,
      lastUploadDate: uploadDateRange._max?.createdAt?.toISOString() || null,
      firstUploadDate: uploadDateRange._min?.createdAt?.toISOString() || null,
      aiAnalysesRun: aiAnalysesCount,
      healthInsightsGenerated: healthInsightsCount,
      abnormalValues,
      criticalValues,
      healthScore,
      trendingBiomarkers,
      dataCompleteness,
      lastAnalysisDate: latestAnalysis?.createdAt?.toISOString() || null,
      consecutiveDaysTracked: consecutiveDays,
      healthGoalsAchieved,
      riskAssessments,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching comprehensive dashboard stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function calculateHealthScore(userId: string): Promise<number | null> {
  try {
    // Get recent biomarker values
    const recentBiomarkers = await prisma.biomarkerValue.findMany({
      where: {
        userId,
        testDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      orderBy: { testDate: "desc" },
    });

    if (recentBiomarkers.length === 0) return null;

    // Simple health score calculation
    const totalMarkers = recentBiomarkers.length;
    const normalMarkers = recentBiomarkers.filter((m) => !m.isAbnormal).length;
    const baseScore = (normalMarkers / totalMarkers) * 100;

    // Bonus points for having comprehensive data
    const bonusPoints = Math.min(recentBiomarkers.length * 2, 20);

    return Math.min(Math.round(baseScore + bonusPoints), 100);
  } catch (error) {
    console.error("Error calculating health score:", error);
    return null;
  }
}

async function getTrendingBiomarkers(userId: string) {
  try {
    // Get biomarkers with multiple measurements for trend analysis
    const biomarkerGroups = await prisma.biomarkerValue.groupBy({
      by: ["biomarkerName"],
      where: { userId },
      _count: { valueId: true },
      having: {
        valueId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    const trendingBiomarkers = [];

    for (const group of biomarkerGroups.slice(0, 6)) {
      // Limit to 6 trending biomarkers
      const biomarkerValues = await prisma.biomarkerValue.findMany({
        where: {
          userId,
          biomarkerName: group.biomarkerName,
        },
        orderBy: { testDate: "desc" },
        take: 3, // Get last 3 measurements for trend
      });

      if (biomarkerValues.length >= 2) {
        const latest = parseFloat(biomarkerValues[0].value.toString());
        const previous = parseFloat(biomarkerValues[1].value.toString());
        const changePercent = Math.round(
          ((latest - previous) / previous) * 100
        );

        let trend: "improving" | "stable" | "concerning" = "stable";

        // Determine trend based on biomarker type and change
        if (Math.abs(changePercent) < 5) {
          trend = "stable";
        } else {
          // For most biomarkers, lower values are generally better
          // You can customize this logic based on specific biomarkers
          const improvingBiomarkers = [
            "cholesterol",
            "ldl",
            "triglycerides",
            "glucose",
            "hba1c",
          ];
          const higherIsBetter = ["hdl", "vitamin", "protein"];

          const biomarkerLower = group.biomarkerName.toLowerCase();

          if (
            improvingBiomarkers.some((marker) =>
              biomarkerLower.includes(marker)
            )
          ) {
            trend = changePercent < 0 ? "improving" : "concerning";
          } else if (
            higherIsBetter.some((marker) => biomarkerLower.includes(marker))
          ) {
            trend = changePercent > 0 ? "improving" : "concerning";
          } else {
            trend = Math.abs(changePercent) > 15 ? "concerning" : "stable";
          }
        }

        trendingBiomarkers.push({
          name: group.biomarkerName,
          trend,
          changePercent,
        });
      }
    }

    return trendingBiomarkers;
  } catch (error) {
    console.error("Error getting trending biomarkers:", error);
    return [];
  }
}

function calculateDataCompleteness(data: {
  hasBloodTests: boolean;
  hasBodyComposition: boolean;
  hasFitnessData: boolean;
  biomarkerCount: number;
  hasRecentData: boolean;
}): number {
  let completeness = 0;

  // Base data types (60% of score)
  if (data.hasBloodTests) completeness += 25;
  if (data.hasBodyComposition) completeness += 20;
  if (data.hasFitnessData) completeness += 15;

  // Biomarker diversity (25% of score)
  if (data.biomarkerCount >= 10) completeness += 25;
  else if (data.biomarkerCount >= 5) completeness += 15;
  else if (data.biomarkerCount >= 1) completeness += 10;

  // Recent data (15% of score)
  if (data.hasRecentData) completeness += 15;

  return Math.min(completeness, 100);
}

async function calculateConsecutiveTrackingDays(
  userId: string
): Promise<number> {
  try {
    const uploads = await prisma.fileUpload.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (uploads.length === 0) return 0;

    const dates = uploads.map(
      (upload) => new Date(upload.createdAt).toISOString().split("T")[0]
    );

    const uniqueDates = [...new Set(dates)].sort().reverse();

    let consecutiveDays = 1;
    const today = new Date().toISOString().split("T")[0];

    if (uniqueDates[0] !== today) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(uniqueDates[0]).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 1) return 0; // No recent activity
    }

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const previousDate = new Date(uniqueDates[i]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  } catch (error) {
    console.error("Error calculating consecutive tracking days:", error);
    return 0;
  }
}

async function calculateRiskAssessments(userId: string) {
  try {
    // Get recent biomarkers for risk assessment
    const recentBiomarkers = await prisma.biomarkerValue.findMany({
      where: {
        userId,
        testDate: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 6 months
        },
      },
    });

    let cardiovascularRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
    let metabolicRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";

    // Cardiovascular risk factors
    const cholesterolMarkers = recentBiomarkers.filter(
      (m) =>
        m.biomarkerName.toLowerCase().includes("cholesterol") ||
        m.biomarkerName.toLowerCase().includes("ldl") ||
        m.biomarkerName.toLowerCase().includes("hdl") ||
        m.biomarkerName.toLowerCase().includes("triglyceride")
    );

    const abnormalCardioMarkers = cholesterolMarkers.filter(
      (m) => m.isAbnormal
    ).length;
    const totalCardioMarkers = cholesterolMarkers.length;

    if (totalCardioMarkers > 0) {
      const cardioRiskRatio = abnormalCardioMarkers / totalCardioMarkers;
      if (cardioRiskRatio >= 0.75) cardiovascularRisk = "CRITICAL";
      else if (cardioRiskRatio >= 0.5) cardiovascularRisk = "HIGH";
      else if (cardioRiskRatio >= 0.25) cardiovascularRisk = "MODERATE";
    }

    // Metabolic risk factors
    const metabolicMarkers = recentBiomarkers.filter(
      (m) =>
        m.biomarkerName.toLowerCase().includes("glucose") ||
        m.biomarkerName.toLowerCase().includes("insulin") ||
        m.biomarkerName.toLowerCase().includes("hba1c") ||
        m.biomarkerName.toLowerCase().includes("hemoglobin a1c")
    );

    const abnormalMetabolicMarkers = metabolicMarkers.filter(
      (m) => m.isAbnormal
    ).length;
    const totalMetabolicMarkers = metabolicMarkers.length;

    if (totalMetabolicMarkers > 0) {
      const metabolicRiskRatio =
        abnormalMetabolicMarkers / totalMetabolicMarkers;
      if (metabolicRiskRatio >= 0.75) metabolicRisk = "CRITICAL";
      else if (metabolicRiskRatio >= 0.5) metabolicRisk = "HIGH";
      else if (metabolicRiskRatio >= 0.25) metabolicRisk = "MODERATE";
    }

    // Overall risk is the higher of the two
    const risks = [cardiovascularRisk, metabolicRisk];
    const riskLevels = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
    const maxRiskLevel = Math.max(...risks.map((r) => riskLevels[r]));
    const overallRisk = Object.keys(riskLevels).find(
      (key) => riskLevels[key as keyof typeof riskLevels] === maxRiskLevel
    ) as "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

    return {
      cardiovascular: cardiovascularRisk,
      metabolic: metabolicRisk,
      overall: overallRisk,
    };
  } catch (error) {
    console.error("Error calculating risk assessments:", error);
    return {
      cardiovascular: "LOW" as const,
      metabolic: "LOW" as const,
      overall: "LOW" as const,
    };
  }
}

async function calculateHealthGoalsAchieved(
  userId: string,
  fitnessCount: number
): Promise<number> {
  try {
    let goalsAchieved = 0;

    // Goal 1: Upload at least one health document
    const hasUploads =
      (await prisma.fileUpload.count({ where: { userId } })) > 0;
    if (hasUploads) goalsAchieved++;

    // Goal 2: Have fitness activity data
    if (fitnessCount > 0) goalsAchieved++;

    // Goal 3: Have biomarker data
    const hasBiomarkers =
      (await prisma.biomarkerValue.count({ where: { userId } })) > 0;
    if (hasBiomarkers) goalsAchieved++;

    // Goal 4: Have recent data (within 30 days)
    const recentUpload = await prisma.fileUpload.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    if (recentUpload) goalsAchieved++;

    // Goal 5: Have comprehensive data (multiple types)
    const uploadTypes = await prisma.fileUpload.groupBy({
      by: ["uploadType"],
      where: { userId },
    });
    if (uploadTypes.length >= 2 || fitnessCount > 0) goalsAchieved++;

    return goalsAchieved;
  } catch (error) {
    console.error("Error calculating health goals:", error);
    return 0;
  }
}
