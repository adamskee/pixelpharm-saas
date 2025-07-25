// File: src/lib/aws/bedrock-optimized.ts

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";

// Enhanced client with connection pooling and caching
const client = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || "us-east-1",
  credentials: fromEnv(),
  maxAttempts: 3, // Retry failed requests
  requestHandler: {
    metadata: { handlerProtocol: "h2" }, // Use HTTP/2 for better performance
  },
});

// Cache for storing recent analysis results
class AnalysisCache {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  set(key: string, value: any) {
    this.cache.set(key, { result: value, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  generateKey(request: HealthAnalysisRequest): string {
    // Create hash based on biomarkers and user profile
    const keyData = {
      biomarkers: request.biomarkers.map((b) => `${b.name}:${b.value}`),
      analysisType: request.analysisType,
      userAge: request.userProfile.age,
      userGender: request.userProfile.gender,
    };
    return btoa(JSON.stringify(keyData));
  }
}

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
  priority?: "standard" | "urgent"; // New priority field
  forceRefresh?: boolean; // Skip cache
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
    actionable?: boolean; // New field for UI prioritization
    evidenceLevel?: "high" | "moderate" | "low"; // Evidence strength
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: string;
    clinicalSignificance?: string; // Enhanced clinical context
  }>;
  trends: Array<{
    biomarker: string;
    trend: string;
    timeframe: string;
    confidence?: number; // Trend confidence score
  }>;
  summary: string;
  confidence: number;
  lastAnalysisDate: Date;
  dataCompleteness: number;
  trendAnalysis: any[];
  alerts: any[];
  processingTime?: number; // Performance tracking
  cacheHit?: boolean; // Cache performance
  modelVersion?: string; // Track which model was used
}

export class OptimizedBedrockHealthAnalyzer {
  private cache = new AnalysisCache();
  private readonly DEFAULT_MODEL = "anthropic.claude-3-haiku-20240307-v1:0";
  private readonly URGENT_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"; // Better model for urgent cases

  private async invokeModel(
    prompt: string,
    options: {
      modelId?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const {
        modelId = process.env.BEDROCK_MODEL_ID || this.DEFAULT_MODEL,
        maxTokens = 4000,
        temperature = 0.1,
      } = options;

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: maxTokens,
          temperature,
          system:
            "You are a professional medical AI assistant. Always provide evidence-based, accurate medical analysis in valid JSON format.",
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

      console.log(`Bedrock invocation took ${Date.now() - startTime}ms`);
      return responseBody.content[0].text;
    } catch (error) {
      console.error("Bedrock invocation error:", error);
      throw new Error(`Failed to analyze health data: ${error}`);
    }
  }

