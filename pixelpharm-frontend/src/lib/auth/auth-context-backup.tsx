// File: src/lib/auth/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  cognitoSub?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem("pixelpharm-user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log("🔧 Restored user from storage:", userData);
        }
      } catch (error) {
        console.error("🔧 Error checking stored auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredAuth();
  }, []);

  // Generate consistent userId based on email
  const generateConsistentUserId = (email: string): string => {
    const emailHash = email.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `user-${emailHash}`;
  };

  const handleSignIn = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setLoading(true);
    try {
      if (email && password) {
        const consistentUserId = generateConsistentUserId(email);

        // Create user object with both userId and cognitoSub for compatibility
        const newUser = {
          userId: consistentUserId,
          cognitoSub: consistentUserId, // Use same ID for compatibility
          email: email,
          firstName: firstName || email.split("@")[0],
          lastName: lastName || "User",
        };

        setUser(newUser);
        localStorage.setItem("pixelpharm-user", JSON.stringify(newUser));
        console.log("🔧 User signed in with consistent ID:", newUser);

        // Sync user with database using correct format
        try {
          const response = await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cognitoSub: newUser.cognitoSub,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("🔧 User sync failed:", errorData);
            // Continue anyway for demo purposes
          } else {
            const syncData = await response.json();
            console.log("🔧 User synced with database:", syncData);
          }
        } catch (syncError) {
          console.error("🔧 User sync error:", syncError);
          // Continue anyway for demo purposes
        }
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("🔧 Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      setUser(null);
      localStorage.removeItem("pixelpharm-user");
      console.log("🔧 User signed out");
    } catch (error) {
      console.error("🔧 Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ===================================================================
// File: src/app/api/auth/sync-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { cognitoSub, email, firstName, lastName } = userData;

    console.log("🔧 Sync user request:", {
      cognitoSub,
      email,
      firstName,
      lastName,
    });

    if (!cognitoSub || !email) {
      return NextResponse.json(
        { error: "Missing required user data (cognitoSub and email required)" },
        { status: 400 }
      );
    }

    // Check if user exists by cognitoSub
    let user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      // Create new user with generated user_id
      const userId = cognitoSub; // Use cognitoSub as userId for consistency

      user = await prisma.user.create({
        data: {
          userId: userId,
          cognitoSub,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });
      console.log("🔧 Created new user:", user);
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
      console.log("🔧 Updated existing user:", user);
    }

    return NextResponse.json({
      success: true,
      user,
      message: user ? "User synced successfully" : "User created successfully",
    });
  } catch (error: any) {
    console.error("🔧 Error syncing user:", error);
    return NextResponse.json(
      {
        error: "Failed to sync user",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ===================================================================
// File: src/app/api/dashboard/comprehensive-stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching comprehensive stats for user: ${userId}`);

    // Check if user exists by userId first, then by cognitoSub
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: userId }, { cognitoSub: userId }],
      },
    });

    // If user doesn't exist, create a demo user
    if (!user) {
      console.log("🔧 Creating demo user record...");
      try {
        // Extract email from userId if it follows pattern user-emaildomain
        const email = userId.includes("@")
          ? userId
          : userId.replace("user-", "").replace(/([a-z])([A-Z])/g, "$1@$2") +
            "@demo.com";

        user = await prisma.user.create({
          data: {
            userId,
            cognitoSub: userId,
            email: email,
            firstName: "Demo",
            lastName: "User",
          },
        });
        console.log("✅ Demo user created:", user);
      } catch (createError) {
        console.error("❌ Failed to create demo user:", createError);
        // Return empty stats for demo purposes
        return NextResponse.json({
          totalUploads: 0,
          bloodTestUploads: 0,
          bodyCompositionUploads: 0,
          fitnessActivityUploads: 0,
          biomarkersTracked: 0,
          uniqueBiomarkers: 0,
          lastUploadDate: null,
          firstUploadDate: null,
          aiAnalysesRun: 0,
          healthInsightsGenerated: 0,
          abnormalValues: 0,
          criticalValues: 0,
          healthScore: 85,
          trendingBiomarkers: [],
          dataCompleteness: 0,
          lastAnalysisDate: null,
          consecutiveDaysTracked: 0,
          healthGoalsAchieved: 0,
          riskAssessments: {
            cardiovascular: "LOW",
            metabolic: "LOW",
            overall: "LOW",
          },
          message: "Demo user - upload your first blood test to see real data!",
        });
      }
    }

    // Fetch actual user data
    const [uploads, biomarkerResults, bodyComposition, healthAnalyses] =
      await Promise.all([
        prisma.fileUpload.findMany({
          where: { userId: user.userId },
          orderBy: { uploadedAt: "desc" },
        }),
        prisma.biomarkerResult.findMany({
          where: { userId: user.userId },
        }),
        prisma.bodyCompositionResult.findMany({
          where: { userId: user.userId },
        }),
        prisma.healthAnalysis.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Calculate comprehensive stats
    const bloodTestUploads = uploads.filter(
      (u) => u.fileType === "blood_test"
    ).length;
    const bodyCompositionUploads = uploads.filter(
      (u) => u.fileType === "body_composition"
    ).length;
    const fitnessActivityUploads = uploads.filter(
      (u) => u.fileType === "fitness_activity"
    ).length;

    const uniqueBiomarkers = new Set(
      biomarkerResults.map((b) => b.biomarkerName)
    ).size;
    const abnormalValues = biomarkerResults.filter(
      (b) => b.flagStatus === "HIGH" || b.flagStatus === "LOW"
    ).length;
    const criticalValues = biomarkerResults.filter(
      (b) => b.flagStatus === "CRITICAL_HIGH" || b.flagStatus === "CRITICAL_LOW"
    ).length;

    // Calculate health score (simplified)
    const baseScore = 85;
    const abnormalPenalty = Math.min(abnormalValues * 2, 20);
    const criticalPenalty = Math.min(criticalValues * 5, 30);
    const healthScore = Math.max(
      baseScore - abnormalPenalty - criticalPenalty,
      0
    );

    // Build trending biomarkers
    const trendingBiomarkers = biomarkerResults.slice(0, 5).map((b) => ({
      name: b.biomarkerName,
      trend:
        b.flagStatus === "NORMAL"
          ? ("stable" as const)
          : ("concerning" as const),
      changePercent: Math.random() * 10 - 5, // Mock data
    }));

    const stats = {
      totalUploads: uploads.length,
      bloodTestUploads,
      bodyCompositionUploads,
      fitnessActivityUploads,
      biomarkersTracked: biomarkerResults.length,
      uniqueBiomarkers,
      lastUploadDate:
        uploads.length > 0 ? uploads[0].uploadedAt.toISOString() : null,
      firstUploadDate:
        uploads.length > 0
          ? uploads[uploads.length - 1].uploadedAt.toISOString()
          : null,
      aiAnalysesRun: healthAnalyses.length,
      healthInsightsGenerated: healthAnalyses.length,
      abnormalValues,
      criticalValues,
      healthScore,
      trendingBiomarkers,
      dataCompleteness: uploads.length > 0 ? 85 : 0,
      lastAnalysisDate:
        healthAnalyses.length > 0
          ? healthAnalyses[0].createdAt.toISOString()
          : null,
      consecutiveDaysTracked: uploads.length,
      healthGoalsAchieved: Math.floor(uploads.length / 2),
      riskAssessments: {
        cardiovascular:
          criticalValues > 0 ? "HIGH" : abnormalValues > 5 ? "MODERATE" : "LOW",
        metabolic:
          criticalValues > 0 ? "HIGH" : abnormalValues > 3 ? "MODERATE" : "LOW",
        overall:
          criticalValues > 0 ? "HIGH" : abnormalValues > 4 ? "MODERATE" : "LOW",
      },
    };

    console.log("📊 Comprehensive stats calculated:", stats);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("❌ Error fetching comprehensive stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
