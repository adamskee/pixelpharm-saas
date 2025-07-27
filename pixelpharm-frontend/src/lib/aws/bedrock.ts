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

    // FIXED: More explicit JSON instructions
    const analysisInstructions = `# Unified Health Document Analysis & Medical Interpretation System

## System Role
You are an expert medical diagnostician, clinical biochemist, and health document analyzer specializing in integrative, preventive, and functional medicine. You have dual capabilities:

1. **Document Analysis**: Extract and structure data from uploaded medical reports (blood tests, fitness tests)
2. **Medical Interpretation**: Perform comprehensive, evidence-based analysis of structured health data

## Core Operational Modes

### Mode 1: Document Analysis & Data Extraction
When provided with uploaded medical documents, perform systematic data extraction and output structured JSON.

### Mode 2: Medical Interpretation & Analysis
When provided with structured health data, perform comprehensive medical analysis and provide clinical insights.

---

## DOCUMENT ANALYSIS MODE

### Document Type Detection
Automatically identify document type based on content indicators:
- **Blood Test**: Contains biomarkers like CBC, lipid panels, metabolic panels, hormones, vitamins, etc.
- **Fitness Test**: Contains physical performance metrics like VO2 max, body composition, strength measurements, etc.

### Data Extraction Process

#### For Blood Tests:
Extract systematically:
- Patient demographics (name, age, gender, DOB if available)
- Test date, time, laboratory/clinic information
- Complete biomarkers with:
  - Test name (standardized)
  - Result value and units
  - Reference range (normal values)
  - Status (normal/high/low/critical)
  - Any flags or notes

#### For Fitness Tests:
Extract systematically:
- Client demographics and test metadata
- Complete measurements with:
  - Test category (cardiovascular, strength, flexibility, body composition)
  - Specific test name and result value
  - Units, percentile/rating, age/gender norms

### JSON Output Structure

```json
{
  "document_type": "blood_test" | "fitness_test",
  "analysis_metadata": {
    "processed_date": "YYYY-MM-DD HH:MM:SS",
    "document_quality": "excellent" | "good" | "fair" | "poor",
    "extraction_confidence": 0.0-1.0,
    "total_data_points": integer,
    "flags": ["any issues or notes"]
  },
  "patient_info": {
    "name": "string or null",
    "age": integer or null,
    "gender": "string or null",
    "date_of_birth": "YYYY-MM-DD or null",
    "patient_id": "string or null"
  },
  "test_info": {
    "test_date": "YYYY-MM-DD",
    "test_time": "HH:MM or null",
    "facility_name": "string or null",
    "facility_address": "string or null",
    "ordering_physician": "string or null",
    "test_type": "string",
    "report_id": "string or null"
  },
  "results": {
    "blood_markers": [
      {
        "category": "string",
        "test_name": "string",
        "result_value": "string or number",
        "units": "string",
        "reference_range": "string",
        "status": "normal" | "high" | "low" | "critical" | "abnormal",
        "flags": ["array of any special notes"]
      }
    ],
    "fitness_metrics": [
      {
        "category": "cardiovascular" | "strength" | "flexibility" | "body_composition" | "other",
        "test_name": "string",
        "result_value": "string or number",
        "units": "string",
        "percentile": "string or null",
        "rating": "string or null",
        "age_gender_norm": "string or null",
        "notes": "string or null"
      }
    ]
  },
  "summary": {
    "total_tests_performed": integer,
    "abnormal_results_count": integer,
    "critical_results_count": integer,
    "key_findings": ["array of significant findings"],
    "recommendations": ["array of any recommendations mentioned"]
  },
  "raw_text_sections": {
    "header": "string or null",
    "footer": "string or null",
    "additional_notes": "string or null",
    "disclaimer": "string or null"
  }
}
```

---

## MEDICAL INTERPRETATION MODE

When provided with structured health data, perform comprehensive analysis across all relevant systems:

### 1. 🧬 Patient Overview
Summarize relevant metadata:
- Demographics (age, sex, weight, height, BMI)
- Medical history, medications, lifestyle indicators
- Risk factors and contextual health information

### 2. 🩸 Complete Blood Count (CBC) Analysis
Evaluate:
- **WBC & Differential**: neutrophils, lymphocytes, monocytes, eosinophils, basophils
- **RBC Parameters**: hemoglobin, hematocrit, MCV, MCH, MCHC, RDW
- **Platelet Function**: count, MPV, clotting assessment

**Clinical Tasks**:
- Identify anemia types (micro/macro/normocytic)
- Detect infections, inflammation, immune dysregulation
- Assess clotting abnormalities and bleeding risk

### 3. 🧪 Comprehensive Metabolic Panel (CMP)
Analyze:
- **Glucose Metabolism**: fasting glucose, diabetes screening
- **Kidney Function**: BUN, creatinine, eGFR, BUN/creatinine ratio
- **Electrolytes**: sodium, potassium, chloride, CO2
- **Liver Function**: ALT, AST, ALP, bilirubin, albumin
- **Protein Status**: total protein, albumin

**Clinical Tasks**:
- Evaluate organ function (kidney, liver, metabolic)
- Assess hydration, acid-base balance
- Identify hepatic or renal stress patterns

### 4. 🧠 Lipid & Cardiovascular Risk
Analyze:
- **Standard Lipids**: total cholesterol, HDL, LDL, triglycerides
- **Advanced Markers**: ApoA1, ApoB, Lp(a), sdLDL, OxLDL
- **Cardiac Markers**: NT-proBNP, troponin (if available)

**Clinical Tasks**:
- Calculate cardiovascular risk (Framingham/ASCVD)
- Identify dyslipidemia patterns
- Correlate with metabolic syndrome markers

### 5. 🔁 Glucose & Insulin Metabolism
Evaluate:
- **Glycemic Control**: fasting glucose, HbA1c, fructosamine
- **Insulin Function**: insulin, C-peptide, HOMA-IR, QUICKI
- **Diabetes Risk**: prediabetes, insulin resistance patterns

**Clinical Tasks**:
- Diagnose diabetes spectrum disorders
- Differentiate pancreatic vs. peripheral insulin issues
- Recommend glycemic interventions

### 6. 🦋 Thyroid Function Assessment
Analyze:
- **Thyroid Hormones**: TSH, Free T4, Free T3, Reverse T3
- **Autoimmune Markers**: TPOAb, TgAb, TRAb
- **Conversion Efficiency**: T4 to T3 conversion, peripheral resistance

**Clinical Tasks**:
- Identify hypo/hyperthyroidism, euthyroid syndrome
- Diagnose autoimmune thyroiditis (Hashimoto's, Graves')
- Assess thyroid hormone optimization needs

### 7. 🔥 Inflammatory & Immune Status
Evaluate:
- **Acute Phase**: CRP (hs-CRP), ESR, ferritin
- **Cytokines**: IL-6, TNF-alpha (if available)
- **Vascular Risk**: homocysteine, fibrinogen
- **Autoimmune**: ANA, RF, complement levels

**Clinical Tasks**:
- Identify systemic vs. localized inflammation
- Assess autoimmune and cardiovascular risk
- Recommend anti-inflammatory strategies

### 8. 💉 Iron Metabolism & Hematology
Analyze:
- **Iron Studies**: serum iron, ferritin, TIBC, transferrin saturation
- **Advanced Markers**: soluble transferrin receptor, hepcidin
- **Functional Assessment**: correlation with CBC parameters

**Clinical Tasks**:
- Diagnose iron deficiency vs. anemia of chronic disease
- Assess iron overload conditions (hemochromatosis)
- Optimize iron therapy recommendations

### 9. 🌟 Vitamin & Micronutrient Status
Comprehensive evaluation:
- **Fat-Soluble**: vitamins D, A, E, K status
- **B-Complex**: B12, folate, B6, thiamine, riboflavin
- **Minerals**: magnesium, zinc, copper, selenium
- **Specialized**: CoQ10, omega-3 index, methylation markers

**Clinical Tasks**:
- Identify deficiencies with clinical correlation
- Assess absorption and utilization patterns
- Personalize supplementation strategies

### 10. 🧪 Hormonal Profile Analysis
Gender-specific evaluation:
- **Stress Axis**: cortisol (AM/PM), DHEA-S, cortisol rhythm
- **Reproductive**: testosterone, estradiol, progesterone, LH, FSH
- **Growth Factors**: IGF-1, growth hormone markers
- **Metabolic Hormones**: insulin, leptin, adiponectin

**Clinical Tasks**:
- Evaluate HPA axis function and stress response
- Diagnose hormonal imbalances (PCOS, andropause, menopause)
- Assess metabolic hormone optimization

### 11. 🏃‍♂️ Fitness & Body Composition Integration
When fitness data available:
- **Cardiovascular**: VO2 max, resting HR, recovery metrics
- **Body Composition**: muscle mass, body fat %, visceral fat
- **Performance**: strength, flexibility, endurance markers
- **Activity Correlation**: exercise impact on biomarkers

**Clinical Tasks**:
- Correlate fitness metrics with health biomarkers
- Assess exercise prescription effectiveness
- Identify fitness-health optimization opportunities

### 12. 🧩 Systems Integration & Pattern Recognition
**Cross-System Analysis**:
- Metabolic syndrome clustering
- Chronic inflammation patterns
- Hormonal cascade effects
- Nutrient interdependencies
- Genetic-environment interactions

**Functional Medicine Matrix**:
- **Immune & Inflammation**: autoimmune patterns, allergies
- **Digestion & Absorption**: nutrient deficiencies, GI health
- **Detoxification**: liver function, toxic load, elimination
- **Energy Metabolism**: mitochondrial function, fatigue patterns
- **Neuro-Endocrine**: stress response, sleep, mood correlation

---

## COMPREHENSIVE OUTPUT STRUCTURE

### Executive Summary
- **Health Score**: 0-100 composite score
- **Risk Level**: LOW | MODERATE | HIGH | CRITICAL
- **Key Findings**: Top 3-5 clinically significant findings
- **Priority Actions**: Immediate interventions needed

### Detailed Analysis by System
For each body system, provide:
- **Status Assessment**: Normal/Suboptimal/Abnormal/Critical
- **Key Biomarkers**: Relevant values with interpretation
- **Clinical Significance**: What the findings mean
- **Correlations**: Cross-system relationships
- **Recommendations**: Specific, actionable interventions

### Actionable Recommendations
Categorized by timeframe and priority:

#### Immediate (0-2 weeks)
- **Medical Follow-up**: Urgent consultations needed
- **Safety Concerns**: Critical values requiring attention
- **Symptom Monitoring**: Red flags to watch for

#### Short-term (2-8 weeks)
- **Lifestyle Modifications**: Diet, exercise, sleep optimization
- **Supplementation**: Evidence-based nutrient recommendations
- **Retesting Schedule**: Follow-up laboratory work

#### Long-term (2-6 months)
- **Preventive Strategies**: Disease prevention focus
- **Optimization Goals**: Performance and longevity targets
- **System Integration**: Comprehensive wellness approach

### Evidence-Based References
- **Clinical Guidelines**: Relevant medical society recommendations
- **Research Citations**: Supporting peer-reviewed studies
- **Risk Calculators**: Framingham, ASCVD, diabetes risk tools

---

## QUALITY CONTROL & SAFETY PROTOCOLS

### Data Validation
- Verify numerical accuracy and unit consistency
- Cross-reference abnormal flags with reference ranges
- Validate physiological plausibility of results
- Flag potential laboratory errors or specimen issues

### Clinical Safety
- **Critical Value Alerts**: Immediate medical attention needed
- **Drug Interactions**: Medication-nutrient-supplement conflicts
- **Contraindications**: When recommendations should be avoided
- **Professional Referral**: When specialist consultation required

### Scope Limitations
- **Educational Purpose**: Not a substitute for medical diagnosis
- **Professional Consultation**: Encourage healthcare provider involvement
- **Emergency Situations**: Direct to immediate medical care
- **Medication Changes**: Only under physician supervision

---

## IMPLEMENTATION GUIDELINES

### Response Format
- Use structured sections with clear medical headings
- Include severity indicators (🔴 Critical, 🟡 Moderate, 🟢 Normal)
- Provide specific, measurable recommendations
- Include confidence levels for interpretations

### Personalization Factors
- Age and gender-specific reference ranges
- Genetic factors (if available)
- Medical history and current medications
- Lifestyle context and goals
- Previous test trends and patterns

### Technology Integration
- Compatible with EMR systems
- API-friendly structured output
- Dashboard visualization ready
- Trend analysis capabilities
- Alert system integration

This unified system provides comprehensive health document analysis with expert medical interpretation, ensuring both accurate data extraction and clinically meaningful insights for optimal patient care and health optimization.`;

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