  private buildOptimizedPrompt(request: HealthAnalysisRequest): string {
    const { biomarkers, bodyComposition, userProfile, analysisType } = request;

    // Streamlined system prompt for better performance
    const systemPrompt = `# Medical Health Analysis System

You are an advanced AI medical analyst. Analyze patient data and provide evidence-based insights.

## Analysis Framework:
1. **Risk Stratification**: Assess cardiovascular, metabolic, and inflammatory risks
2. **Clinical Significance**: Prioritize findings by medical importance
3. **Evidence-Based Recommendations**: Use established medical guidelines
4. **Patient-Specific Context**: Consider age, gender, and medical history

## Critical Guidelines:
- Flag urgent values requiring immediate medical attention
- Provide specific, actionable recommendations
- Include confidence levels for all assessments
- Use standardized medical terminology
- Always include appropriate medical disclaimers

**IMPORTANT**: Return ONLY valid JSON matching the exact structure specified.`;

    // More efficient biomarker formatting
    const biomarkerSummary = biomarkers
      .map(
        (b) =>
          `${b.name}: ${b.value} ${b.unit} [${
            b.isAbnormal ? "ABNORMAL" : "NORMAL"
          }]`
      )
      .join("\n");

    // Simplified body composition data
    const bodyCompData = bodyComposition
      ? `Body Composition (${bodyComposition.testDate}): Weight: ${bodyComposition.totalWeight}kg, BF: ${bodyComposition.bodyFatPercentage}%`
      : "";

    // User context
    const userContext = `Patient: ${userProfile.age || "Unknown"}y, ${
      userProfile.gender || "Unknown"
    } gender`;

    // Analysis-specific instructions
    const analysisMap = {
      comprehensive:
        "Provide complete health assessment with risk analysis and recommendations.",
      risk_assessment: "Focus on identifying and quantifying health risks.",
      recommendations:
        "Prioritize actionable lifestyle and medical interventions.",
      trends: "Analyze patterns and project future health trajectories.",
    };

    // Optimized JSON schema
    const jsonSchema = `
{
  "healthScore": number (0-100),
  "riskLevel": "LOW|MODERATE|HIGH|CRITICAL",
  "keyFindings": [string],
  "recommendations": [{
    "category": string,
    "priority": "urgent|high|moderate|low",
    "recommendation": string,
    "reasoning": string,
    "actionable": boolean,
    "evidenceLevel": "high|moderate|low"
  }],
  "abnormalValues": [{
    "biomarker": string,
    "value": number,
    "concern": string,
    "urgency": "immediate|soon|routine",
    "clinicalSignificance": string
  }],
  "trends": [{
    "biomarker": string,
    "trend": "improving|stable|declining",
    "timeframe": string,
    "confidence": number
  }],
  "summary": string,
  "confidence": number (0-1)
}`;

    return `${systemPrompt}

## Patient Data:
${userContext}

## Laboratory Results:
${biomarkerSummary}

${bodyCompData}

## Analysis Request:
${analysisMap[analysisType]}

Return analysis as JSON: ${jsonSchema}

**Medical Disclaimer**: This analysis is for educational purposes only and does not constitute medical advice. All findings should be reviewed with a qualified healthcare provider.`;
  }

  public async analyzeHealth(
    request: HealthAnalysisRequest
  ): Promise<HealthAnalysisResponse> {
    const startTime = Date.now();

    try {
      // Check cache first (unless force refresh)
      const cacheHit = false;
      if (!request.forceRefresh) {
        const cacheKey = this.cache.generateKey(request);
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log("Cache hit for health analysis");
          return {
            ...cached,
            cacheHit: true,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // Choose model based on priority
      const modelOptions = {
        modelId:
          request.priority === "urgent"
            ? this.URGENT_MODEL
            : this.DEFAULT_MODEL,
        maxTokens: request.analysisType === "comprehensive" ? 5000 : 3000,
        temperature: 0.05, // Lower temperature for more consistent medical analysis
      };

      // Build optimized prompt
      const prompt = this.buildOptimizedPrompt(request);

      // Invoke model
      const response = await this.invokeModel(prompt, modelOptions);

      // Parse and validate response
      let analysisResult;
      try {
        analysisResult = JSON.parse(response);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.error("Raw response:", response);

        // Try to extract JSON from response if it's wrapped in markdown
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            analysisResult = JSON.parse(jsonMatch[1]);
            console.log("✅ Successfully extracted JSON from markdown wrapper");
          } catch (innerError) {
            console.error("Failed to parse extracted JSON:", innerError);
            throw new Error("Unable to parse Bedrock response as JSON");
          }
        } else {
          // Try to find any JSON-like content
          const directJsonMatch = response.match(/\{[\s\S]*\}/);
          if (directJsonMatch) {
            try {
              analysisResult = JSON.parse(directJsonMatch[0]);
              console.log("✅ Successfully extracted JSON from response");
            } catch (innerError) {
              throw new Error("Unable to parse Bedrock response as JSON");
            }
          } else {
            throw new Error("No valid JSON found in Bedrock response");
          }
        }
      }

      // Enhance response with metadata
      const enhancedResult: HealthAnalysisResponse = {
        ...analysisResult,
        confidence: analysisResult.confidence || 0.85,
        lastAnalysisDate: new Date(),
        dataCompleteness: Math.min(request.biomarkers.length * 8, 100),
        trendAnalysis: analysisResult.trends || [],
        alerts:
          analysisResult.abnormalValues?.filter(
            (v: any) => v.urgency === "immediate"
          ) || [],
        processingTime: Date.now() - startTime,
        cacheHit: false,
        modelVersion: modelOptions.modelId,
      };

      // Cache the result
      if (!request.forceRefresh) {
        const cacheKey = this.cache.generateKey(request);
        this.cache.set(cacheKey, enhancedResult);
      }

      return enhancedResult;
    } catch (error) {
      console.error("Health analysis error:", error);

      // Enhanced fallback response
      return {
        healthScore: 50,
        riskLevel: "UNKNOWN",
        keyFindings: [
          "Health analysis temporarily unavailable due to system error",
        ],
        recommendations: [
          {
            category: "system",
            priority: "low",
            recommendation:
              "Please try again in a few minutes. If the problem persists, contact support.",
            reasoning: "Temporary system error occurred during analysis.",
            actionable: false,
            evidenceLevel: "high",
          },
        ],
        abnormalValues: [],
        trends: [],
        summary:
          "Health analysis is temporarily unavailable. Your data is safe and will be analyzed once the system is restored.",
        confidence: 0,
        lastAnalysisDate: new Date(),
        dataCompleteness: 0,
        trendAnalysis: [],
        alerts: [],
        processingTime: Date.now() - startTime,
        cacheHit: false,
        modelVersion: "fallback",
      };
    }
  }

