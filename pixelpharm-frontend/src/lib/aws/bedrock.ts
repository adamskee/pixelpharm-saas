// File: src/lib/aws/bedrock.ts
// FIXED VERSION - Throttling Handling & Correct Fitness Table Query

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";
import { prisma } from "@/lib/database/client";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || "us-east-1",
  credentials: fromEnv(),
});

export interface HealthAnalysisRequest {
  biomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
    testDate: string;
  }>;
  bodyComposition?: {
    testDate: string;
    totalWeight?: number;
    bodyFatPercentage?: number;
    skeletalMuscleMass?: number;
    visceralFatLevel?: number;
    bmr?: number;
  };
  fitnessActivities?: {
    recentActivities: Array<{
      activityType: string;
      date: string;
      duration: number; // minutes
      distance?: number; // km
      calories: number;
      avgHeartRate?: number;
      maxHeartRate?: number;
      trainingStressScore?: number;
    }>;
    weeklyStats: {
      totalActivities: number;
      totalDuration: number; // minutes
      totalCalories: number;
      totalDistance: number; // km
      avgHeartRate: number;
      activeDays: number;
    };
    monthlyTrends: {
      totalActivities: number;
      avgWeeklyDuration: number;
      mostCommonActivity: string;
      fitnessProgress: "improving" | "stable" | "declining";
    };
  };
  userProfile: {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
  };
  analysisType:
    | "comprehensive"
    | "risk_assessment"
    | "recommendations"
    | "trends";
}

export interface HealthAnalysisResponse {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  keyFindings: string[];
  recommendations: Array<{
    category: string;
    priority: string;
    recommendation: string;
    reasoning: string;
    title?: string;
    description?: string;
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: string;
  }>;
  trends: Array<{
    biomarker: string;
    trend: string;
    timeframe: string;
  }>;
  fitnessInsights?: {
    activityCorrelations: Array<{
      biomarker: string;
      correlation: string;
      insight: string;
    }>;
    cardioFitnessScore: number;
    recoveryAssessment: string;
    trainingRecommendations: string[];
  };
  summary: string;
  confidence?: number;
  lastAnalysisDate?: Date;
  dataCompleteness?: number;
  trendAnalysis?: any[];
  alerts?: any[];
}

