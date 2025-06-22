// src/lib/database/health-insights.ts
import { prisma } from "./client";
import type { HealthAnalysisResponse } from "../aws/bedrock";

interface StoredHealthData {
  healthScore?: number;
  riskLevel?: string;
  keyFindings?: string[];
  recommendations?: Array<{
    category: string;
    priority: string;
    recommendation: string;
    reasoning: string;
  }>;
  abnormalValues?: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: string;
  }>;
  trends?: Array<{
    biomarker: string;
    trend: string;
    timeframe: string;
  }>;
}

export async function storeHealthInsights(
  userId: string,
  insights: HealthAnalysisResponse
) {
  try {
    return await prisma.healthInsight.create({
      data: {
        userId: userId,
        insightType: "TREND_ANALYSIS",
        title: `Health Analysis - Score: ${insights.healthScore}`,
        description: insights.summary,
        priority:
          insights.riskLevel === "HIGH" || insights.riskLevel === "CRITICAL"
            ? "HIGH"
            : "MEDIUM",
        dataSources: {
          healthScore: insights.healthScore,
          riskLevel: insights.riskLevel,
          keyFindings: insights.keyFindings,
          recommendations: insights.recommendations,
          abnormalValues: insights.abnormalValues,
          trends: insights.trends,
        },
        aiConfidence: 0.85,
      },
    });
  } catch (error) {
    console.error("Error storing health insights:", error);
    throw error;
  }
}

export async function getLatestHealthInsights(userId: string) {
  try {
    const insight = await prisma.healthInsight.findFirst({
      where: {
        userId: userId,
        insightType: "TREND_ANALYSIS",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!insight) return null;

    // Convert back to expected format
    const dataSources = insight.dataSources as StoredHealthData;

    return {
      health_score: dataSources?.healthScore || 0,
      risk_level: dataSources?.riskLevel || "MODERATE",
      key_findings: dataSources?.keyFindings || [],
      recommendations: dataSources?.recommendations || [],
      abnormal_values: dataSources?.abnormalValues || [],
      trends: dataSources?.trends || [],
      summary: insight.description,
      created_at: insight.createdAt,
      analysis_date: insight.createdAt,
    };
  } catch (error) {
    console.error("Error fetching health insights:", error);
    throw error;
  }
}

export async function getHealthInsightsHistory(userId: string, limit = 10) {
  try {
    return await prisma.healthInsight.findMany({
      where: {
        userId: userId,
        insightType: "TREND_ANALYSIS",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching health insights history:", error);
    throw error;
  }
}
