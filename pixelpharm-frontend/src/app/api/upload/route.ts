import { NextRequest, NextResponse } from "next/server";
import { createUploadRecord } from "@/lib/database/uploads";
import { canUserUpload } from "@/lib/subscription/upload-limits";
import { UploadType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      fileKey,
      originalFilename,
      fileType,
      uploadType,
      fileSize,
    } = await request.json();

    console.log("📁 Tracking upload in database:", {
      userId,
      fileKey,
      uploadType,
    });

    if (!userId || !fileKey || !originalFilename) {
      return NextResponse.json(
        { error: "Missing required fields: userId, fileKey, originalFilename" },
        { status: 400 }
      );
    }

    // Check upload limits for blood tests
    if (uploadType === 'BLOOD_TESTS') {
      const canUpload = await canUserUpload(userId);
      if (!canUpload) {
        return NextResponse.json(
          { 
            error: "Upload limit exceeded. Please upgrade your plan or wait for limit reset.",
            code: "UPLOAD_LIMIT_EXCEEDED"
          },
          { status: 403 }
        );
      }
    }

    // Convert upload type to enum
    const uploadTypeEnum = uploadType
      .toUpperCase()
      .replace("-", "_") as UploadType;

    const uploadRecord = await createUploadRecord({
      userId,
      fileKey,
      originalFilename,
      fileType: fileType || "application/octet-stream",
      uploadType: uploadTypeEnum,
      fileSize: fileSize || 0,
    });

    console.log("✅ Upload tracked successfully:", uploadRecord.uploadId);

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord.uploadId,
      message: "Upload tracked successfully",
    });
  } catch (error) {
    console.error("❌ Failed to track upload:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to track upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
