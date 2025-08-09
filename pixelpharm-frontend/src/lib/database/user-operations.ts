import { prisma } from "./client";
import { User } from "@prisma/client";

export interface CreateUserData {
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE";
  timezone?: string;
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE";
  timezone?: string;
  height?: number;
  weight?: number;
  bio?: string;
}

// Get user with all health data
export async function getUserWithHealthData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        biomarker_values: {
          orderBy: { test_date: "desc" },
          take: 50,
        },
        body_composition_results: {
          orderBy: { test_date: "desc" },
          take: 10,
        },
        health_insights: {
          orderBy: { created_at: "desc" },
          take: 20,
        },
        file_uploads: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user with health data:", error);
    throw new Error("Failed to fetch user data");
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    console.log("✅ User profile updated:", userId);
    return updatedUser;
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error; // Re-throw the original error to preserve error details
  }
}

// Get user biomarkers with filters
export async function getUserBiomarkers(
  userId: string,
  options?: {
    limit?: number;
    biomarkerNames?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  try {
    const whereClause: any = { user_id: userId };

    if (options?.biomarkerNames?.length) {
      whereClause.biomarker_name = {
        in: options.biomarkerNames,
      };
    }

    if (options?.dateFrom || options?.dateTo) {
      whereClause.test_date = {};
      if (options.dateFrom) {
        whereClause.test_date.gte = options.dateFrom;
      }
      if (options.dateTo) {
        whereClause.test_date.lte = options.dateTo;
      }
    }

    const biomarkers = await prisma.biomarker_values.findMany({
      where: whereClause,
      orderBy: { test_date: "desc" },
      take: options?.limit || 100,
    });

    // Transform snake_case field names to camelCase for frontend compatibility
    const transformedBiomarkers = biomarkers.map(biomarker => ({
      valueId: biomarker.value_id,
      userId: biomarker.user_id,
      resultId: biomarker.result_id,
      biomarkerName: biomarker.biomarker_name || 'Unknown Biomarker', // Safety fallback
      value: biomarker.value,
      unit: biomarker.unit || '', // Safety fallback
      referenceRange: biomarker.reference_range || 'N/A', // Safety fallback
      isAbnormal: biomarker.is_abnormal || false, // Safety fallback
      testDate: biomarker.test_date,
      createdAt: biomarker.created_at,
    }));

    return transformedBiomarkers;
  } catch (error) {
    console.error("Error fetching user biomarkers:", error);
    throw new Error("Failed to fetch biomarkers");
  }
}

// Create health insight
export async function createHealthInsight(
  userId: string,
  data: {
    insightType:
      | "TREND_ANALYSIS"
      | "RISK_ASSESSMENT"
      | "RECOMMENDATION"
      | "ALERT";
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dataSources?: any;
    aiConfidence?: number;
  }
) {
  try {
    const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const insight = await prisma.health_insights.create({
      data: {
        insight_id: insightId,
        user_id: userId,
        insight_type: data.insightType,
        title: data.title,
        description: data.description,
        priority: data.priority,
        data_sources: data.dataSources || null,
        ai_confidence: data.aiConfidence || null,
      },
    });

    console.log("✅ Health insight created:", insight.insight_id);
    return insight;
  } catch (error) {
    console.error("Error creating health insight:", error);
    throw new Error("Failed to create health insight");
  }
}

// Get user health summary
export async function getUserHealthSummary(userId: string) {
  try {
    const [biomarkerCount, abnormalCount, lastUpload, recentInsights] =
      await Promise.all([
        prisma.biomarker_values.count({
          where: { user_id: userId },
        }),
        prisma.biomarker_values.count({
          where: { user_id: userId, is_abnormal: true },
        }),
        prisma.file_uploads.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        }),
        prisma.health_insights.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          take: 5,
        }),
      ]);

    return {
      biomarkerCount,
      abnormalCount,
      abnormalPercentage:
        biomarkerCount > 0 ? (abnormalCount / biomarkerCount) * 100 : 0,
      lastUploadDate: lastUpload?.created_at,
      recentInsights,
      healthScore: Math.max(85 - abnormalCount * 5, 0), // Simple calculation
    };
  } catch (error) {
    console.error("Error fetching user health summary:", error);
    throw new Error("Failed to fetch health summary");
  }
}
