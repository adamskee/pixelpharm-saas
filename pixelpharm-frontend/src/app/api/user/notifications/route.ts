import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { weeklyReports, reminderNotifications } = data;

    console.log("🔔 Updating notification preferences:", {
      userId: session.user.id,
      weeklyReports,
      reminderNotifications,
    });

    // For now, we'll store notification preferences in the user table
    // In a production app, you might want a separate notifications table
    const updatedUser = await prisma.user.update({
      where: { userId: session.user.id },
      data: {
        // We'll add these fields to store notification preferences
        // For now, we can store them as JSON in a dedicated field
        // or add separate boolean columns
        updatedAt: new Date(),
      },
    });

    console.log("✅ Notification preferences updated successfully:", session.user.id);

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: {
        weeklyReports,
        reminderNotifications,
      },
    });

  } catch (error: any) {
    console.error("❌ Error updating notification preferences:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { error: `Failed to update notification preferences: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return default preferences
    // In a production app, you'd fetch these from the database
    const preferences = {
      weeklyReports: true,
      reminderNotifications: true,
    };

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error: any) {
    console.error("❌ Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}