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
        biomarkerValues: {
          orderBy: { testDate: "desc" },
          take: 50,
        },
        bodyCompositionResults: {
          orderBy: { testDate: "desc" },
          take: 10,
        },
        healthInsights: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        fileUploads: {
          orderBy: { createdAt: "desc" },
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
        updatedAt: new Date(),
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
    const whereClause: any = { userId };

    if (options?.biomarkerNames?.length) {
      whereClause.biomarkerName = {
        in: options.biomarkerNames,
      };
    }

    if (options?.dateFrom || options?.dateTo) {
      whereClause.testDate = {};
      if (options.dateFrom) {
        whereClause.testDate.gte = options.dateFrom;
      }
      if (options.dateTo) {
        whereClause.testDate.lte = options.dateTo;
      }
    }

    const biomarkers = await prisma.biomarkerValue.findMany({
      where: whereClause,
      orderBy: { testDate: "desc" },
      take: options?.limit || 100,
    });

    return biomarkers;
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
    const insight = await prisma.healthInsight.create({
      data: {
        userId,
        ...data,
      },
    });

    console.log("✅ Health insight created:", insight.insightId);
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
        prisma.biomarkerValue.count({
          where: { userId },
        }),
        prisma.biomarkerValue.count({
          where: { userId, isAbnormal: true },
        }),
        prisma.fileUpload.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.healthInsight.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return {
      biomarkerCount,
      abnormalCount,
      abnormalPercentage:
        biomarkerCount > 0 ? (abnormalCount / biomarkerCount) * 100 : 0,
      lastUploadDate: lastUpload?.createdAt,
      recentInsights,
      healthScore: Math.max(85 - abnormalCount * 5, 0), // Simple calculation
    };
  } catch (error) {
    console.error("Error fetching user health summary:", error);
    throw new Error("Failed to fetch health summary");
  }
}
