// src/app/api/upload/presigned-url/route.ts
// FIXED VERSION - Remove all optional parameters causing signature issues

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, uploadType } = await request.json();

    console.log("🔍 API: Generating pre-signed URL for:", {
      fileName,
      fileType,
      uploadType,
    });

    // Create a clean file key
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `uploads/test-user-123/${uploadType}/${timestamp}-${cleanFileName}`;

    console.log("📁 API: File key:", fileKey);

    // Create the S3 command with MINIMAL parameters
    // Remove ALL optional parameters that cause signature issues
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      ContentType: fileType,
      // REMOVED ALL OF THESE - they cause signature mismatches:
      // - ServerSideEncryption
      // - Metadata
      // - ChecksumAlgorithm
      // - Any other optional parameters
    });

    console.log("🔧 API: S3 command created with minimal parameters");

    // Generate pre-signed URL with shorter expiration
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes instead of 1 hour
    });

    console.log("✅ API: Pre-signed URL generated successfully");
    console.log("🔗 API: URL domain:", new URL(uploadUrl).hostname);

    // Log the signed headers for debugging
    const urlParams = new URL(uploadUrl).searchParams;
    const signedHeaders = urlParams.get("X-Amz-SignedHeaders");
    console.log("📝 API: Signed headers:", signedHeaders);

    return NextResponse.json({
      uploadUrl,
      fileKey,
    });
  } catch (error) {
    console.error("❌ API: Pre-signed URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
