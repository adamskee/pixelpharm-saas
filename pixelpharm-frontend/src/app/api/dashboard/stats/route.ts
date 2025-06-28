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
    const totalUploads = await prisma.fileUpload.count({
      where: { userId },
    });

    const bloodTestUploads = await prisma.fileUpload.count({
      where: {
        userId,
        uploadType: "BLOOD_TESTS",
      },
    });

    const bodyCompositionUploads = await prisma.fileUpload.count({
      where: {
        userId,
        uploadType: "BODY_COMPOSITION",
      },
    });

    const fitnessActivityUploads = await prisma.fileUpload.count({
      where: {
        userId,
        uploadType: "FITNESS_ACTIVITIES",
      },
    });

    // Get biomarker count
    const biomarkersTracked = await prisma.biomarkerValue.count({
      where: { userId },
    });

    // Get AI analyses count
    const aiAnalysesRun = await prisma.aiProcessingResult.count({
      where: { userId },
    });

    // Get last upload date
    const lastUpload = await prisma.fileUpload.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const stats = {
      totalUploads,
      bloodTestUploads,
      bodyCompositionUploads,
      fitnessActivityUploads,
      biomarkersTracked,
      aiAnalysesRun,
      lastUploadDate: lastUpload?.createdAt?.toISOString() || null,
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
