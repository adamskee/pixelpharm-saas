// src/app/api/test/biomarker-storage/route.ts
// FIXED DIAGNOSTIC API - Creates required upload record first

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 === DIAGNOSTIC BIOMARKER STORAGE TEST ===");

    const body = await request.json();
    console.log("📨 Received request body:", JSON.stringify(body, null, 2));

    const { userId, uploadId, biomarkers } = body;

    // Step 1: Test database connection
    console.log("🔌 Testing database connection...");
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful:", dbTest);

    // Step 2: Check if user exists
    console.log("👤 Checking user existence...");
    const user = await prisma.user.findUnique({
      where: { userId },
    });
    console.log("👤 User found:", user ? `✅ ${user.email}` : "❌ Not found");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `User ${userId} not found. Please ensure user exists in database.`,
          results: { databaseConnection: true, userExists: false },
        },
        { status: 404 }
      );
    }

    // Step 3: Create a valid FileUpload record first (this was missing!)
    console.log("📁 Creating FileUpload record...");
    const testUploadId = `test-upload-${Date.now()}`;

    const fileUpload = await prisma.fileUpload.create({
      data: {
        uploadId: testUploadId,
        userId: userId,
        fileKey: `test/diagnostic-test-${Date.now()}.pdf`,
        originalFilename: "diagnostic-test.pdf",
        fileType: "application/pdf",
        uploadType: "BLOOD_TESTS",
        fileSize: BigInt(1024), // 1KB
        uploadStatus: "PROCESSED",
      },
    });
    console.log("✅ FileUpload created:", fileUpload.uploadId);

    // Step 4: Test BloodTestResult creation with valid uploadId
    console.log("🩸 Testing BloodTestResult creation...");

    const testResult = await prisma.bloodTestResult.create({
      data: {
        userId: userId,
        uploadId: testUploadId, // Use the valid uploadId we just created
        testDate: new Date("2024-02-23"),
        labName: "Test Lab",
        biomarkers: biomarkers || [
          { name: "Test", value: "100", unit: "mg/dL" },
        ],
      },
    });
    console.log(
      "✅ BloodTestResult created successfully:",
      testResult.resultId
    );

    // Step 5: Test BiomarkerValue creation
    console.log("💾 Testing BiomarkerValue creation...");

    const testBiomarker = await prisma.biomarkerValue.create({
      data: {
        userId: userId,
        resultId: testResult.resultId,
        biomarkerName: "Test Biomarker",
        value: 100.5,
        unit: "mg/dL",
        isAbnormal: false,
        testDate: new Date("2024-02-23"),
      },
    });
    console.log(
      "✅ BiomarkerValue created successfully:",
      testBiomarker.valueId
    );

    // Step 6: Test querying the data (like dashboard would)
    console.log("📊 Testing data retrieval...");
    const userWithData = await prisma.user.findUnique({
      where: { userId },
      include: {
        biomarkerValues: { take: 5, orderBy: { createdAt: "desc" } },
        bloodTestResults: { take: 3, orderBy: { createdAt: "desc" } },
        fileUploads: { take: 3, orderBy: { createdAt: "desc" } },
      },
    });

    console.log("📊 Data retrieval results:", {
      biomarkerValues: userWithData?.biomarkerValues.length || 0,
      bloodTestResults: userWithData?.bloodTestResults.length || 0,
      fileUploads: userWithData?.fileUploads.length || 0,
    });

    // Step 7: Cleanup test data
    console.log("🧹 Cleaning up test data...");
    await prisma.biomarkerValue.delete({
      where: { valueId: testBiomarker.valueId },
    });
    console.log("✅ Deleted test biomarker value");

    await prisma.bloodTestResult.delete({
      where: { resultId: testResult.resultId },
    });
    console.log("✅ Deleted test blood test result");

    await prisma.fileUpload.delete({
      where: { uploadId: testUploadId },
    });
    console.log("✅ Deleted test file upload");

    console.log("✅ Cleanup completed");
    console.log("🎉 === ALL DIAGNOSTIC TESTS PASSED ===");

    return NextResponse.json({
      success: true,
      message:
        "All diagnostic tests passed - biomarker storage is working correctly!",
      results: {
        databaseConnection: true,
        userExists: true,
        fileUploadCreation: true,
        bloodTestResultCreation: true,
        biomarkerValueCreation: true,
        dataRetrieval: true,
        cleanup: true,
      },
      dataFound: {
        biomarkerValues: userWithData?.biomarkerValues.length || 0,
        bloodTestResults: userWithData?.bloodTestResults.length || 0,
        fileUploads: userWithData?.fileUploads.length || 0,
      },
    });
  } catch (error) {
    console.error("❌ DIAGNOSTIC TEST FAILED:", error);
    console.error("❌ Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code || "No error code",
      meta: (error as any)?.meta || "No meta info",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        errorCode: (error as any)?.code || null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Biomarker Storage Diagnostic API - FIXED VERSION",
    usage:
      "POST with { userId, uploadId, biomarkers } to test storage functionality",
    note: "This version creates required FileUpload records to satisfy foreign key constraints",
  });
}
