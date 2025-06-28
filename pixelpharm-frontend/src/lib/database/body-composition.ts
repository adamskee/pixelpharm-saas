import { prisma } from "./client";

export interface BodyCompositionData {
  compositionId: string;
  userId: string;
  testDate: Date;
  totalWeight: number | null;
  bodyFatPercentage: number | null;
  skeletalMuscleMass: number | null;
  visceralFatLevel: number | null;
  bmr: number | null;
  rawData: any;
}

export async function getBodyCompositionByUserId(
  userId: string
): Promise<BodyCompositionData[]> {
  try {
    const results = await prisma.bodyCompositionResult.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
    });

    return results.map((result) => ({
      compositionId: result.compositionId,
      userId: result.userId,
      testDate: result.testDate,
      totalWeight: result.totalWeight ? Number(result.totalWeight) : null,
      bodyFatPercentage: result.bodyFatPercentage
        ? Number(result.bodyFatPercentage)
        : null,
      skeletalMuscleMass: result.skeletalMuscleMass
        ? Number(result.skeletalMuscleMass)
        : null,
      visceralFatLevel: result.visceralFatLevel,
      bmr: result.bmr,
      rawData: result.rawData,
    }));
  } catch (error) {
    console.error("Error fetching body composition data:", error);
    throw error;
  }
}

export async function getLatestBodyComposition(
  userId: string
): Promise<BodyCompositionData | null> {
  try {
    const result = await prisma.bodyCompositionResult.findFirst({
      where: { userId },
      orderBy: { testDate: "desc" },
    });

    if (!result) return null;

    return {
      compositionId: result.compositionId,
      userId: result.userId,
      testDate: result.testDate,
      totalWeight: result.totalWeight ? Number(result.totalWeight) : null,
      bodyFatPercentage: result.bodyFatPercentage
        ? Number(result.bodyFatPercentage)
        : null,
      skeletalMuscleMass: result.skeletalMuscleMass
        ? Number(result.skeletalMuscleMass)
        : null,
      visceralFatLevel: result.visceralFatLevel,
      bmr: result.bmr,
      rawData: result.rawData,
    };
  } catch (error) {
    console.error("Error fetching latest body composition:", error);
    throw error;
  }
}
