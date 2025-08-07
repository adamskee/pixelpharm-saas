// src/app/api/ai/store-results/route.ts
// FIXED VERSION - Matches your exact Prisma schema

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Store-Results API called");
    console.log("🔍 Request method:", request.method);
    console.log("🔍 Request headers:", Object.fromEntries(request.headers.entries()));

    let body;
    try {
      body = await request.json();
      console.log("✅ JSON parsing successful");
    } catch (jsonError) {
      console.error("❌ JSON parsing failed:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body", details: jsonError.message },
        { status: 400 }
      );
    }
    const {
      userId,
      uploadId,
      fileKey,
      biomarkers,
      testInfo,
      uploadType = "BLOOD_TESTS",
      originalFormat,
      confidence,
    } = body;

    console.log("📦 Received full request body:", JSON.stringify(body, null, 2));
    console.log("📦 Parsed data:", {
      userId,
      uploadId,
      fileKey,
      biomarkersCount: biomarkers?.length,
      uploadType,
      originalFormat,
      testInfo: testInfo ? Object.keys(testInfo) : null,
      biomarkersPreview: biomarkers?.slice(0, 2)
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
    
    // Always try the fallback approach first since production DB doesn't have new plan fields
    try {
      // Check if user already exists first
      const existingUser = await prisma.user.findUnique({
        where: { userId },
      });

      if (existingUser) {
        console.log("✅ User already exists, no need to create");
      } else {
        // Create user without any plan fields
        await prisma.user.create({
          data: {
            userId,
            email: `user-${userId}@temp.com`,
            provider: "google",
          },
        });
        console.log("✅ User created (using fallback - no plan fields)");
      }
    } catch (fallbackError) {
      console.error("❌ Fallback user creation failed:", fallbackError);
      console.log("⚠️ This should not happen - user creation without plan fields failed");
      console.log("⚠️ Possible database connectivity or permission issue");
      throw fallbackError;
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
      console.log("📁 Searching for existing FileUpload with uploadId:", uploadId);
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
    console.log("🩸 BloodTestResult data:", {
      userId,
      uploadId,
      testDate,
      labName: testInfo?.labName || null,
      biomarkersCount: biomarkers.length
    });
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
    console.log("💾 About to create", biomarkers.length, "biomarker records");
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
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Log additional Prisma-specific error details
    if (error.code) {
      console.error("❌ Prisma error code:", error.code);
    }
    if (error.meta) {
      console.error("❌ Prisma error meta:", error.meta);
    }
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        errorName: error.name,
        prismaCode: error.code || null,
        prismaMeta: error.meta || null,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
