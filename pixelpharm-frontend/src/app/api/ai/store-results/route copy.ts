// src/app/api/ai/store-results/route.ts
// Store AI processing results in database

import { NextRequest, NextResponse } from "next/server";
import { storeOCRResults } from "@/lib/database/ai-results";
import { updateUploadStatus } from "@/lib/database/uploads";

export async function POST(request: NextRequest) {
  try {
    const { uploadId, userId, ocrResults } = await request.json();

    console.log("💾 Storing AI results in database:", { uploadId, userId });

    if (!uploadId || !userId || !ocrResults) {
      return NextResponse.json(
        { error: "Missing required fields: uploadId, userId, ocrResults" },
        { status: 400 }
      );
    }

    // Store OCR results and structured biomarker data
    const storedResult = await storeOCRResults({
      uploadId,
      userId,
      rawResults: ocrResults,
      confidenceScore: ocrResults.confidence === "high" ? 0.9 : 0.7,
      biomarkers: ocrResults.biomarkers || [],
      testInfo: ocrResults.testInfo || {},
    });

    // Update upload status to processed
    await updateUploadStatus({
      uploadId,
      status: "PROCESSED",
    });

    console.log("✅ AI results stored successfully:", {
      aiResultId: storedResult.aiResult.processingId,
      biomarkerCount: storedResult.biomarkerCount,
    });

    return NextResponse.json({
      success: true,
      aiResultId: storedResult.aiResult.processingId,
      bloodTestId: storedResult.bloodTestResult?.resultId,
      biomarkerCount: storedResult.biomarkerCount,
      message: "AI results stored successfully",
    });
  } catch (error) {
    console.error("❌ Failed to store AI results:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to store AI results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
