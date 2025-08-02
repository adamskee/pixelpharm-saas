// src/app/api/upload/presigned-url/route.ts
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
    const { fileName, fileType, uploadType, userId } = await request.json();

    // Debug environment variables
    console.log("🔍 API: Environment variables check:");
    console.log("- AWS_S3_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);
    console.log("- Type of AWS_S3_BUCKET_NAME:", typeof process.env.AWS_S3_BUCKET_NAME);
    console.log("- Length:", process.env.AWS_S3_BUCKET_NAME?.length);

    console.log("🔍 API: Generating pre-signed URL for:", {
      fileName,
      fileType,
      uploadType,
      userId,
    });

    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `uploads/${userId || "anonymous"}/${
      uploadType || "general"
    }/${timestamp}-${cleanFileName}`;

    console.log("📁 API: File key:", fileKey);

    // Clean and validate bucket name
    let bucketName = process.env.AWS_S3_BUCKET_NAME || 'pixelpharm-uploads-prod';
    
    // Handle cases where the environment variable might have extra characters
    if (bucketName.includes('=')) {
      // If the bucket name contains =, take the part after the last =
      bucketName = bucketName.split('=').pop() || 'pixelpharm-uploads-prod';
    }
    
    // Clean any potential encoding or whitespace issues
    bucketName = bucketName.trim().replace(/[^a-z0-9.-]/g, '');
    
    console.log("🪣 API: Using bucket name:", bucketName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    console.log("🔧 API: S3 command created with minimal parameters");

    // Generate pre-signed URL
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    console.log("✅ API: Pre-signed URL generated successfully");
    console.log("🔗 API: URL domain:", new URL(uploadUrl).hostname);

    // Log the signed headers for debugging
    const urlParams = new URL(uploadUrl).searchParams;
    const signedHeaders = urlParams.get("X-Amz-SignedHeaders");
    console.log("📝 API: Signed headers:", signedHeaders);

    // Generate upload ID
    const uploadId = `upload_${timestamp}_${userId || "anonymous"}`;

    return NextResponse.json({
      uploadUrl,
      fileKey,
      uploadId,
    });
  } catch (error) {
    console.error("❌ API: Pre-signed URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
