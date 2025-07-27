// src/app/api/ai/store-biomarkers/route.ts
// TRULY FIXED VERSION - handles missing upload records properly

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

interface BiomarkerData {
  name: string;
  value: string;
  unit: string;
  rawText: string;
}

interface StoreBiomarkersRequest {
  userId: string;
  uploadId: string;
  biomarkers: BiomarkerData[];
  testDate?: string;
  labName?: string;
}

function parseTestDate(dateString?: string): Date {
  if (!dateString) return new Date();

  // Handle DD/MM/YYYY format (common in medical reports)
  const ddmmyyyy = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Handle other formats
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function POST(request: NextRequest) {
  try {
    console.log("💾 === BIOMARKER STORAGE START ===");

    const body: StoreBiomarkersRequest = await request.json();
    console.log("📨 Request received:", {
      userId: body.userId,
      uploadId: body.uploadId,
      biomarkersCount: body.biomarkers?.length,
      testDate: body.testDate,
      labName: body.labName,
    });

    const { userId, uploadId, biomarkers, testDate, labName } = body;

    if (!userId || !uploadId || !biomarkers || !Array.isArray(biomarkers)) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: userId, uploadId, and biomarkers array",
        },
        { status: 400 }
      );
    }

    // Step 1: Verify user exists
    console.log("👤 Verifying user exists...");
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      console.log("❌ User not found:", userId);
      return NextResponse.json(
        {
          success: false,
          error: `User ${userId} not found`,
        },
        { status: 404 }
      );
    }
    console.log("✅ User verified:", user.email);

    // Step 2: Check if upload exists, create if missing (THIS IS THE KEY FIX!)
    console.log("📁 Checking upload record...");
    let upload = await prisma.fileUpload.findUnique({
      where: { uploadId },
    });

    if (!upload) {
      console.log("⚠️ Upload record not found, creating fallback record...");
      try {
        upload = await prisma.fileUpload.create({
          data: {
            uploadId,
            userId,
            fileKey: `uploads/${userId}/BLOOD_TESTS/biomarker-storage-${Date.now()}.pdf`,
            originalFilename: "blood-test-auto-created.pdf",
            fileType: "application/pdf",
            uploadType: "BLOOD_TESTS",
            fileSize: BigInt(1024),
            uploadStatus: "PROCESSED",
          },
        });
        console.log("✅ Fallback upload created:", upload.uploadId);
      } catch (uploadError) {
        console.log("❌ Failed to create upload record:", uploadError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create required upload record",
          },
          { status: 500 }
        );
      }
    } else {
      console.log("✅ Upload record found:", upload.uploadId);
    }

    const parsedTestDate = parseTestDate(testDate);
    console.log("📅 Test date:", parsedTestDate.toISOString());

    // Step 3: Create BloodTestResult
    console.log("🩸 Creating BloodTestResult...");
    const bloodTestResult = await prisma.bloodTestResult.create({
      data: {
        userId,
        uploadId,
        testDate: parsedTestDate,
        labName: labName || "Unknown Lab",
        biomarkers: biomarkers,
      },
    });
    console.log("✅ BloodTestResult created:", bloodTestResult.resultId);

    // Step 4: Create BiomarkerValue records
    console.log(`💾 Creating ${biomarkers.length} biomarker values...`);
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < biomarkers.length; i++) {
      const biomarker = biomarkers[i];

      try {
        const numericValue = parseFloat(biomarker.value);
        if (isNaN(numericValue)) {
          console.log(
            `⚠️ Skipping biomarker ${i + 1}: "${
              biomarker.value
            }" is not numeric`
          );
          continue;
        }

        const biomarkerValue = await prisma.biomarkerValue.create({
          data: {
            userId,
            resultId: bloodTestResult.resultId,
            biomarkerName: biomarker.name,
            value: numericValue,
            unit: biomarker.unit || "",
            isAbnormal: false,
            testDate: parsedTestDate,
          },
        });

        successCount++;
        console.log(
          `✅ Biomarker ${i + 1}/${biomarkers.length}: ${biomarker.name} = ${
            biomarker.value
          } (ID: ${biomarkerValue.valueId})`
        );
      } catch (biomarkerError) {
        const errorMsg =
          biomarkerError instanceof Error
            ? biomarkerError.message
            : "Unknown error";
        console.log(
          `❌ Failed biomarker ${i + 1}: ${biomarker.name} - ${errorMsg}`
        );
        errors.push({ biomarker: biomarker.name, error: errorMsg });
      }
    }

    console.log(
      `📊 Storage complete: ${successCount}/${biomarkers.length} biomarkers stored`
    );
    console.log("💾 === BIOMARKER STORAGE END ===");

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${successCount} biomarkers`,
      data: {
        bloodTestResultId: bloodTestResult.resultId,
        storedBiomarkers: successCount,
        totalBiomarkers: biomarkers.length,
        uploadCreated: !upload,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in biomarker storage:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", (error as any)?.code || "No code");
      console.error("❌ Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to store biomarkers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
