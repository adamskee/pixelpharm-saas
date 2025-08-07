// src/app/api/ai/store-results/route.ts
// FIXED VERSION - Matches your exact Prisma schema

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Store-Results API called");

    const {
      userId,
      uploadId,
      fileKey,
      biomarkers,
      testInfo,
      uploadType = "BLOOD_TESTS",
      originalFormat,
      confidence,
    } = await request.json();

    console.log("📦 Received data:", {
      userId,
      uploadId,
      fileKey,
      biomarkersCount: biomarkers?.length,
      uploadType,
      originalFormat,
    });

    // Validate required fields
    if (!userId || !uploadId || !biomarkers || !Array.isArray(biomarkers)) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            userId: !!userId,
            uploadId: !!uploadId,
            biomarkers: !!biomarkers,
          },
        },
        { status: 400 }
      );
    }

    // Step 1: Ensure user exists
    console.log("👤 Ensuring user exists...");
    try {
      await prisma.user.upsert({
        where: { userId },
        update: {
          // Increment uploads used for existing users
          uploadsUsed: {
            increment: 1
          }
        },
        create: {
          userId,
          email: `user-${userId}@temp.com`, // Temporary email
          provider: "google",
          planType: "FREE", // Default to FREE plan
          uploadsUsed: 1, // First upload
          upgradePromptShown: false,
        },
      });
      console.log("✅ User ensured");
    } catch (userError) {
      console.error("❌ User upsert failed:", userError);
      // If the new plan fields don't exist yet, try without them
      console.log("⚠️ Retrying user upsert without plan fields...");
      try {
        await prisma.user.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            email: `user-${userId}@temp.com`,
            provider: "google",
          },
        });
        console.log("✅ User ensured (fallback)");
      } catch (fallbackError) {
        console.error("❌ User upsert fallback failed:", fallbackError);
        throw fallbackError;
      }
    }

    // Step 2: Parse test date
    let testDate = new Date();
    if (testInfo?.testDate) {
      try {
        // Handle different date formats from OCR
        const dateStr = testInfo.testDate;
        if (dateStr.includes("/")) {
          // Handle DD/MM/YYYY or MM/DD/YYYY format
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            // Assume DD/MM/YYYY (Australian format based on your lab)
            testDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          testDate = new Date(dateStr);
        }
        console.log("📅 Parsed test date:", testDate);
      } catch (error) {
        console.log("⚠️ Could not parse test date, using current date");
        testDate = new Date();
      }
    }

    // Step 3: Handle FileUpload record
    console.log("📁 Handling FileUpload...");
    let fileUpload;

    try {
      // Try to find existing FileUpload by uploadId
      fileUpload = await prisma.fileUpload.findUnique({
        where: { uploadId },
      });

      if (!fileUpload) {
        console.log("📁 Creating new FileUpload record...");
        // Create new FileUpload record
        fileUpload = await prisma.fileUpload.create({
          data: {
            uploadId,
            userId,
            fileKey,
            originalFilename: fileKey.split("/").pop() || "unknown",
            fileType: originalFormat || "application/pdf",
            uploadType: "BLOOD_TESTS",
            fileSize: BigInt(0), // We don't have file size here
            uploadStatus: "PROCESSED",
          },
        });
        console.log("✅ Created FileUpload:", fileUpload.uploadId);
      } else {
        console.log("✅ Using existing FileUpload:", fileUpload.uploadId);
      }
    } catch (error) {
      console.error("❌ FileUpload error:", error);
      return NextResponse.json(
        {
          error: "Failed to create/find file upload record",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Step 4: Create BloodTestResult
    console.log("🩸 Creating BloodTestResult...");
    let bloodTestResult;

    try {
      bloodTestResult = await prisma.bloodTestResult.create({
        data: {
          userId,
          uploadId,
          testDate,
          labName: testInfo?.labName || null,
          biomarkers: biomarkers, // Store as JSON
        },
      });
      console.log("✅ BloodTestResult created:", bloodTestResult.resultId);
    } catch (error) {
      console.error("❌ BloodTestResult creation failed:", error);
      return NextResponse.json(
        { error: "Failed to create blood test result", details: error.message },
        { status: 500 }
      );
    }

    // Step 5: Create individual BiomarkerValue records
    console.log("💾 Creating BiomarkerValues...");
    const biomarkerIds = [];
    let successCount = 0;

    for (let i = 0; i < biomarkers.length; i++) {
      const biomarker = biomarkers[i];

      try {
        console.log(`🧬 Processing biomarker ${i + 1}:`, {
          name: biomarker.name,
          value: biomarker.value,
          unit: biomarker.unit,
        });

        // Validate biomarker data
        if (
          !biomarker.name ||
          biomarker.value === undefined ||
          biomarker.value === null
        ) {
          console.log(
            `⚠️ Skipping invalid biomarker ${i + 1}: missing name or value`
          );
          continue;
        }

        // Convert value to number
        let numericValue;
        if (typeof biomarker.value === "string") {
          // Remove any non-numeric characters except decimal point
          const cleanValue = biomarker.value.replace(/[^0-9.-]/g, "");
          numericValue = parseFloat(cleanValue);
        } else {
          numericValue = Number(biomarker.value);
        }

        if (isNaN(numericValue)) {
          console.log(
            `⚠️ Skipping biomarker ${i + 1}: invalid numeric value '${
              biomarker.value
            }'`
          );
          continue;
        }

        // Simple abnormal detection
        const isAbnormal =
          biomarker.status === "high" ||
          biomarker.status === "low" ||
          biomarker.status === "critical" ||
          biomarker.status === "H" ||
          biomarker.status === "L";

        const biomarkerValue = await prisma.biomarkerValue.create({
          data: {
            userId,
            resultId: bloodTestResult.resultId,
            biomarkerName: biomarker.name,
            value: numericValue,
            unit: biomarker.unit || "",
            referenceRange:
              biomarker.normalRange || biomarker.referenceRange || null,
            isAbnormal: isAbnormal,
            testDate,
          },
        });

        biomarkerIds.push(biomarkerValue.valueId);
        successCount++;
        console.log(`✅ Stored biomarker ${i + 1}:`, biomarkerValue.valueId);
      } catch (error) {
        console.error(`❌ Failed to store biomarker ${i + 1}:`, error);
        // Continue with other biomarkers even if one fails
      }
    }

    console.log(
      `🎉 Successfully stored ${successCount}/${biomarkers.length} biomarkers`
    );

    // Step 6: Create AI Processing Result record
    try {
      await prisma.aiProcessingResult.create({
        data: {
          uploadId,
          userId,
          processingType: "OCR",
          rawResults: {
            biomarkers,
            testInfo,
            confidence,
            extractedText: testInfo?.extractedText || "",
          },
          confidenceScore:
            confidence === "high" ? 0.95 : confidence === "medium" ? 0.75 : 0.5,
          processingStatus: "COMPLETED",
          processedAt: new Date(),
        },
      });
      console.log("✅ AI Processing Result created");
    } catch (error) {
      console.log("⚠️ AI Processing Result creation failed:", error.message);
      // Don't fail the whole operation for this
    }

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${successCount} biomarkers`,
      biomarkersStored: successCount,
      biomarkerIds,
      bloodTestResultId: bloodTestResult.resultId,
      fileUploadId: fileUpload.uploadId,
    });
  } catch (error) {
    console.error("❌ Store-Results API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