export class BedrockHealthAnalyzer {
  private async invokeModel(prompt: string): Promise<string> {
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        // Check environment variables
        const modelId = process.env.BEDROCK_MODEL_ID;
        if (!modelId) {
          throw new Error("BEDROCK_MODEL_ID environment variable is not set");
        }

        console.log(
          `🔍 Bedrock invoke attempt ${retryCount + 1}/${maxRetries}`
        );

        const command = new InvokeModelCommand({
          modelId: modelId,
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 3000, // Reduced from 4000 to help with throttling
            temperature: 0.1,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
          contentType: "application/json",
          accept: "application/json",
        });

        console.log("📡 Sending command to Bedrock...");
        const response = await client.send(command);

        console.log("✅ Bedrock response received successfully");
        const responseBody = JSON.parse(
          new TextDecoder().decode(response.body)
        );
        return responseBody.content[0].text;
      } catch (error: any) {
        console.error(
          `❌ Bedrock invocation error (attempt ${retryCount + 1}):`,
          {
            name: error.name,
            message: error.message,
            code: error.code || error.$metadata?.httpStatusCode,
          }
        );

        // Handle throttling specifically
        if (
          error.name === "ThrottlingException" ||
          error.message?.includes("Too many requests")
        ) {
          retryCount++;
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(
              `⏳ Throttling detected. Waiting ${delay}ms before retry ${
                retryCount + 1
              }/${maxRetries}...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(
              "Bedrock API rate limit exceeded. Please wait a few minutes before trying again."
            );
          }
        }

        // Handle other specific errors
        if (error.name === "UnrecognizedClientException") {
          throw new Error(
            "AWS credentials are invalid. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
          );
        }

        if (error.name === "AccessDeniedException") {
          throw new Error(
            "AWS credentials don't have permission to invoke Bedrock models. Please add 'bedrock:InvokeModel' permission."
          );
        }

        if (error.message?.includes("ValidationException")) {
          throw new Error(
            `Invalid model ID or request format. Current model: ${process.env.BEDROCK_MODEL_ID}`
          );
        }

        throw new Error(`Bedrock API error: ${error.message}`);
      }
    }

    throw new Error("Max retries exceeded for Bedrock API");
  }

  private buildAnalysisPrompt(request: HealthAnalysisRequest): string {
    const {
      biomarkers,
      bodyComposition,
      fitnessActivities,
      userProfile,
      analysisType,
    } = request;

    // Simplified prompt to reduce token usage and avoid throttling
    const systemPrompt = `# AI Health Analysis

You are an AI health professional analyzing patient data. Provide evidence-based insights.

## Analysis Framework
Analyze laboratory biomarkers${bodyComposition ? ", body composition" : ""}${
      fitnessActivities ? ", and fitness activities" : ""
    } together for comprehensive health assessment.

${
  fitnessActivities
    ? `## Key Correlations
- Cardiovascular: Heart rate data vs lipid panels vs exercise capacity
- Metabolic: Glucose/HbA1c vs exercise frequency vs body composition  
- Recovery: Training load vs inflammatory markers (CRP, etc.)`
    : ""
}`;

    // Build user context
    const userContext = `
## Patient Profile
- Age: ${userProfile.age || "Unknown"}
- Gender: ${userProfile.gender || "Unknown"}`;

    // Build biomarker data (simplified)
    const biomarkerData =
      biomarkers.length > 0
        ? `
## Laboratory Results (${biomarkers.length} biomarkers)
${biomarkers
  .slice(0, 10)
  .map((b) => `- ${b.name}: ${b.value} ${b.unit} ${b.isAbnormal ? "⚠️" : "✓"}`)
  .join("\n")}${
            biomarkers.length > 10
              ? `\n... and ${biomarkers.length - 10} more biomarkers`
              : ""
          }`
        : "\n## Laboratory Results: No data available";

    // Build body composition data (simplified)
    const bodyCompositionData = bodyComposition
      ? `
## Body Composition
- Weight: ${bodyComposition.totalWeight || "N/A"} kg, Body Fat: ${
          bodyComposition.bodyFatPercentage || "N/A"
        }%
- Muscle Mass: ${bodyComposition.skeletalMuscleMass || "N/A"} kg, BMR: ${
          bodyComposition.bmr || "N/A"
        } cal/day`
      : "";

    // Build fitness activity data (simplified)
    const fitnessData = fitnessActivities
      ? `
## Fitness Activities
- Weekly: ${
          fitnessActivities.weeklyStats.totalActivities
        } activities, ${Math.round(
          fitnessActivities.weeklyStats.totalDuration / 60
        )} hours
- Calories: ${fitnessActivities.weeklyStats.totalCalories}/week, Avg HR: ${
          fitnessActivities.weeklyStats.avgHeartRate
        } bpm
- Main Activity: ${
          fitnessActivities.monthlyTrends.mostCommonActivity
        }, Trend: ${fitnessActivities.monthlyTrends.fitnessProgress}`
      : "";

    // Simplified prompt to avoid parsing issues
    const analysisInstructions = `

## Analysis Instructions

You are a medical AI assistant providing comprehensive health analysis. Based on the provided biomarker data, body composition, and fitness information, generate a JSON response with the following structure:

Expected JSON format:
- healthScore: number between 0-100
- riskLevel: one of "LOW", "MODERATE", "HIGH", "CRITICAL" 
- keyFindings: array of key finding strings
- recommendations: array of objects with category, priority, recommendation, reasoning
- abnormalValues: array of objects with biomarker, value, concern, urgency
- trends: array of objects with biomarker, trend, timeframe
- summary: comprehensive summary string

Provide evidence-based medical insights with clinical correlations and actionable recommendations.`;

    return `${systemPrompt}${userContext}${biomarkerData}${bodyCompositionData}${fitnessData}${analysisInstructions}`;
  }

  private async fetchFitnessData(userId: string) {
    try {
      console.log(`🔍 Fetching fitness data for user: ${userId}`);

      // Fetch recent fitness activities (last 30 days)
      // FIXED: Use correct Prisma model name and field mapping
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentActivities = await prisma.fitnessActivity.findMany({
        where: {
          userId,
          startTime: {
            // FIXED: Use startTime instead of activityDate
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          startTime: "desc", // FIXED: Use startTime
        },
        take: 20,
      });

      console.log(`📊 Found ${recentActivities.length} fitness activities`);

      if (recentActivities.length === 0) {
        console.log("📊 No fitness activities found for user:", userId);
        return null;
      }

      // Calculate weekly stats (last 7 days)
      const weeklyActivities = recentActivities.filter(
        (activity) => activity.startTime >= sevenDaysAgo
      );

      const weeklyStats = {
        totalActivities: weeklyActivities.length,
        totalDuration: weeklyActivities.reduce(
          (sum, activity) => sum + (activity.durationMinutes || 0),
          0
        ),
        totalCalories: weeklyActivities.reduce(
          (sum, activity) => sum + (activity.calories || 0),
          0
        ), // FIXED: Use calories field
        totalDistance: weeklyActivities.reduce(
          (sum, activity) =>
            sum +
            (activity.distanceKm
              ? parseFloat(activity.distanceKm.toString())
              : 0),
          0
        ), // FIXED: Handle Decimal type
        avgHeartRate:
          weeklyActivities.length > 0
            ? weeklyActivities
                .filter((a) => a.avgHeartRate && a.avgHeartRate > 0)
                .reduce((sum, a) => sum + (a.avgHeartRate || 0), 0) /
                weeklyActivities.filter(
                  (a) => a.avgHeartRate && a.avgHeartRate > 0
                ).length || 0
            : 0,
        activeDays: new Set(
          weeklyActivities.map((a) => a.startTime.toISOString().split("T")[0])
        ).size,
      };

      // Calculate monthly trends
      const activityTypes = recentActivities
        .map((a) => a.activityType)
        .filter(Boolean);
      const mostCommonActivity =
        activityTypes.length > 0
          ? activityTypes.reduce((a, b, i, arr) =>
              arr.filter((v) => v === a).length >=
              arr.filter((v) => v === b).length
                ? a
                : b
            )
          : "Mixed Activities";

      const monthlyTrends = {
        totalActivities: recentActivities.length,
        avgWeeklyDuration: weeklyStats.totalDuration * (30 / 7),
        mostCommonActivity,
        fitnessProgress: "stable" as "improving" | "stable" | "declining",
      };

      // Format recent activities for analysis
      const formattedActivities = recentActivities
        .slice(0, 10)
        .map((activity) => ({
          activityType: activity.activityType || "Unknown",
          date: activity.startTime.toISOString(),
          duration: activity.durationMinutes || 0,
          distance: activity.distanceKm
            ? parseFloat(activity.distanceKm.toString())
            : undefined,
          calories: activity.calories || 0,
          avgHeartRate: activity.avgHeartRate || undefined,
          maxHeartRate: activity.maxHeartRate || undefined,
          trainingStressScore: activity.trainingStressScore || undefined,
        }));

      console.log(`✅ Fitness data processed:`, {
        recentActivities: formattedActivities.length,
        weeklyActivities: weeklyStats.totalActivities,
        totalDuration: weeklyStats.totalDuration,
        avgHeartRate: weeklyStats.avgHeartRate,
      });

      return {
        recentActivities: formattedActivities,
        weeklyStats,
        monthlyTrends,
      };
    } catch (error) {
      console.error("❌ Error fetching fitness data:", error);
      return null;
    }
  }

  public async getHealthInsights(
    userId: string
  ): Promise<HealthAnalysisResponse> {
    try {
      console.log(`🔍 Getting health insights for user: ${userId}`);

      // Fetch user profile
      const userProfile = await prisma.user.findUnique({
        where: { userId },
      });

      if (!userProfile) {
        throw new Error("User not found");
      }

      // Fetch biomarkers
      const biomarkers = await prisma.biomarkerValue.findMany({
        where: { userId },
        orderBy: { testDate: "desc" },
        take: 50,
      });

      // Fetch body composition
      const bodyComposition = await prisma.bodyCompositionResult.findFirst({
        where: { userId },
        orderBy: { testDate: "desc" },
      });

      // Fetch fitness activities (FIXED!)
      const fitnessActivities = await this.fetchFitnessData(userId);

      console.log(`📊 Data summary:`, {
        biomarkers: biomarkers.length,
        hasBodyComposition: !!bodyComposition,
        hasFitnessData: !!fitnessActivities,
        fitnessActivitiesCount: fitnessActivities?.recentActivities.length || 0,
      });

      if (biomarkers.length === 0 && !bodyComposition && !fitnessActivities) {
        // Return fallback response for no data
        return {
          healthScore: 0,
          riskLevel: "UNKNOWN",
          keyFindings: [
            "No health data available - upload blood tests, body composition data, or fitness activities to get started",
          ],
          recommendations: [
            {
              category: "Data Collection",
              priority: "high",
              recommendation:
                "Upload blood test results, body composition data, or fitness activities to receive personalized health insights.",
              reasoning:
                "Analysis requires health data to provide meaningful recommendations.",
            },
          ],
          abnormalValues: [],
          trends: [],
          summary:
            "Upload your health data to begin receiving AI-powered insights and recommendations. This platform integrates blood biomarkers, body composition, and fitness data for comprehensive health analysis.",
          confidence: 0,
          lastAnalysisDate: new Date(),
          dataCompleteness: 0,
          trendAnalysis: [],
          alerts: [],
        };
      }

      // Build analysis request
      const request: HealthAnalysisRequest = {
        biomarkers: biomarkers.map((b) => ({
          name: b.biomarkerName,
          value: parseFloat(b.value.toString()),
          unit: b.unit || "",
          referenceRange: b.referenceRange || "",
          isAbnormal: b.isAbnormal || false,
          testDate: b.testDate.toISOString(),
        })),
        bodyComposition: bodyComposition
          ? {
              testDate: bodyComposition.testDate.toISOString(),
              totalWeight: bodyComposition.totalWeight
                ? parseFloat(bodyComposition.totalWeight.toString())
                : undefined,
              bodyFatPercentage: bodyComposition.bodyFatPercentage
                ? parseFloat(bodyComposition.bodyFatPercentage.toString())
                : undefined,
              skeletalMuscleMass: bodyComposition.skeletalMuscleMass
                ? parseFloat(bodyComposition.skeletalMuscleMass.toString())
                : undefined,
              visceralFatLevel: bodyComposition.visceralFatLevel || undefined,
              bmr: bodyComposition.bmr || undefined,
            }
          : undefined,
        fitnessActivities, // Now this should have data!
        userProfile: {
          age:
            userProfile?.dateOfBirth || userProfile?.date_of_birth
              ? new Date().getFullYear() -
                new Date(
                  userProfile.dateOfBirth || userProfile.date_of_birth
                ).getFullYear()
              : undefined,
          gender: userProfile?.gender || undefined,
          weight: bodyComposition?.totalWeight
            ? parseFloat(bodyComposition.totalWeight.toString())
            : undefined,
        },
        analysisType: "comprehensive",
      };

      return await this.analyzeHealth(request);
    } catch (error) {
      console.error("❌ Error getting health insights:", error);

      // Return error fallback
      return {
        healthScore: 0,
        riskLevel: "UNKNOWN",
        keyFindings: [
          `Health analysis temporarily unavailable: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        recommendations: [
          {
            category: "System",
            priority: "low",
            recommendation:
              "Health analysis failed. Please try again in a few minutes.",
            reasoning: `System error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        abnormalValues: [],
        trends: [],
        summary: `Health analysis is temporarily unavailable due to: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again in a few minutes.`,
        confidence: 0,
        lastAnalysisDate: new Date(),
        dataCompleteness: 0,
        trendAnalysis: [],
        alerts: [],
      };
    }
  }

  public async analyzeHealth(
    request: HealthAnalysisRequest
  ): Promise<HealthAnalysisResponse> {
    let response = ""; // Declare response variable at function scope

    try {
      const prompt = this.buildAnalysisPrompt(request);
      console.log(`🧠 AI Analysis prompt length: ${prompt.length} characters`);

      response = await this.invokeModel(prompt);
      console.log("🧠 AI Analysis Response Length:", response.length);
      console.log(
        "🧠 AI Response Preview:",
        response.substring(0, 100) + "..."
      );

      // Try to extract JSON from response
      let jsonResponse = response.trim();

      // Remove any text before the first {
      const firstBrace = jsonResponse.indexOf("{");
      if (firstBrace > 0) {
        jsonResponse = jsonResponse.substring(firstBrace);
        console.log("🔧 Extracted JSON from position:", firstBrace);
      }

      // Remove any text after the last }
      const lastBrace = jsonResponse.lastIndexOf("}");
      if (lastBrace > 0 && lastBrace < jsonResponse.length - 1) {
        jsonResponse = jsonResponse.substring(0, lastBrace + 1);
        console.log("🔧 Trimmed JSON to position:", lastBrace + 1);
      }

      const analysisResult = JSON.parse(jsonResponse);

      // Add additional fields that your system expects
      return {
        ...analysisResult,
        confidence: 0.85,
        lastAnalysisDate: new Date(),
        dataCompleteness: Math.min(
          request.biomarkers.length * 10 +
            (request.bodyComposition ? 20 : 0) +
            (request.fitnessActivities ? 30 : 0),
          100
        ),
        trendAnalysis: analysisResult.trends || [],
        alerts:
          analysisResult.abnormalValues?.filter(
            (v: any) => v.urgency === "immediate"
          ) || [],
      } as HealthAnalysisResponse;
    } catch (error) {
      console.error(
        "❌ Failed to parse Bedrock response or analyze health:",
        error
      );
      console.error("❌ Raw AI response:", response); // Now response is defined

      // Fallback response
      return {
        healthScore: 50,
        riskLevel: "MODERATE",
        keyFindings: [
          `Analysis temporarily unavailable: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        recommendations: [
          {
            category: "system",
            priority: "low",
            recommendation:
              "Health analysis is temporarily unavailable. Please try again later.",
            reasoning: `System error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        abnormalValues: [],
        trends: [],
        summary: `Health analysis is temporarily unavailable due to: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        confidence: 0,
        lastAnalysisDate: new Date(),
        dataCompleteness: 0,
        trendAnalysis: [],
        alerts: [],
      };
    }
  }
}

export const bedrockAnalyzer = new BedrockHealthAnalyzer();

// Simple Claude invocation function for direct prompts
export async function callBedrockClaude(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    modelId?: string;
  }
): Promise<string> {
  const {
    maxTokens = 4000,
    temperature = 0.7,
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"
  } = options || {};

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    console.log(`🧠 Invoking Claude model: ${modelId}`);
    const response = await client.send(command);
    
    if (!response.body) {
      throw new Error("No response body received from Bedrock");
    }

    const responseText = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseText);
    
    if (parsedResponse.content && parsedResponse.content[0] && parsedResponse.content[0].text) {
      return parsedResponse.content[0].text;
    } else if (parsedResponse.completion) {
      return parsedResponse.completion;
    } else {
      throw new Error("Unexpected response format from Claude");
    }
  } catch (error) {
    console.error("❌ Claude invocation error:", error);
    throw error;
  }
}
