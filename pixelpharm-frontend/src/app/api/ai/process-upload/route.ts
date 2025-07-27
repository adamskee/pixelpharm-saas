// src/app/api/ai/process-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function POST(request: NextRequest) {
  try {
    const { uploadId, userId, fileKey, uploadType } = await request.json();

    console.log("🤖 Starting AI processing for upload:", {
      uploadId,
      userId,
      fileKey,
      uploadType,
    });

    if (!uploadId || !userId || !fileKey || !uploadType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create initial AI processing record
    const aiProcessingRecord = await prisma.aiProcessingResult.create({
      data: {
        uploadId,
        userId,
        processingType: "OCR",
        rawResults: {},
        processingStatus: "PENDING",
      },
    });

    console.log(
      "📋 Created AI processing record:",
      aiProcessingRecord.processingId
    );

    let processingResult;

    try {
      if (uploadType === "BLOOD_TESTS") {
        // Process blood test with OCR
        console.log("🩸 Processing blood test with OCR...");

        const ocrResponse = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/ai/extract-text`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, uploadType }),
          }
        );

        if (!ocrResponse.ok) {
          throw new Error(`OCR failed: ${ocrResponse.statusText}`);
        }

        const ocrData = await ocrResponse.json();
        console.log(
          `🧬 OCR found ${ocrData.biomarkers?.length || 0} biomarkers`
        );

        // Store biomarkers if found
        if (ocrData.biomarkers && ocrData.biomarkers.length > 0) {
          await storeBiomarkers(userId, uploadId, ocrData);
        }

        processingResult = ocrData;
      } else if (uploadType === "BODY_COMPOSITION") {
        // Process body composition scan
        console.log("💪 Processing body composition scan...");

        const bodyCompResponse = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/ai/extract-body-composition`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, userId }),
          }
        );

        if (!bodyCompResponse.ok) {
          throw new Error(
            `Body composition processing failed: ${bodyCompResponse.statusText}`
          );
        }

        const bodyCompData = await bodyCompResponse.json();
        console.log("💪 Body composition processed successfully");

        processingResult = bodyCompData;
      } else {
        throw new Error(`Unsupported upload type: ${uploadType}`);
      }

      // Update processing record with results
      await prisma.aiProcessingResult.update({
        where: { processingId: aiProcessingRecord.processingId },
        data: {
          rawResults: processingResult,
          processingStatus: "COMPLETED",
          processedAt: new Date(),
        },
      });

      console.log("✅ AI processing completed successfully");

      return NextResponse.json({
        success: true,
        processingId: aiProcessingRecord.processingId,
        result: processingResult,
        message: "AI processing completed successfully",
      });
    } catch (processingError) {
      console.error("❌ AI processing failed:", processingError);

      // Update processing record with error
      await prisma.aiProcessingResult.update({
        where: { processingId: aiProcessingRecord.processingId },
        data: {
          processingStatus: "FAILED",
          errorMessage: processingError.message,
          processedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          processingId: aiProcessingRecord.processingId,
          error: processingError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ AI processing trigger failed:", error);
    return NextResponse.json(
      { error: "AI processing trigger failed", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to store biomarkers
async function storeBiomarkers(userId: string, uploadId: string, ocrData: any) {
  try {
    // Create blood test result record
    const bloodTestResult = await prisma.bloodTestResult.create({
      data: {
        userId,
        uploadId,
        testDate: ocrData.testInfo?.testDate
          ? new Date(ocrData.testInfo.testDate)
          : new Date(),
        labName: ocrData.testInfo?.labName || null,
        biomarkers: ocrData.biomarkers,
      },
    });

    console.log("🩸 Created blood test result:", bloodTestResult.resultId);

    // Store individual biomarker values
    const validBiomarkers = ocrData.biomarkers
      .filter((b: any) => b.value && !isNaN(parseFloat(b.value)))
      .map((b: any) => ({
        userId,
        resultId: bloodTestResult.resultId,
        biomarkerName: b.name,
        value: parseFloat(b.value),
        unit: b.unit || "",
        referenceRange: b.referenceRange || null,
        isAbnormal: false, // TODO: Calculate based on reference ranges
        testDate: bloodTestResult.testDate,
      }));

    if (validBiomarkers.length > 0) {
      await prisma.biomarkerValue.createMany({
        data: validBiomarkers,
      });
      console.log(`📊 Stored ${validBiomarkers.length} biomarker values`);
    }

    return bloodTestResult;
  } catch (error) {
    console.error("❌ Failed to store biomarkers:", error);
    throw error;
  }
}
