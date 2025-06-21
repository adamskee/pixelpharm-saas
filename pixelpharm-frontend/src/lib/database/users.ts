// src/lib/database/users.ts
// User profile operations

import { prisma } from "./client";

export interface CreateUserData {
  cognitoSub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE";
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE";
  timezone?: string;
}

// Create user profile (called after Cognito signup)
export async function createUserProfile(data: CreateUserData) {
  try {
    const user = await prisma.user.create({
      data: {
        cognitoSub: data.cognitoSub,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
      },
    });

    console.log("✅ User profile created:", user.userId);
    return user;
  } catch (error) {
    console.error("❌ Failed to create user profile:", error);
    throw error;
  }
}

// Get user by Cognito ID
export async function getUserByCognitoSub(cognitoSub: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
      include: {
        _count: {
          select: {
            fileUploads: true,
            bloodTestResults: true,
            biomarkerValues: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("❌ Failed to get user by Cognito sub:", error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData
) {
  try {
    const user = await prisma.user.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    console.log("✅ User profile updated:", user.userId);
    return user;
  } catch (error) {
    console.error("❌ Failed to update user profile:", error);
    throw error;
  }
}

// Get user's health summary
export async function getUserHealthSummary(userId: string) {
  try {
    const summary = await prisma.user.findUnique({
      where: { userId },
      include: {
        bloodTestResults: {
          orderBy: { testDate: "desc" },
          take: 5,
        },
        biomarkerValues: {
          orderBy: { testDate: "desc" },
          take: 10,
        },
        bodyCompositionResults: {
          orderBy: { testDate: "desc" },
          take: 5,
        },
        fitnessActivities: {
          orderBy: { activityDate: "desc" },
          take: 10,
        },
        healthInsights: {
          where: { isRead: false },
          orderBy: { priority: "desc" },
          take: 5,
        },
        _count: {
          select: {
            fileUploads: true,
            bloodTestResults: true,
            biomarkerValues: true,
          },
        },
      },
    });

    return summary;
  } catch (error) {
    console.error("❌ Failed to get user health summary:", error);
    throw error;
  }
}
