// src/app/api/test/database/route.ts
// Test database connection and basic operations

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...");

    // Test 1: Basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test 2: Check if tables exist
    const userCount = await prisma.user.count();
    const uploadCount = await prisma.fileUpload.count();

    console.log("📊 Database stats:", { userCount, uploadCount });

    // Test 3: Create a test user (if none exist)
    let testUser = null;
    if (userCount === 0) {
      testUser = await prisma.user.create({
        data: {
          email: "test@pixelpharm.com",
          firstName: "Test",
          lastName: "User",
          cognitoSub: "test-cognito-123",
        },
      });
      console.log("✅ Test user created:", testUser.userId);
    } else {
      testUser = await prisma.user.findFirst();
      console.log("✅ Found existing user:", testUser?.userId);
    }

    // Test 4: Test biomarker reference data
    const biomarkerRefCount = await prisma.biomarkerReference.count();
    console.log("📋 Biomarker references:", biomarkerRefCount);

    // Test 5: Database version and info
    const result = (await prisma.$queryRaw`SELECT version()`) as any[];
    const dbVersion = result[0]?.version || "Unknown";

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        version: dbVersion,
        tables: {
          users: userCount,
          uploads: uploadCount,
          biomarkerReferences: biomarkerRefCount,
        },
      },
      testUser: testUser
        ? {
            userId: testUser.userId,
            email: testUser.email,
            createdAt: testUser.createdAt,
          }
        : null,
      message: "Database is ready for PixelPharm operations!",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        troubleshooting: {
          checkDocker: "Run: docker-compose ps",
          checkEnv: "Verify DATABASE_URL in .env.local",
          checkPrisma: "Run: npx prisma db push",
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
