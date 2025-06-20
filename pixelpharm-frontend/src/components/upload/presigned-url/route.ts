import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "aws-amplify/auth/server";
import { S3UploadService } from "@/lib/aws/s3-upload";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const s3Service = new S3UploadService();
    const uploadUrl = await s3Service.generatePresignedUrl(
      fileName,
      fileType,
      user.sub
    );
    const fileKey = s3Service.getFileKey(user.sub, fileName);

    return NextResponse.json({
      uploadUrl,
      fileKey,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
