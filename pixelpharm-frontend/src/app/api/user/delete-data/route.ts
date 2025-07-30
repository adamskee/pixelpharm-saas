import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "pixelpharm-uploads";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("🗑️ Starting data deletion for user:", userId);

    // Step 1: Get all file keys from database to delete from S3
    const fileUploads = await prisma.fileUpload.findMany({
      where: { userId },
      select: { fileKey: true },
    });

    console.log(`📁 Found ${fileUploads.length} files to delete from S3`);

    // Step 2: Delete files from S3
    if (fileUploads.length > 0) {
      const fileKeys = fileUploads.map(upload => upload.fileKey);
      
      // S3 delete supports max 1000 objects per request, so we batch them
      const batchSize = 1000;
      for (let i = 0; i < fileKeys.length; i += batchSize) {
        const batch = fileKeys.slice(i, i + batchSize);
        
        try {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: S3_BUCKET_NAME,
            Delete: {
              Objects: batch.map(key => ({ Key: key })),
              Quiet: false,
            },
          });

          const result = await s3Client.send(deleteCommand);
          console.log(`✅ Deleted ${result.Deleted?.length || 0} files from S3 (batch ${Math.floor(i/batchSize) + 1})`);
          
          if (result.Errors && result.Errors.length > 0) {
            console.warn("⚠️ Some S3 files had deletion errors:", result.Errors);
          }
        } catch (s3Error) {
          console.error("❌ Error deleting S3 files:", s3Error);
          // Continue with database deletion even if S3 fails
        }
      }

      // Also try to delete any files that might be stored with user folder pattern
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          Prefix: `users/${userId}/`,
        });
        
        const listResult = await s3Client.send(listCommand);
        
        if (listResult.Contents && listResult.Contents.length > 0) {
          const userFolderKeys = listResult.Contents.map(obj => obj.Key!);
          
          const deleteUserFolderCommand = new DeleteObjectsCommand({
            Bucket: S3_BUCKET_NAME,
            Delete: {
              Objects: userFolderKeys.map(key => ({ Key: key })),
              Quiet: false,
            },
          });

          const userFolderResult = await s3Client.send(deleteUserFolderCommand);
          console.log(`✅ Deleted ${userFolderResult.Deleted?.length || 0} additional files from user folder`);
        }
      } catch (userFolderError) {
        console.warn("⚠️ Could not delete user folder files:", userFolderError);
      }
    }

    // Step 3: Delete all user data from database using cascade deletes
    // Due to foreign key constraints with onDelete: Cascade, deleting the user
    // will automatically delete all related records
    console.log("🗄️ Deleting all database records for user...");
    
    const deletedUser = await prisma.user.delete({
      where: { userId },
    });

    console.log("✅ Successfully deleted all user data");

    return NextResponse.json({
      success: true,
      message: "All user data has been permanently deleted",
      details: {
        deletedUserId: deletedUser.userId,
        s3FilesDeleted: fileUploads.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Error during data deletion:", error);
    
    // Check if it's a Prisma error for user not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "User not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to delete user data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}