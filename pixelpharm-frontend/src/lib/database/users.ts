// src/lib/database/users.ts
import { prisma } from "./client";

export async function getUserProfile(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { userId: userId },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

export async function getUserHealthSummary(userId: string) {
  // Placeholder implementation - replace with your actual logic
  return {
    totalBiomarkers: 0,
    lastTestDate: null,
    riskLevel: "UNKNOWN" as const,
  };
}

export async function createUser(userData: {
  cognitoSub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
}) {
  try {
    return await prisma.user.create({
      data: userData,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
  }
) {
  try {
    return await prisma.user.update({
      where: { userId: userId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}
