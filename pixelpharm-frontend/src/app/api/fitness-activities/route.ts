// src/app/api/fitness-activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

interface GarminActivity {
  activityType: string;
  date: string;
  favoriteRun?: boolean;
  title: string;
  distance?: number;
  calories?: number;
  time?: string;
  avgHr?: number;
  maxHr?: number;
  aerobicTe?: number;
  avgRunCadence?: number;
  maxRunCadence?: number;
  avgPace?: string;
  bestPace?: string;
  totalAscent?: number;
  totalDescent?: number;
  avgStrideLength?: number;
  avgVerticalRatio?: number;
  avgVerticalOscillation?: number;
  avgGroundContactTime?: number;
  trainingStressScore?: number;
  gritScore?: number;
  flowScore?: number;
  climbTime?: string;
  bottomTime?: string;
  minTemp?: number;
  surface?: string;
  devTemp?: number;
  minElevation?: number;
  maxElevation?: number;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, activities } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: "Activities array is required" },
        { status: 400 }
      );
    }

    console.log(
      `Processing ${activities.length} activities for user ${userId}`
    );

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update file upload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId,
        fileKey: `garmin-activities-${Date.now()}.csv`,
        originalFilename: "Activities.csv",
        fileType: "text/csv",
        uploadType: "FITNESS_ACTIVITIES",
        fileSize: BigInt(activities.length * 100), // Estimated size
        uploadStatus: "PROCESSED",
      },
    });

    console.log(`Created file upload record: ${fileUpload.uploadId}`);

    // Process and save activities
    const savedActivities = [];

    for (const activity of activities) {
      try {
        // Parse date
        const activityDate = new Date(activity.date);

        // Convert time string to minutes if it exists
        let durationMinutes = null;
        if (activity.time) {
          const timeParts = activity.time.split(":");
          if (timeParts.length >= 2) {
            durationMinutes =
              parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            if (timeParts.length === 3) {
              durationMinutes += Math.round(parseInt(timeParts[2]) / 60);
            }
          }
        }

        // Convert pace to minutes per mile/km if it exists
        let avgPaceSeconds = null;
        if (activity.avgPace) {
          const paceParts = activity.avgPace.split(":");
          if (paceParts.length === 2) {
            avgPaceSeconds =
              parseInt(paceParts[0]) * 60 + parseInt(paceParts[1]);
          }
        }

        const fitnessActivity = await prisma.fitnessActivity.create({
          data: {
            userId,
            uploadId: fileUpload.uploadId,
            activityName:
              activity.title || activity.activityType || "Untitled Activity",
            activityType: activity.activityType || "Unknown",
            startTime: activityDate,
            endTime: durationMinutes
              ? new Date(activityDate.getTime() + durationMinutes * 60000)
              : null,
            duration: durationMinutes,
            distance: activity.distance
              ? parseFloat(activity.distance.toString())
              : null,
            calories: activity.calories
              ? parseInt(activity.calories.toString())
              : null,
            avgHeartRate: activity.avgHr
              ? parseInt(activity.avgHr.toString())
              : null,
            maxHeartRate: activity.maxHr
              ? parseInt(activity.maxHr.toString())
              : null,
            avgPace: avgPaceSeconds,
            elevation: activity.totalAscent
              ? parseFloat(activity.totalAscent.toString())
              : null,
            rawData: activity, // Store the full activity data as JSON
          },
        });

        savedActivities.push(fitnessActivity);
      } catch (activityError) {
        console.error("Error saving individual activity:", activityError);
        console.error("Activity data:", activity);
        // Continue processing other activities
      }
    }

    console.log(`Successfully saved ${savedActivities.length} activities`);

    // Update file upload status
    await prisma.fileUpload.update({
      where: { uploadId: fileUpload.uploadId },
      data: {
        uploadStatus: savedActivities.length > 0 ? "PROCESSED" : "FAILED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${savedActivities.length} activities saved successfully`,
      uploadId: fileUpload.uploadId,
      activitiesProcessed: savedActivities.length,
      activitiesReceived: activities.length,
      activities: savedActivities.map((a) => ({
        id: a.activityId,
        name: a.activityName,
        type: a.activityType,
        date: a.startTime,
        distance: a.distance,
        calories: a.calories,
      })),
    });
  } catch (error) {
    console.error("Error saving fitness activities:", error);
    return NextResponse.json(
      {
        error: "Failed to save activities to database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    // Get all fitness activities for the user
    const activities = await prisma.fitnessActivity.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      include: {
        upload: {
          select: {
            originalFilename: true,
            createdAt: true,
          },
        },
      },
    });

    // Get activity summary
    const summary = {
      totalActivities: activities.length,
      totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
      totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
      avgHeartRate:
        activities.filter((a) => a.avgHeartRate).length > 0
          ? Math.round(
              activities.reduce((sum, a) => sum + (a.avgHeartRate || 0), 0) /
                activities.filter((a) => a.avgHeartRate).length
            )
          : null,
      activityTypes: [...new Set(activities.map((a) => a.activityType))],
      dateRange:
        activities.length > 0
          ? {
              earliest: activities[activities.length - 1]?.startTime,
              latest: activities[0]?.startTime,
            }
          : null,
    };

    return NextResponse.json({
      activities,
      summary,
    });
  } catch (error) {
    console.error("Error fetching fitness activities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch fitness activities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
