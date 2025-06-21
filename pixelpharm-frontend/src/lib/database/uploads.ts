// src/lib/database/uploads.ts
// Upload tracking operations

import { prisma } from "./client";
import { UploadType, UploadStatus } from "@prisma/client";

export interface CreateUploadData {
  userId: string;
  fileKey: string;
  originalFilename: string;
  fileType: string;
  uploadType: UploadType;
  fileSize: number;
}

export interface UpdateUploadStatusData {
  uploadId: string;
  status: UploadStatus;
  errorMessage?: string;
}

// Create upload record when file is uploaded to S3
export async function createUploadRecord(data: CreateUploadData) {
  try {
    const upload = await prisma.fileUpload.create({
      data: {
        userId: data.userId,
        fileKey: data.fileKey,
        originalFilename: data.originalFilename,
        fileType: data.fileType,
        uploadType: data.uploadType,
        fileSize: BigInt(data.fileSize),
        uploadStatus: "UPLOADED",
      },
    });

    console.log("✅ Upload record created:", upload.uploadId);
    return upload;
  } catch (error) {
    console.error("❌ Failed to create upload record:", error);
    throw error;
  }
}

// Update upload status (processing, processed, failed)
export async function updateUploadStatus(data: UpdateUploadStatusData) {
  try {
    const upload = await prisma.fileUpload.update({
      where: { uploadId: data.uploadId },
      data: {
        uploadStatus: data.status,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Upload status updated:", upload.uploadId, data.status);
    return upload;
  } catch (error) {
    console.error("❌ Failed to update upload status:", error);
    throw error;
  }
}

// Get user's upload history
export async function getUserUploads(userId: string, limit = 20) {
  try {
    const uploads = await prisma.fileUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        aiProcessingResults: {
          select: {
            processingType: true,
            processingStatus: true,
            confidenceScore: true,
          },
        },
      },
    });

    return uploads;
  } catch (error) {
    console.error("❌ Failed to get user uploads:", error);
    throw error;
  }
}