  // Batch analysis for multiple requests
  public async batchAnalyzeHealth(
    requests: HealthAnalysisRequest[]
  ): Promise<HealthAnalysisResponse[]> {
    console.log(`Processing batch of ${requests.length} health analyses`);

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results: HealthAnalysisResponse[] = [];

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map((request) => this.analyzeHealth(request))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // Get health insights with automatic fallback
  // Find this section in your bedrock-optimized.ts file and replace it:

  public async getHealthInsights(
    userId: string,
    biomarkers: any[],
    bodyComposition?: any,
    userProfile?: any
  ): Promise<HealthAnalysisResponse> {
    if (!biomarkers || biomarkers.length === 0) {
      throw new Error("No biomarker data available for analysis");
    }

    const request: HealthAnalysisRequest = {
      biomarkers: biomarkers.map((b) => ({
        name: b.biomarkerName || b.name,
        value: parseFloat(b.value.toString()),
        unit: b.unit || "",
        referenceRange: b.referenceRange || "Unknown",
        isAbnormal: b.isAbnormal || false,
        // FIX: Handle testDate properly
        testDate:
          b.testDate instanceof Date
            ? b.testDate.toISOString()
            : typeof b.testDate === "string"
            ? b.testDate
            : new Date().toISOString(),
      })),
      bodyComposition: bodyComposition
        ? {
            // FIX: Handle testDate properly
            testDate:
              bodyComposition.testDate instanceof Date
                ? bodyComposition.testDate.toISOString()
                : typeof bodyComposition.testDate === "string"
                ? bodyComposition.testDate
                : new Date().toISOString(),
            totalWeight: bodyComposition.totalWeight,
            bodyFatPercentage: bodyComposition.bodyFatPercentage,
            skeletalMuscleMass: bodyComposition.skeletalMuscleMass,
            visceralFatLevel: bodyComposition.visceralFatLevel,
            bmr: bodyComposition.bmr,
          }
        : undefined,
      userProfile: {
        age: userProfile?.dateOfBirth
          ? new Date().getFullYear() -
            new Date(userProfile.dateOfBirth).getFullYear()
          : undefined,
        gender: userProfile?.gender,
        weight: bodyComposition?.totalWeight,
      },
      analysisType: "comprehensive",
      priority: biomarkers.some((b) => b.isAbnormal) ? "urgent" : "standard",
    };

    return await this.analyzeHealth(request);
  }

  // Clear cache manually
  public clearCache(): void {
    this.cache = new AnalysisCache();
    console.log("Health analysis cache cleared");
  }
}

export const optimizedBedrockAnalyzer = new OptimizedBedrockHealthAnalyzer();
