// File: src/app/api/ai/store-body-composition/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId, userId, bodyCompositionData } = await request.json();

    if (!uploadId || !userId || !bodyCompositionData) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: uploadId, userId, bodyCompositionData",
        },
        { status: 400 }
      );
    }

    console.log(`💾 Storing body composition data for user: ${userId}`);
    console.log(
      `📊 Body composition data:`,
      bodyCompositionData.bodyComposition
    );

    const composition = bodyCompositionData.bodyComposition || {};
    const processingInfo = bodyCompositionData.processingInfo || {};

    // Store body composition result
    const bodyCompositionResult = await prisma.bodyCompositionResult
      ?.create({
        data: {
          userId,
          uploadId,
          testDate: composition.testDate
            ? new Date(composition.testDate)
            : new Date(),
          totalWeight: composition.totalWeight
            ? Number(composition.totalWeight)
            : null,
          bodyFatPercentage: composition.bodyFatPercentage
            ? Number(composition.bodyFatPercentage)
            : null,
          skeletalMuscleMass: composition.skeletalMuscleMass
            ? Number(composition.skeletalMuscleMass)
            : null,
          visceralFatLevel: composition.visceralFatLevel
            ? Number(composition.visceralFatLevel)
            : null,
          bmr: composition.bmr ? Number(composition.bmr) : null,
          rawData: bodyCompositionData,
        },
      })
      .catch((error) => {
        console.error("Failed to store body composition result:", error);
        return null;
      });

    // Store AI processing result
    const aiResult = await prisma.aiProcessingResult
      ?.create({
        data: {
          uploadId,
          userId,
          processingType: "BODY_COMPOSITION",
          extractedData: bodyCompositionData,
          confidenceScore: bodyCompositionData.confidenceScore || 0.5,
          processingStatus: "COMPLETED",
        },
      })
      .catch((error) => {
        console.error("Failed to store AI processing result:", error);
        return null;
      });

    console.log(`✅ Body composition data stored successfully`);
    console.log(`📊 Stored metrics:`, {
      totalWeight: composition.totalWeight,
      bodyFatPercentage: composition.bodyFatPercentage,
      skeletalMuscleMass: composition.skeletalMuscleMass,
      bmr: composition.bmr,
    });

    return NextResponse.json({
      success: true,
      bodyCompositionResultId: bodyCompositionResult?.compositionId,
      aiResultId: aiResult?.resultId,
      metricsStored: Object.keys(composition).length,
      message: "Body composition data stored successfully",
      storedData: {
        totalWeight: composition.totalWeight,
        bodyFatPercentage: composition.bodyFatPercentage,
        skeletalMuscleMass: composition.skeletalMuscleMass,
        bmr: composition.bmr,
        visceralFatLevel: composition.visceralFatLevel,
      },
    });
  } catch (error: any) {
    console.error("❌ Error storing body composition data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to store body composition data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
