import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  console.log("=== Pre-signed URL API called ===");

  try {
    // Check environment variables first
    console.log("Environment check:");
    console.log(
      "- AWS_S3_BUCKET_NAME:",
      process.env.AWS_S3_BUCKET_NAME ? "Set" : "Missing"
    );
    console.log(
      "- AWS_ACCESS_KEY_ID:",
      process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing"
    );
    console.log(
      "- AWS_SECRET_ACCESS_KEY:",
      process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Missing"
    );
    console.log(
      "- NEXT_PUBLIC_AWS_REGION:",
      process.env.NEXT_PUBLIC_AWS_REGION
    );

    // For now, let's skip authentication to test S3 upload
    // We'll add proper auth back later
    const userId = "test-user-" + Date.now();
    console.log("Using test user ID:", userId);

    const body = await request.json();
    console.log("Request body:", body);

    const { fileName, fileType, uploadType = "blood-tests" } = body;

    if (!fileName || !fileType) {
      console.log("❌ Missing fileName or fileType");
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    console.log("Creating S3 client...");
    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const timestamp = Date.now();
    const fileKey = `uploads/${userId}/${uploadType}/${timestamp}-${fileName}`;
    console.log("File key:", fileKey);

    console.log("Creating PutObjectCommand...");
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      ContentType: fileType,
      // vServerSideEncryption: "AES256",
      // Metadata: {
        // userId: userId,
        // uploadType: uploadType,
        // originalFileName: fileName,
      },
    });

    console.log("Generating pre-signed URL...");
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    console.log("✅ Pre-signed URL generated successfully");

    return NextResponse.json({
      uploadUrl,
      fileKey,
      message: "Pre-signed URL generated successfully",
    });
  } catch (error) {
    console.error("❌ Error in presigned URL API:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
