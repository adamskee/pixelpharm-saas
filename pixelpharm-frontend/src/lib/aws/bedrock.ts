// File: src/lib/aws/bedrock.ts

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";

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
  summary: string;
  confidence?: number;
  lastAnalysisDate?: Date;
  dataCompleteness?: number;
  trendAnalysis?: any[];
  alerts?: any[];
}

export class BedrockHealthAnalyzer {
  private async invokeModel(prompt: string): Promise<string> {
    try {
      const command = new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID!,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4000,
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

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error) {
      console.error("Bedrock invocation error:", error);
      throw new Error("Failed to analyze health data");
    }
  }

  private buildAnalysisPrompt(request: HealthAnalysisRequest): string {
    const { biomarkers, bodyComposition, userProfile, analysisType } = request;

    // Your comprehensive medical prompt as the system instruction
    const systemPrompt = `# AWS Bedrock Health Data Analysis Prompt

## System Instructions

You are an advanced AI health and medical professional with extensive expertise in clinical laboratory analysis, preventive medicine, and evidence-based healthcare. Your role is to provide comprehensive, analytical health assessments based on uploaded data while maintaining the highest standards of medical accuracy and scientific rigor.

## Core Competencies

- **Clinical Laboratory Medicine**: Expert interpretation of blood chemistry, hematology, lipid panels, metabolic markers, and specialized biomarkers
- **Preventive Medicine**: Risk assessment, lifestyle interventions, and preventive care recommendations
- **Evidence-Based Practice**: All recommendations must be grounded in peer-reviewed research and established clinical guidelines
- **Data Analytics**: Statistical analysis of health trends, pattern recognition, and predictive modeling

## Data Analysis Framework

### Phase 1: Blood Test Data Analysis (Independent Assessment)

When analyzing blood test results, perform the following systematic evaluation:

1. **Reference Range Assessment**
   - Compare each biomarker against age-specific and gender-specific reference ranges
   - Identify values outside normal parameters (high, low, critical)
   - Note any borderline values requiring monitoring

2. **Clinical Significance Evaluation**
   - Assess the clinical implications of each abnormal finding
   - Identify potential underlying pathophysiology
   - Consider differential diagnoses for abnormal patterns

3. **Biomarker Correlation Analysis**
   - Examine relationships between related markers (e.g., glucose and HbA1c)
   - Identify metabolic patterns and syndrome clusters
   - Assess inflammatory markers in context

4. **Trend Analysis** (if historical data available)
   - Calculate rate of change for key markers
   - Identify improving or deteriorating trends
   - Assess effectiveness of previous interventions

### Phase 2: Health Metrics Analysis (Independent Assessment)

For health metrics data (vital signs, body composition, activity data, etc.):

1. **Physiological Assessment**
   - Evaluate cardiovascular metrics (BP, HR, HRV)
   - Analyze body composition and metabolic indicators
   - Assess physical activity and fitness markers

2. **Risk Stratification**
   - Calculate cardiovascular risk scores where applicable
   - Assess metabolic syndrome criteria
   - Evaluate lifestyle-related health risks

3. **Performance Metrics**
   - Analyze fitness and activity levels
   - Assess sleep quality and recovery metrics
   - Evaluate stress and autonomic function indicators

## Analytical Approach Requirements

### Scientific Rigor
- Cite specific reference ranges and their sources
- Reference established clinical guidelines (AHA, ADA, ESC, etc.)
- Include statistical significance and confidence intervals where applicable
- Mention relevant research studies supporting recommendations

### Data-Driven Insights
- Provide quantitative analysis with specific values and percentages
- Calculate risk ratios and odds ratios where appropriate
- Use evidence-based risk calculators (Framingham, ASCVD, etc.)
- Include population-based comparisons when relevant

### Clinical Context
- Consider age, gender, ethnicity, and genetic factors
- Account for medications and supplements that may affect results
- Evaluate findings in context of medical history and symptoms
- Assess urgency of findings (routine, urgent, critical)

## Final Integrated Health Analysis Report

### Report Structure

**Executive Summary**
- Key findings and immediate concerns
- Overall health status assessment
- Priority recommendations

**Detailed Analysis**

1. **Laboratory Results Interpretation**
   - Comprehensive review of blood test findings
   - Clinical significance of abnormal values
   - Metabolic and physiological insights

2. **Health Metrics Evaluation**
   - Cardiovascular and metabolic health assessment
   - Physical fitness and lifestyle analysis
   - Risk factor identification

3. **Integrated Assessment**
   - Correlation between lab results and health metrics
   - Comprehensive risk stratification
   - Identification of health patterns and trends

4. **Evidence-Based Recommendations**
   - Specific, actionable interventions
   - Lifestyle modifications with scientific rationale
   - Monitoring and follow-up suggestions
   - Referral recommendations when appropriate

### Recommendation Categories

**Immediate Actions Required**
- Critical findings requiring urgent medical attention
- Specific timeline for follow-up

**Lifestyle Interventions**
- Dietary modifications with specific macronutrient targets
- Exercise prescriptions with intensity and duration specifications
- Sleep hygiene and stress management protocols

**Monitoring and Follow-up**
- Specific biomarkers to retest and timeline
- Health metrics to track regularly
- Preventive screening recommendations

**Supplementation and Therapeutics**
- Evidence-based supplement recommendations with dosages
- Consideration of pharmaceutical interventions
- Drug-nutrient interactions and contraindications

## Quality Assurance Standards

- **Accuracy**: All numerical values and reference ranges must be verified
- **Completeness**: Address all significant findings in the data
- **Clarity**: Use clear, professional language accessible to the patient
- **Safety**: Always err on the side of caution with medical recommendations
- **Disclaimer**: Include appropriate medical disclaimers about AI limitations

## Medical Disclaimer Template

"This analysis is generated by AI for informational purposes only and does not constitute medical advice, diagnosis, or treatment recommendations. All findings should be reviewed with a qualified healthcare provider. Urgent or critical findings require immediate medical attention. This analysis does not replace professional medical consultation."

## Response Format

Structure your response with clear headers, bullet points for key findings, and specific numerical values. Include confidence levels for recommendations and always provide the scientific rationale behind your conclusions.`;

    // Format the biomarker data
    let biomarkerData = "**Laboratory Results:**\n";
    biomarkers.forEach((biomarker) => {
      biomarkerData += `- ${biomarker.name}: ${biomarker.value} ${
        biomarker.unit
      } (Reference: ${biomarker.referenceRange}) ${
        biomarker.isAbnormal ? "[ABNORMAL]" : "[NORMAL]"
      } (Test Date: ${biomarker.testDate})\n`;
    });

    // Add body composition data
    let bodyCompositionData = "";
    if (bodyComposition) {
      bodyCompositionData = `\n**Body Composition Results (${bodyComposition.testDate}):**\n`;
      if (bodyComposition.totalWeight)
        bodyCompositionData += `- Total Weight: ${bodyComposition.totalWeight} kg\n`;
      if (bodyComposition.bodyFatPercentage)
        bodyCompositionData += `- Body Fat Percentage: ${bodyComposition.bodyFatPercentage}%\n`;
      if (bodyComposition.skeletalMuscleMass)
        bodyCompositionData += `- Skeletal Muscle Mass: ${bodyComposition.skeletalMuscleMass} kg\n`;
      if (bodyComposition.visceralFatLevel)
        bodyCompositionData += `- Visceral Fat Level: ${bodyComposition.visceralFatLevel}\n`;
      if (bodyComposition.bmr)
        bodyCompositionData += `- Basal Metabolic Rate: ${bodyComposition.bmr} kcal/day\n`;
    }

    // User profile context
    const userContext = `**Patient Profile:**
- Age: ${userProfile.age || "Not specified"}
- Gender: ${userProfile.gender || "Not specified"}
- Height: ${userProfile.height || "Not specified"} cm
- Current Weight: ${userProfile.weight || "Not specified"} kg`;

    // Analysis type specific instructions
    let analysisInstructions = "";
    switch (analysisType) {
      case "comprehensive":
        analysisInstructions = `
## Final Integrated Health Analysis Report

Please provide a comprehensive health analysis following the framework outlined above. Your analysis should include:

**Executive Summary**
- Key findings and immediate concerns
- Overall health status assessment
- Priority recommendations

**Detailed Analysis**
1. Laboratory Results Interpretation
2. Health Metrics Evaluation (if available)
3. Integrated Assessment
4. Evidence-Based Recommendations

**Recommendation Categories**
- Immediate Actions Required
- Lifestyle Interventions
- Monitoring and Follow-up
- Supplementation and Therapeutics

CRITICAL: Format your response as valid JSON matching this exact structure:
{
  "healthScore": number (0-100),
  "riskLevel": "LOW|MODERATE|HIGH|CRITICAL",
  "keyFindings": [string],
  "recommendations": [{"category": string, "priority": string, "recommendation": string, "reasoning": string}],
  "abnormalValues": [{"biomarker": string, "value": number, "concern": string, "urgency": string}],
  "trends": [{"biomarker": string, "trend": string, "timeframe": string}],
  "summary": string
}`;
        break;

      case "risk_assessment":
        analysisInstructions = `
Focus on comprehensive risk assessment following the framework above. Identify cardiovascular, metabolic, and other health risks based on the biomarker patterns. Return JSON with risk-focused analysis.`;
        break;

      case "recommendations":
        analysisInstructions = `
Focus on evidence-based, actionable recommendations following the framework above. Provide specific interventions based on the biomarker findings. Return JSON with detailed recommendations.`;
        break;

      case "trends":
        analysisInstructions = `
Analyze biomarker trends and patterns following the framework above. Identify improving, stable, or declining patterns and their clinical significance. Return JSON with trend analysis.`;
        break;
    }

    // Combine everything into the final prompt
    const fullPrompt = `${systemPrompt}

---

## Current Patient Data for Analysis:

${userContext}

${biomarkerData}${bodyCompositionData}

${analysisInstructions}

**Important Guidelines:**
- Integrate both laboratory biomarkers and body composition data in your analysis
- Consider correlations between metabolic markers and body composition
- Provide evidence-based recommendations for both biomarker optimization and body composition goals
- Flag any critical values that need immediate attention
- Consider age, gender, and other patient factors in analysis
- Ensure all JSON is properly formatted and valid
- Include the medical disclaimer in your summary`;

    return fullPrompt;
  }

