// src/lib/database/ai-results.ts
// AI processing results storage

import { prisma } from "./client";
import { ProcessingType, ProcessingStatus } from "@prisma/client";

export interface StoreOCRResultsData {
  uploadId: string;
  userId: string;
  rawResults: any; // Full OCR response
  confidenceScore?: number;
  biomarkers?: any[];
  testInfo?: any;
}

export interface StoreBiomarkersData {
  userId: string;
  uploadId: string;
  resultId: string;
  biomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    referenceRange?: string;
    testDate: Date;
  }>;
}

// Store OCR processing results
export async function storeOCRResults(data: StoreOCRResultsData) {
  try {
    // Start a transaction to store both AI results and structured data
    const result = await prisma.$transaction(async (tx) => {
      // Store AI processing result
      const aiResult = await tx.aiProcessingResult.create({
        data: {
          uploadId: data.uploadId,
          userId: data.userId,
          processingType: "OCR",
          rawResults: data.rawResults,
          confidenceScore: data.confidenceScore || null,
          processingStatus: "COMPLETED",
          processedAt: new Date(),
        },
      });

      // If we have structured biomarker data, store blood test results
      if (data.biomarkers && data.biomarkers.length > 0) {
        // Parse test date safely
        let testDate = new Date(); // Default to today
        if (data.testInfo?.testDate) {
          const parsedDate = new Date(data.testInfo.testDate);
          if (!isNaN(parsedDate.getTime())) {
            testDate = parsedDate;
          }
        }

        const bloodTestResult = await tx.bloodTestResult.create({
          data: {
            userId: data.userId,
            uploadId: data.uploadId,
            testDate: testDate,
            labName: data.testInfo?.labName || null,
            biomarkers: data.biomarkers,
          },
        });

        // Store individual biomarker values for trend analysis
        const validBiomarkers: Array<{
          userId: string;
          resultId: string;
          biomarkerName: string;
          value: number;
          unit: string;
          referenceRange: string | null;
          isAbnormal: boolean;
          testDate: Date;
        }> = [];

        for (const biomarker of data.biomarkers) {
          const numericValue = parseFloat(biomarker.value);

          // Skip invalid biomarkers
          if (
            isNaN(numericValue) ||
            numericValue < 0 ||
            numericValue > 999999
          ) {
            console.warn(
              `Skipping invalid biomarker value: ${biomarker.name} = ${biomarker.value}`
            );
            continue;
          }

          validBiomarkers.push({
            userId: data.userId,
            resultId: bloodTestResult.resultId,
            biomarkerName: biomarker.name,
            value: numericValue,
            unit: biomarker.unit || "",
            referenceRange: biomarker.referenceRange || null,
            isAbnormal: false, // TODO: Calculate based on reference ranges
            testDate: testDate,
          });
        }

        // Only create biomarker values if we have valid ones
        if (validBiomarkers.length > 0) {
          await tx.biomarkerValue.createMany({
            data: validBiomarkers,
          });
        }

        return {
          aiResult,
          bloodTestResult,
          biomarkerCount: validBiomarkers.length,
        };
      }

      return { aiResult, bloodTestResult: null, biomarkerCount: 0 };
    });

    console.log("✅ OCR results stored:", {
      aiResultId: result.aiResult.processingId,
      bloodTestId: result.bloodTestResult?.resultId,
      biomarkerCount: result.biomarkerCount,
    });

    return result;
  } catch (error) {
    console.error("❌ Failed to store OCR results:", error);
    throw error;
  }
}

// Get user's biomarker trends
export async function getBiomarkerTrends(
  userId: string,
  biomarkerName?: string,
  months = 12
) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const where: any = {
      userId,
      testDate: { gte: startDate },
    };

    if (biomarkerName) {
      where.biomarkerName = biomarkerName;
    }

    const trends = await prisma.biomarkerValue.findMany({
      where,
      orderBy: { testDate: "asc" },
      include: {
        result: {
          select: {
            labName: true,
            testDate: true,
          },
        },
      },
    });

    return trends;
  } catch (error) {
    console.error("❌ Failed to get biomarker trends:", error);
    throw error;
  }
}
