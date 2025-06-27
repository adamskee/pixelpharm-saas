import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { cognitoSub, email, firstName, lastName } = userData;

    if (!cognitoSub || !email) {
      return NextResponse.json(
        { error: "Missing required user data" },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          cognitoSub,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { cognitoSub },
        data: {
          email,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 }
    );
  }
}
