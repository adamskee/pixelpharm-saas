// File: src/app/api/debug/user-data/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // Get all distinct userIds that have biomarker data
    const allUserIds = await prisma.biomarkerValue.findMany({
      select: { userId: true },
      distinct: ["userId"],
      orderBy: { createdAt: "desc" },
    });

    // Get biomarker count for the specific user
    let userBiomarkers = 0;
    let userBiomarkerData = [];

    if (userId) {
      userBiomarkers = await prisma.biomarkerValue.count({
        where: { userId },
      });

      userBiomarkerData = await prisma.biomarkerValue.findMany({
        where: { userId },
        select: {
          biomarkerName: true,
          value: true,
          unit: true,
          testDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }

    // Get total biomarker count
    const totalBiomarkers = await prisma.biomarkerValue.count();

    // Get recent uploads
    const recentUploads = await prisma.fileUpload.findMany({
      select: {
        uploadId: true,
        userId: true,
        originalFilename: true,
        uploadType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      requestedUserId: userId,
      userBiomarkerCount: userBiomarkers,
      userBiomarkerSample: userBiomarkerData,
      allUserIdsWithData: allUserIds.map((u) => u.userId),
      totalBiomarkersInDB: totalBiomarkers,
      recentUploads,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
