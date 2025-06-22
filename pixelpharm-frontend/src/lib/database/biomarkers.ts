// src/lib/database/biomarkers.ts
import { prisma } from "./client";

export async function getBiomarkersByUserId(userId: string) {
  try {
    return await prisma.biomarkerValue.findMany({
      where: { userId: userId },
      orderBy: { testDate: "desc" },
    });
  } catch (error) {
    console.error("Error fetching biomarkers:", error);
    throw error;
  }
}

export async function getRecentBiomarkers(userId: string, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await prisma.biomarkerValue.findMany({
      where: {
        userId: userId,
        testDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { testDate: "desc" },
    });
  } catch (error) {
    console.error("Error fetching recent biomarkers:", error);
    throw error;
  }
}

export async function getBiomarkerTrends(
  userId: string,
  biomarkerName: string
) {
  try {
    return await prisma.biomarkerValue.findMany({
      where: {
        userId: userId,
        biomarkerName: biomarkerName,
      },
      orderBy: { testDate: "asc" },
      take: 10, // Last 10 readings
    });
  } catch (error) {
    console.error("Error fetching biomarker trends:", error);
    throw error;
  }
}
