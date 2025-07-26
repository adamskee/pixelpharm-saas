// File: src/app/api/uploads/track/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      userId,
      fileKey,
      uploadType,
      originalFilename,
      fileType,
      fileSize,
    } = await request.json();

    console.log("📁 Tracking upload in database:", {
      userId,
      fileKey,
      uploadType,
      originalFilename,
    });

    if (!userId || !fileKey || !uploadType) {
      return NextResponse.json(
        { error: "Missing required fields: userId, fileKey, uploadType" },
        { status: 400 }
      );
    }

    // Extract original filename from fileKey if not provided
    const filename =
      originalFilename || fileKey.split("/").pop() || "unknown-file";

    const uploadRecord = await prisma.fileUpload.create({
      data: {
        userId,
        fileKey,
        uploadType: uploadType as any, // Cast to match your UploadType enum
        originalFilename: filename,
        fileType: fileType || "application/octet-stream",
        fileSize: BigInt(fileSize || 0),
        uploadStatus: "UPLOADED",
      },
    });

    console.log("✅ Upload tracked successfully:", uploadRecord.uploadId);

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord.uploadId,
      message: "Upload tracked successfully",
    });
  } catch (error) {
    console.error("❌ Upload tracking failed:", error);

    return NextResponse.json({
      success: true,
      warning: "File uploaded but tracking failed",
      error: error.message,
    });
  }
}
