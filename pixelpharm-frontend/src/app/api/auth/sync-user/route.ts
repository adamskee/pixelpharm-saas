// File: src/app/api/auth/sync-user/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    console.log("🔧 Syncing user with database:", userData);

    if (!userData.userId || !userData.email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { userId: userData.userId },
    });

    if (existingUser) {
      console.log("✅ User already exists:", existingUser.userId);

      // Update existing user with any new information
      const updatedUser = await prisma.user.update({
        where: { userId: userData.userId },
        data: {
          email: userData.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        action: "updated",
      });
    }

    // Create new user
    console.log("🔧 Creating new user in database...");

    const newUser = await prisma.user.create({
      data: {
        userId: userData.userId,
        email: userData.email,
        firstName: userData.firstName || userData.email.split("@")[0],
        lastName: userData.lastName || "User",
        cognitoSub: userData.cognitoSub || `demo-${userData.userId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ User created successfully:", newUser.userId);

    return NextResponse.json({
      success: true,
      user: newUser,
      action: "created",
    });
  } catch (error) {
    console.error("❌ Auth sync error:", error);

    // For demo purposes, don't fail on database errors
    const isDemoUser = request.url.includes("user-");

    if (isDemoUser) {
      console.log("🔧 Demo user sync failed, but continuing...");
      return NextResponse.json({
        success: true,
        user: null,
        action: "demo_fallback",
        warning: "Database sync failed but demo mode continues",
      });
    }

    return NextResponse.json(
      {
        error: "Failed to sync user with database",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
