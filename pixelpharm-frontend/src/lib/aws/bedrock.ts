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
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  keyFindings: string[];
  recommendations: Array<{
    category: "diet" | "exercise" | "lifestyle" | "medical";
    priority: "high" | "medium" | "low";
    recommendation: string;
    reasoning: string;
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: "immediate" | "moderate" | "monitor";
  }>;
  trends: Array<{
    biomarker: string;
    trend: "improving" | "stable" | "declining";
    timeframe: string;
  }>;
  summary: string;
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
    const { biomarkers, userProfile, analysisType } = request;

    let prompt = `You are a medical AI assistant specializing in health data analysis. Analyze the following biomarker data and provide insights.

**User Profile:**
- Age: ${userProfile.age || "Not specified"}
- Gender: ${userProfile.gender || "Not specified"}
- Height: ${userProfile.height || "Not specified"} cm
- Weight: ${userProfile.weight || "Not specified"} kg

**Biomarker Data:**
`;

    biomarkers.forEach((biomarker) => {
      prompt += `- ${biomarker.name}: ${biomarker.value} ${
        biomarker.unit
      } (Reference: ${biomarker.referenceRange}) ${
        biomarker.isAbnormal ? "[ABNORMAL]" : "[NORMAL]"
      } (Test Date: ${biomarker.testDate})\n`;
    });

    switch (analysisType) {
      case "comprehensive":
        prompt += `
**Analysis Request:**
Provide a comprehensive health analysis including:
1. Overall health score (0-100)
2. Risk level assessment
3. Key findings from the biomarkers
4. Personalized recommendations (diet, exercise, lifestyle, medical follow-up)
5. Abnormal values with concern levels
6. Biomarker trends if historical data available
7. Executive summary

Format your response as valid JSON matching this structure:
{
  "healthScore": number,
  "riskLevel": "LOW|MODERATE|HIGH|CRITICAL",
  "keyFindings": [string],
  "recommendations": [{"category": string, "priority": string, "recommendation": string, "reasoning": string}],
  "abnormalValues": [{"biomarker": string, "value": number, "concern": string, "urgency": string}],
  "trends": [{"biomarker": string, "trend": string, "timeframe": string}],
  "summary": string
}`;
        break;

      case "risk_assessment":
        prompt += `
**Analysis Request:**
Focus on risk assessment. Identify any biomarkers that indicate health risks, cardiovascular issues, metabolic problems, or other concerns. Provide urgency levels for any abnormal values.

Return JSON with risk-focused analysis.`;
        break;

      case "recommendations":
        prompt += `
**Analysis Request:**
Focus on actionable recommendations. Based on the biomarker data, provide specific, actionable advice for diet, exercise, lifestyle changes, and when to seek medical attention.

Return JSON with detailed recommendations.`;
        break;

      case "trends":
        prompt += `
**Analysis Request:**
Analyze biomarker trends over time. Identify improving, stable, or declining patterns and their health implications.

Return JSON with trend analysis.`;
        break;
    }

    prompt += `

**Important Guidelines:**
- Provide medical insights but always recommend consulting healthcare professionals
- Be specific and actionable in recommendations
- Flag any critical values that need immediate attention
- Use evidence-based medical knowledge
- Consider age, gender, and other factors in analysis
- Ensure all JSON is properly formatted and valid`;

    return prompt;
  }

  public async analyzeHealth(
    request: HealthAnalysisRequest
  ): Promise<HealthAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);
    const response = await this.invokeModel(prompt);

    try {
      // Parse the JSON response from Claude
      const analysisResult = JSON.parse(response);
      return analysisResult as HealthAnalysisResponse;
    } catch (error) {
      console.error("Failed to parse Bedrock response:", error);
      console.error("Raw response:", response);

      // Fallback response if parsing fails
      return {
        healthScore: 50,
        riskLevel: "MODERATE",
        keyFindings: ["Analysis temporarily unavailable"],
        recommendations: [],
        abnormalValues: [],
        trends: [],
        summary:
          "Health analysis is temporarily unavailable. Please try again later.",
      };
    }
  }

  public async getHealthInsights(
    userId: string
  ): Promise<HealthAnalysisResponse> {
    // This method will integrate with your existing database
    // to fetch user biomarkers and perform analysis
    try {
      // Import your existing database functions
      const { getBiomarkersByUserId } = await import("../database/biomarkers");
      const { getUserProfile } = await import("../database/users");

      const biomarkers = await getBiomarkersByUserId(userId);
      const userProfile = await getUserProfile(userId);

      if (!biomarkers || biomarkers.length === 0) {
        console.log("No biomarker data found, returning empty state response");

        return {
          healthScore: 0,
          riskLevel: "UNKNOWN" as RiskLevel,
          keyFindings: ["No health data available"],
          recommendations: [
            {
              category: "Getting Started",
              title: "Upload Your First Health Document",
              description:
                "Upload a blood test or health report to begin your personalized health analysis.",
              priority: "HIGH" as Priority,
            },
          ],
          abnormalValues: [],
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
          name: b.biomarker_name,
          value: Number(b.value),
          unit: b.unit || "",
          referenceRange: b.reference_range || "",
          isAbnormal: b.is_abnormal || false,
          testDate: b.test_date?.toISOString() || new Date().toISOString(),
        })),
        userProfile: {
          age: userProfile?.date_of_birth
            ? new Date().getFullYear() -
              new Date(userProfile.date_of_birth).getFullYear()
            : undefined,
          gender: userProfile?.gender || undefined,
          // Add height/weight if you have them in your user profile
        },
        analysisType: "comprehensive",
      };

      return await this.analyzeHealth(request);
    } catch (error) {
      console.error("Error getting health insights:", error);
      throw error;
    }
  }
}

export const bedrockAnalyzer = new BedrockHealthAnalyzer();
