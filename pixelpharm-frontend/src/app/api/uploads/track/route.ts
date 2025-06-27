// File: src/app/api/uploads/track/route.ts

import { NextResponse } from "next/server";
import { createUploadRecord } from "@/lib/database/uploads";
import { prisma } from "@/lib/database/client";

export async function POST(request: Request) {
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

    // ENSURE USER EXISTS FIRST
    await prisma.user.upsert({
      where: { userId },
      update: {}, // Don't update if exists
      create: {
        userId,
        email: "user@example.com", // You'll need to get this from auth context
        firstName: "User",
        lastName: "Test",
      },
    });

    const uploadRecord = await createUploadRecord({
      userId,
      fileKey,
      originalFilename,
      fileType,
      uploadType,
      fileSize,
    });

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord.uploadId,
      message: "Upload tracked successfully",
    });
  } catch (error) {
    console.error("❌ Failed to track upload:", error);
    return NextResponse.json(
      {
        error: "Failed to track upload",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
