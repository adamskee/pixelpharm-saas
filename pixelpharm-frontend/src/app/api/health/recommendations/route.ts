// File: src/app/api/health/recommendations/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface DetailedRecommendation {
  id: string;
  title: string;
  description: string;
  category: "diet" | "exercise" | "lifestyle" | "supplements" | "medical" | "monitoring";
  priority: "urgent" | "high" | "moderate" | "low";
  reasoning: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeframe: string;
  evidenceLevel: "strong" | "moderate" | "limited";
  relatedBiomarkers: string[];
  resources?: string[];
  status: "new" | "in_progress" | "completed" | "dismissed";
}

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

    console.log(`💡 Generating recommendations for user: ${userId}`);

    // Get user's biomarker data
    const biomarkers = await prisma.biomarkerValue.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
      take: 100,
    });

    const abnormalBiomarkers = biomarkers.filter(b => b.isAbnormal);
    const recommendations: DetailedRecommendation[] = [];

    // Generate recommendations based on abnormal biomarkers
    for (const biomarker of abnormalBiomarkers) {
      const biomarkerRecs = generateBiomarkerRecommendations(biomarker);
      recommendations.push(...biomarkerRecs);
    }

    // Add general health recommendations if no specific issues
    if (abnormalBiomarkers.length === 0) {
      recommendations.push(...generateGeneralHealthRecommendations());
    }

    // Add monitoring recommendations
    recommendations.push(...generateMonitoringRecommendations(biomarkers));

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, moderate: 2, low: 3 };
    const sortedRecommendations = recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    console.log(`✅ Generated ${recommendations.length} recommendations`);

    return NextResponse.json({
      recommendations: sortedRecommendations,
      summary: {
        totalRecommendations: recommendations.length,
        urgentCount: recommendations.filter(r => r.priority === "urgent").length,
        highPriorityCount: recommendations.filter(r => r.priority === "high").length,
        moderateCount: recommendations.filter(r => r.priority === "moderate").length,
        lowPriorityCount: recommendations.filter(r => r.priority === "low").length,
        categoryCounts: getCategoryCounts(recommendations),
      },
      metadata: {
        userId,
        generatedAt: new Date().toISOString(),
        biomarkersAnalyzed: biomarkers.length,
        abnormalBiomarkers: abnormalBiomarkers.length,
      },
    });
  } catch (error) {
    console.error("❌ Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

function generateBiomarkerRecommendations(biomarker: any): DetailedRecommendation[] {
  const recommendations: DetailedRecommendation[] = [];
  const biomarkerName = biomarker.biomarkerName.toLowerCase();
  const value = parseFloat(biomarker.value.toString());

  // Cholesterol-related recommendations
  if (biomarkerName.includes("cholesterol") || biomarkerName.includes("ldl")) {
    recommendations.push({
      id: `cholesterol-${biomarker.valueId}`,
      title: "Optimize Cholesterol Levels",
      description: "Your cholesterol levels are elevated and need attention to reduce cardiovascular risk.",
      category: "diet",
      priority: value > 7.0 ? "high" : "moderate",
      reasoning: `${biomarker.biomarkerName} is ${value} ${biomarker.unit}, which is above the optimal range of ${biomarker.referenceRange}.`,
      actionSteps: [
        "Reduce saturated fat intake to less than 7% of daily calories",
        "Increase soluble fiber intake (oats, beans, apples, barley)",
        "Add plant sterols/stanols (2g daily)",
        "Choose lean proteins (fish, poultry, legumes)",
        "Eliminate trans fats completely",
        "Exercise 150+ minutes per week of moderate activity"
      ],
      expectedOutcome: "10-15% reduction in cholesterol within 6-8 weeks",
      timeframe: "6-8 weeks",
      evidenceLevel: "strong",
      relatedBiomarkers: [biomarker.biomarkerName],
      resources: [
        "American Heart Association cholesterol guidelines",
        "Mediterranean diet meal plans"
      ],
      status: "new"
    });

    recommendations.push({
      id: `cholesterol-exercise-${biomarker.valueId}`,
      title: "Cardiovascular Exercise Program",
      description: "Regular aerobic exercise can significantly improve cholesterol profiles.",
      category: "exercise",
      priority: "moderate",
      reasoning: "Exercise increases HDL cholesterol and can help lower LDL cholesterol.",
      actionSteps: [
        "Start with 20-30 minutes of brisk walking daily",
        "Progress to 150 minutes of moderate cardio per week",
        "Include 2 days of strength training",
        "Consider activities: swimming, cycling, jogging",
        "Monitor heart rate during exercise",
        "Track progress weekly"
      ],
      expectedOutcome: "5-10% improvement in cholesterol ratios within 8 weeks",
      timeframe: "8-12 weeks",
      evidenceLevel: "strong",
      relatedBiomarkers: [biomarker.biomarkerName],
      status: "new"
    });
  }

  // Glucose-related recommendations
  if (biomarkerName.includes("glucose") || biomarkerName.includes("hba1c")) {
    const isHighGlucose = value > 5.6; // mmol/L or equivalent
    
    recommendations.push({
      id: `glucose-${biomarker.valueId}`,
      title: "Blood Sugar Management",
      description: "Your blood glucose levels indicate a need for dietary and lifestyle modifications.",
      category: "diet",
      priority: value > 11.0 ? "urgent" : value > 7.0 ? "high" : "moderate",
      reasoning: `${biomarker.biomarkerName} is ${value} ${biomarker.unit}, indicating elevated blood sugar levels.`,
      actionSteps: [
        "Adopt a low glycemic index diet",
        "Eat smaller, more frequent meals (5-6 per day)",
        "Choose complex carbohydrates over simple sugars",
        "Include protein with every meal",
        "Monitor blood sugar if recommended by healthcare provider",
        "Limit refined sugars and processed foods"
      ],
      expectedOutcome: "Improved glucose control and reduced diabetes risk",
      timeframe: "4-6 weeks",
      evidenceLevel: "strong",
      relatedBiomarkers: [biomarker.biomarkerName],
      status: "new"
    });

    if (isHighGlucose) {
      recommendations.push({
        id: `glucose-medical-${biomarker.valueId}`,
        title: "Medical Consultation Required",
        description: "Elevated glucose levels require professional medical evaluation.",
        category: "medical",
        priority: value > 11.0 ? "urgent" : "high",
        reasoning: "High glucose levels may indicate prediabetes or diabetes and require medical assessment.",
        actionSteps: [
          "Schedule appointment with primary care physician within 1-2 weeks",
          "Request comprehensive diabetes screening",
          "Discuss family history of diabetes",
          "Consider HbA1c test if not recent",
          "Ask about glucose monitoring recommendations",
          "Discuss medication options if necessary"
        ],
        expectedOutcome: "Proper diagnosis and treatment plan for glucose management",
        timeframe: "1-2 weeks",
        evidenceLevel: "strong",
        relatedBiomarkers: [biomarker.biomarkerName],
        status: "new"
      });
    }
  }

  // Inflammatory markers (CRP, ESR)
  if (biomarkerName.includes("crp") || biomarkerName.includes("esr")) {
    recommendations.push({
      id: `inflammation-${biomarker.valueId}`,
      title: "Anti-Inflammatory Lifestyle",
      description: "Your inflammatory markers are elevated, suggesting the need for anti-inflammatory interventions.",
      category: "lifestyle",
      priority: "moderate",
      reasoning: `Elevated ${biomarker.biomarkerName} (${value} ${biomarker.unit}) indicates systemic inflammation.`,
      actionSteps: [
        "Follow an anti-inflammatory diet (Mediterranean style)",
        "Include omega-3 rich foods (fatty fish, walnuts, flaxseeds)",
        "Add turmeric and ginger to meals",
        "Ensure adequate sleep (7-9 hours nightly)",
        "Practice stress reduction techniques",
        "Avoid processed foods and excess sugar"
      ],
      expectedOutcome: "Reduced inflammatory markers within 6-8 weeks",
      timeframe: "6-8 weeks",
      evidenceLevel: "moderate",
      relatedBiomarkers: [biomarker.biomarkerName],
      status: "new"
    });
  }

  // Vitamin D deficiency
  if (biomarkerName.includes("vitamin d") && value < 50) {
    recommendations.push({
      id: `vitamin-d-${biomarker.valueId}`,
      title: "Vitamin D Optimization",
      description: "Your vitamin D levels are insufficient and require supplementation.",
      category: "supplements",
      priority: value < 25 ? "high" : "moderate",
      reasoning: `Vitamin D level of ${value} ${biomarker.unit} is below the optimal range of 75-125 nmol/L.`,
      actionSteps: [
        "Take vitamin D3 supplement (2000-4000 IU daily)",
        "Get 15-20 minutes of midday sun exposure when possible",
        "Include vitamin D rich foods (fatty fish, egg yolks)",
        "Take with fat-containing meal for better absorption",
        "Retest vitamin D levels in 8-12 weeks",
        "Consider higher doses if severely deficient"
      ],
      expectedOutcome: "Vitamin D levels above 75 nmol/L within 8-12 weeks",
      timeframe: "8-12 weeks",
      evidenceLevel: "strong",
      relatedBiomarkers: [biomarker.biomarkerName],
      status: "new"
    });
  }

  return recommendations;
}

function generateGeneralHealthRecommendations(): DetailedRecommendation[] {
  return [
    {
      id: "general-wellness-1",
      title: "Maintain Optimal Health",
      description: "Your biomarkers look good! Here are recommendations to maintain your health.",
      category: "lifestyle",
      priority: "low",
      reasoning: "All biomarkers are within normal ranges, focus on maintaining current health status.",
      actionSteps: [
        "Continue current healthy eating patterns",
        "Maintain regular exercise routine",
        "Ensure adequate sleep (7-9 hours)",
        "Stay hydrated (8-10 glasses water daily)",
        "Manage stress through relaxation techniques",
        "Schedule regular health check-ups"
      ],
      expectedOutcome: "Maintained optimal health and disease prevention",
      timeframe: "Ongoing",
      evidenceLevel: "strong",
      relatedBiomarkers: [],
      status: "new"
    }
  ];
}

function generateMonitoringRecommendations(biomarkers: any[]): DetailedRecommendation[] {
  if (biomarkers.length === 0) return [];

  const lastTestDate = biomarkers[0]?.testDate;
  const daysSinceLastTest = lastTestDate 
    ? Math.floor((Date.now() - new Date(lastTestDate).getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  return [
    {
      id: "monitoring-1",
      title: "Regular Health Monitoring",
      description: "Stay on top of your health with regular biomarker testing.",
      category: "monitoring",
      priority: daysSinceLastTest > 180 ? "moderate" : "low",
      reasoning: `Last test was ${daysSinceLastTest} days ago. Regular monitoring helps track health trends.`,
      actionSteps: [
        "Schedule comprehensive blood panel every 6-12 months",
        "Track key biomarkers that were previously abnormal",
        "Monitor blood pressure monthly if elevated",
        "Keep a health diary to track symptoms",
        "Upload results to PixelPharm for analysis",
        "Discuss results with healthcare provider"
      ],
      expectedOutcome: "Early detection of health changes and trend tracking",
      timeframe: "Every 6-12 months",
      evidenceLevel: "strong",
      relatedBiomarkers: biomarkers.slice(0, 5).map(b => b.biomarkerName),
      status: "new"
    }
  ];
}

function getCategoryCounts(recommendations: DetailedRecommendation[]) {
  const counts: Record<string, number> = {};
  recommendations.forEach(rec => {
    counts[rec.category] = (counts[rec.category] || 0) + 1;
  });
  return counts;
}