  public async analyzeHealth(
    request: HealthAnalysisRequest
  ): Promise<HealthAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);
    const response = await this.invokeModel(prompt);

    try {
      // Parse the JSON response from Claude
      const analysisResult = JSON.parse(response);

      // Add additional fields that your system expects
      return {
        ...analysisResult,
        confidence: 0.85, // Default confidence score
        lastAnalysisDate: new Date(),
        dataCompleteness: Math.min(request.biomarkers.length * 10, 100), // Rough estimate
        trendAnalysis: analysisResult.trends || [],
        alerts:
          analysisResult.abnormalValues?.filter(
            (v: any) => v.urgency === "immediate"
          ) || [],
      } as HealthAnalysisResponse;
    } catch (error) {
      console.error("Failed to parse Bedrock response:", error);
      console.error("Raw response:", response);

      // Fallback response if parsing fails
      return {
        healthScore: 50,
        riskLevel: "MODERATE",
        keyFindings: ["Analysis temporarily unavailable"],
        recommendations: [
          {
            category: "system",
            priority: "low",
            recommendation:
              "Health analysis is temporarily unavailable. Please try again later.",
            reasoning: "System error occurred during analysis.",
          },
        ],
        abnormalValues: [],
        trends: [],
        summary:
          "Health analysis is temporarily unavailable. Please try again later.",
        confidence: 0,
        lastAnalysisDate: new Date(),
        dataCompleteness: 0,
        trendAnalysis: [],
        alerts: [],
      };
    }
  }

  public async getHealthInsights(
    userId: string
  ): Promise<HealthAnalysisResponse> {
    try {
      // Import your existing database functions
      const { getBiomarkersByUserId } = await import("../database/biomarkers");
      const { getUserProfile } = await import("../database/users");
      const { getLatestBodyComposition } = await import(
        "../database/body-composition"
      );

      const biomarkers = await getBiomarkersByUserId(userId);
      const userProfile = await getUserProfile(userId);
      const bodyComposition = await getLatestBodyComposition(userId);

      if (!biomarkers || biomarkers.length === 0) {
        // No-data response
        return {
          healthScore: 0,
          riskLevel: "UNKNOWN",
          keyFindings: ["No health data available"],
          recommendations: [
            {
              category: "Getting Started",
              priority: "HIGH",
              recommendation:
                "Upload your first health document to begin your personalized health analysis.",
              reasoning: "No biomarker data available for analysis.",
              title: "Upload Your First Health Document",
              description:
                "Upload a blood test or health report to begin your personalized health analysis.",
            },
          ],
          abnormalValues: [],
          trends: [],
          summary:
            "No health data available. Upload your first health document to get started.",
          confidence: 0,
          lastAnalysisDate: new Date(),
          dataCompleteness: 0,
          trendAnalysis: [],
          alerts: [],
        };
      }

      const request: HealthAnalysisRequest = {
        biomarkers: biomarkers.map((b) => ({
          name: b.biomarkerName || b.biomarker_name,
          value: Number(b.value),
          unit: b.unit || "",
          referenceRange: b.referenceRange || b.reference_range || "",
          isAbnormal: b.isAbnormal || b.is_abnormal || false,
          testDate:
            b.testDate?.toISOString() ||
            b.test_date?.toISOString() ||
            new Date().toISOString(),
        })),
        bodyComposition: bodyComposition
          ? {
              testDate: bodyComposition.testDate.toISOString(),
              totalWeight: bodyComposition.totalWeight || undefined,
              bodyFatPercentage: bodyComposition.bodyFatPercentage || undefined,
              skeletalMuscleMass:
                bodyComposition.skeletalMuscleMass || undefined,
              visceralFatLevel: bodyComposition.visceralFatLevel || undefined,
              bmr: bodyComposition.bmr || undefined,
            }
          : undefined,
        userProfile: {
          age:
            userProfile?.dateOfBirth || userProfile?.date_of_birth
              ? new Date().getFullYear() -
                new Date(
                  userProfile.dateOfBirth || userProfile.date_of_birth
                ).getFullYear()
              : undefined,
          gender: userProfile?.gender || undefined,
          weight: bodyComposition?.totalWeight || undefined,
        },
        analysisType: "comprehensive",
      };

      return await this.analyzeHealth(request);
    } catch (error) {
      console.error("Error getting health insights:", error);

      // Error fallback
      return {
        healthScore: 0,
        riskLevel: "UNKNOWN",
        keyFindings: ["Analysis temporarily unavailable"],
        recommendations: [
          {
            category: "System",
            priority: "low",
            recommendation: "Health analysis failed. Please try again later.",
            reasoning: "System error occurred during analysis.",
          },
        ],
        abnormalValues: [],
        trends: [],
        summary:
          "Health analysis is temporarily unavailable. Please try again later.",
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
