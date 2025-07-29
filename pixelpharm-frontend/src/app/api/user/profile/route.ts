import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import {
  updateUserProfile,
  getUserWithHealthData,
} from "@/lib/database/user-operations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithHealthData(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender?.toLowerCase(), // Convert enum to lowercase for frontend
      timezone: user.timezone,
      height: user.height ? parseFloat(user.height.toString()) : null,
      weight: user.weight ? parseFloat(user.weight.toString()) : null,
      bio: user.bio,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { firstName, lastName, dateOfBirth, gender, timezone, height, weight, bio } = data;

    console.log("🔄 Updating user profile:", {
      userId: session.user.id,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      timezone,
      height,
      weight,
      bio,
    });

    // Convert gender string to enum value
    const genderEnum = gender === "male" ? "MALE" : 
                     gender === "female" ? "FEMALE" : 
                     gender?.toUpperCase() === "MALE" ? "MALE" :
                     gender?.toUpperCase() === "FEMALE" ? "FEMALE" : 
                     undefined;

    const updatedUser = await updateUserProfile(session.user.id, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: genderEnum,
      timezone: timezone || undefined,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      bio: bio || undefined,
    });

    console.log("✅ User profile updated successfully:", updatedUser.userId);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        userId: updatedUser.userId,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        timezone: updatedUser.timezone,
        height: updatedUser.height ? parseFloat(updatedUser.height.toString()) : null,
        weight: updatedUser.weight ? parseFloat(updatedUser.weight.toString()) : null,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
