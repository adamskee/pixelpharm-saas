// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get basic upload statistics
    const totalUploads = await prisma.file_uploads.count({
      where: { user_id: userId },
    });

    const bloodTestUploads = await prisma.file_uploads.count({
      where: {
        user_id: userId,
        upload_type: "BLOOD_TESTS",
      },
    });

    const bodyCompositionUploads = await prisma.file_uploads.count({
      where: {
        user_id: userId,
        upload_type: "BODY_COMPOSITION",
      },
    });

    const fitnessActivityUploads = await prisma.file_uploads.count({
      where: {
        user_id: userId,
        upload_type: "FITNESS_ACTIVITIES",
      },
    });

    // Get biomarker count
    const biomarkersTracked = await prisma.biomarker_values.count({
      where: { user_id: userId },
    });

    // Get AI analyses count
    const aiAnalysesRun = await prisma.ai_processing_results.count({
      where: { user_id: userId },
    });

    // Get last upload date
    const lastUpload = await prisma.file_uploads.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });

    const stats = {
      totalUploads,
      bloodTestUploads,
      bodyCompositionUploads,
      fitnessActivityUploads,
      biomarkersTracked,
      aiAnalysesRun,
      lastUploadDate: lastUpload?.created_at?.toISOString() || null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
