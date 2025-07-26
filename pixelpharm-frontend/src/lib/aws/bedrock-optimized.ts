// File: src/lib/aws/bedrock-optimized.ts
// Replace the ENTIRE contents with this corrected version

import { BedrockRuntime } from "@aws-sdk/client-bedrock-runtime";

// Types
interface HealthAnalysisRequest {
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
  userProfile?: {
    age?: number;
    gender?: string;
    weight?: number;
  };
  analysisType: "standard" | "comprehensive" | "urgent";
  priority?: "low" | "standard" | "high" | "urgent";
  forceRefresh?: boolean;
}

interface HealthAnalysisResponse {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  keyFindings: string[];
  recommendations: Array<{
    category: string;
    priority: "low" | "moderate" | "high";
    recommendation: string;
    reasoning: string;
    actionable?: boolean;
    evidenceLevel?: "low" | "moderate" | "high";
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: "routine" | "soon" | "urgent";
    clinicalSignificance: string;
  }>;
  trends: any[];
  summary: string;
  confidence: number;
  lastAnalysisDate: Date;
  dataCompleteness: number;
  processingTime?: number;
  cacheHit?: boolean;
  modelVersion?: string;
  trendAnalysis?: any[];
  alerts?: any[];
}

// Cache interface
interface CacheEntry {
  data: HealthAnalysisResponse;
  timestamp: number;
  ttl: number;
}

export class OptimizedBedrockHealthAnalyzer {
  private client: BedrockRuntime;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTTL = 10 * 60 * 1000; // 10 minutes
  private requestCount = 0;
  private cacheHits = 0;

  constructor() {
    this.client = new BedrockRuntime({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private generateCacheKey(request: HealthAnalysisRequest): string {
    const biomarkerData = request.biomarkers
      .map((b) => `${b.name}:${b.value}`)
      .sort()
      .join("|");

    const bodyCompData = request.bodyComposition
      ? `bc:${request.bodyComposition.totalWeight || 0}:${
          request.bodyComposition.bodyFatPercentage || 0
        }`
      : "bc:none";

    return `health_analysis:${biomarkerData}:${bodyCompData}:${request.analysisType}`;
  }

  private getCachedResult(cacheKey: string): HealthAnalysisResponse | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    this.cacheHits++;
    return {
      ...entry.data,
      cacheHit: true,
      processingTime: 0,
    };
  }

  private setCachedResult(
    cacheKey: string,
    data: HealthAnalysisResponse
  ): void {
    this.cache.set(cacheKey, {
      data: { ...data, cacheHit: false },
      timestamp: Date.now(),
      ttl: this.cacheTTL,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async invokeModelWithRetry(
    prompt: string,
    modelId: string,
    attempt = 1
  ): Promise<string> {
    const maxRetries = 3;
    const baseDelay = 1000;

    try {
      const startTime = Date.now();
      console.log(
        `🤖 Bedrock invocation attempt ${attempt}/${maxRetries} using ${modelId}`
      );

      const response = await this.client.invokeModel({
        modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          temperature: 0.3,
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

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log(`✅ Bedrock invocation took ${Date.now() - startTime}ms`);

      if (!responseBody?.content?.[0]?.text) {
        throw new Error("Invalid response format from Bedrock");
      }

      return responseBody.content[0].text;
    } catch (error: any) {
      console.error(`❌ Bedrock invocation error (attempt ${attempt}):`, error);

      // Handle throttling with exponential backoff
      if (error.name === "ThrottlingException" && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `⏳ Throttled, waiting ${delay}ms before retry ${
            attempt + 1
          }/${maxRetries}`
        );

        await this.sleep(delay);
        return this.invokeModelWithRetry(prompt, modelId, attempt + 1);
      }

      // Handle other retryable errors
      if (
        attempt < maxRetries &&
        (error.name === "ServiceUnavailableException" ||
          error.name === "InternalServerException" ||
          error.$metadata?.httpStatusCode >= 500)
      ) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `⏳ Retryable error, waiting ${delay}ms before retry ${
            attempt + 1
          }/${maxRetries}`
        );

        await this.sleep(delay);
        return this.invokeModelWithRetry(prompt, modelId, attempt + 1);
      }

      throw new Error(
        `Bedrock invocation failed after ${attempt} attempts: ${error.message}`
      );
    }
  }

  private parseAIResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.log(
        "JSON parsing failed, attempting to extract from markdown wrapper"
      );

      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[1]);
          console.log("✅ Successfully extracted JSON from markdown wrapper");
          return extractedJson;
        } catch (extractError) {
          console.error("Failed to parse extracted JSON:", extractError);
        }
      }

      // Try to find JSON without markdown wrapper
      const cleanResponse = response.replace(/```json\s*|\s*```/g, "").trim();
      if (cleanResponse.startsWith("{") && cleanResponse.endsWith("}")) {
        try {
          return JSON.parse(cleanResponse);
        } catch (cleanError) {
          console.error("Failed to parse cleaned JSON:", cleanError);
        }
      }

      // Try to extract just the content between first { and last }
      const firstBrace = response.indexOf("{");
      const lastBrace = response.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const extractedContent = response.substring(
            firstBrace,
            lastBrace + 1
          );
          return JSON.parse(extractedContent);
        } catch (contentError) {
          console.error("Failed to parse extracted content:", contentError);
        }
      }

      console.error(
        "Raw response that failed to parse:",
        response.substring(0, 500) + "..."
      );
      throw new Error(
        `Unable to parse AI response as JSON: ${parseError.message}`
      );
    }
  }

  private getFallbackAnalysis(biomarkers: any[]): HealthAnalysisResponse {
    const abnormalBiomarkers = biomarkers.filter((b) => b.isAbnormal);
    const healthScore = Math.max(85 - abnormalBiomarkers.length * 5, 40);

    return {
      healthScore,
      riskLevel: abnormalBiomarkers.length > 3 ? "MODERATE" : "LOW",
      keyFindings:
        abnormalBiomarkers.length > 0
          ? abnormalBiomarkers.map((b) => `Elevated ${b.name}`)
          : ["All biomarkers within normal ranges"],
      recommendations: [
        {
          category: "General",
          priority: "moderate",
          recommendation:
            abnormalBiomarkers.length > 0
              ? "Consult with healthcare provider about elevated biomarkers"
              : "Maintain current healthy lifestyle practices",
          reasoning: "Based on biomarker analysis",
          actionable: true,
          evidenceLevel: "moderate",
        },
      ],
      abnormalValues: abnormalBiomarkers.map((b) => ({
        biomarker: b.name,
        value: b.value,
        concern: "Outside reference range",
        urgency: "routine" as const,
        clinicalSignificance: "Requires monitoring and potential intervention",
      })),
      trends: [],
      summary:
        abnormalBiomarkers.length > 0
          ? `Analysis shows ${abnormalBiomarkers.length} biomarker(s) outside normal ranges. AI analysis temporarily unavailable - fallback analysis provided.`
          : "All biomarkers appear within normal ranges. AI analysis temporarily unavailable - fallback analysis provided.",
      confidence: 0.6,
      lastAnalysisDate: new Date(),
      dataCompleteness: biomarkers.length > 0 ? 0.8 : 0,
      trendAnalysis: [],
      alerts: [],
      modelVersion: "fallback-v1.0",
    };
  }

  private buildHealthAnalysisPrompt(request: HealthAnalysisRequest): string {
    return `Analyze this health data and return ONLY valid JSON (no markdown, no explanations):

Biomarkers: ${JSON.stringify(request.biomarkers.slice(0, 10))}
${
  request.bodyComposition
    ? `Body Composition: ${JSON.stringify(request.bodyComposition)}`
    : ""
}
User: ${request.userProfile?.gender || "unknown"}, age ${
      request.userProfile?.age || "unknown"
    }

Return JSON format:
{
  "healthScore": number (0-100),
  "riskLevel": "LOW"|"MODERATE"|"HIGH",
  "keyFindings": [string],
  "recommendations": [{
    "category": string,
    "priority": "low"|"moderate"|"high", 
    "recommendation": string,
    "reasoning": string,
    "actionable": boolean,
    "evidenceLevel": "low"|"moderate"|"high"
  }],
  "abnormalValues": [{
    "biomarker": string,
    "value": number,
    "concern": string,
    "urgency": "routine"|"soon"|"urgent",
    "clinicalSignificance": string
  }],
  "trends": [],
  "summary": string,
  "confidence": number (0-1)
}

Respond with ONLY the JSON object, no other text.`;
  }

  // File: src/lib/aws/bedrock-optimized.ts
  // Update the analyzeHealth method around line 360-385

  async analyzeHealth(
    request: HealthAnalysisRequest
  ): Promise<HealthAnalysisResponse> {
    this.requestCount++;
    const startTime = Date.now();

    try {
      // Check cache first (unless forceRefresh is true)
      if (!request.forceRefresh) {
        const cacheKey = this.generateCacheKey(request);
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
          console.log("✅ Cache hit - returning cached analysis");
          return cachedResult;
        }
      }

      // FIXED: Use models that are more likely to be available
      // Try Claude 3 Haiku first (most common), fallback to others
      let modelId = "anthropic.claude-3-haiku-20240307-v1:0";

      // For urgent cases, still try Sonnet but with fallback
      if (request.priority === "urgent" || request.priority === "high") {
        modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
      }

      console.log(`🤖 Attempting analysis with model: ${modelId}`);

      try {
        const prompt = this.buildHealthAnalysisPrompt(request);
        const response = await this.invokeModelWithRetry(prompt, modelId);
        const analysisResult = this.parseAIResponse(response);

        const processingTime = Date.now() - startTime;

        const result: HealthAnalysisResponse = {
          ...analysisResult,
          lastAnalysisDate: new Date(),
          dataCompleteness: request.biomarkers.length / 20, // Assume 20 is complete panel
          processingTime,
          cacheHit: false,
          modelVersion: modelId,
          trendAnalysis: analysisResult.trendAnalysis || [],
          alerts: analysisResult.alerts || [],
        };

        // Cache the result
        if (!request.forceRefresh) {
          const cacheKey = this.generateCacheKey(request);
          this.setCachedResult(cacheKey, result);
        }

        console.log("✅ Health analysis completed successfully");
        return result;
      } catch (modelError: any) {
        // If Claude 3 models fail, try older models
        console.log(`❌ ${modelId} failed, trying fallback models...`);

        const fallbackModels = [
          "anthropic.claude-v2:1",
          "anthropic.claude-v2",
          "anthropic.claude-instant-v1",
        ];

        for (const fallbackModel of fallbackModels) {
          try {
            console.log(`🔄 Trying fallback model: ${fallbackModel}`);
            const prompt = this.buildHealthAnalysisPrompt(request);
            const response = await this.invokeModelWithRetry(
              prompt,
              fallbackModel
            );
            const analysisResult = this.parseAIResponse(response);

            const processingTime = Date.now() - startTime;

            return {
              ...analysisResult,
              lastAnalysisDate: new Date(),
              dataCompleteness: request.biomarkers.length / 20,
              processingTime,
              cacheHit: false,
              modelVersion: fallbackModel,
              trendAnalysis: analysisResult.trendAnalysis || [],
              alerts: analysisResult.alerts || [],
            };
          } catch (fallbackError) {
            console.log(`❌ Fallback model ${fallbackModel} also failed`);
            continue;
          }
        }

        // If all models fail, return comprehensive fallback
        console.log(
          "❌ All Bedrock models failed, using local fallback analysis"
        );
        return this.getFallbackAnalysis(request.biomarkers);
      }
    } catch (error) {
      console.error("Health analysis error:", error);
      return this.getFallbackAnalysis(request.biomarkers);
    }
  }

  // Also update the getFallbackAnalysis method to be more comprehensive:
  private getFallbackAnalysis(biomarkers: any[]): HealthAnalysisResponse {
    const abnormalBiomarkers = biomarkers.filter((b) => b.isAbnormal);
    const healthScore = Math.max(85 - abnormalBiomarkers.length * 5, 40);

    return {
      healthScore,
      riskLevel:
        abnormalBiomarkers.length > 3
          ? "MODERATE"
          : abnormalBiomarkers.length > 1
          ? "LOW"
          : "LOW",
      keyFindings:
        abnormalBiomarkers.length > 0
          ? abnormalBiomarkers.map(
              (b) =>
                `${b.name}: ${b.value} ${b.unit} (ref: ${b.referenceRange})`
            )
          : ["All biomarkers within normal ranges"],
      recommendations: [
        {
          category: "General",
          priority: abnormalBiomarkers.length > 2 ? "high" : "moderate",
          recommendation:
            abnormalBiomarkers.length > 0
              ? "Consult with healthcare provider about elevated biomarkers and consider lifestyle modifications"
              : "Continue maintaining healthy lifestyle practices",
          reasoning: "Based on biomarker reference range analysis",
          actionable: true,
          evidenceLevel: "moderate",
        },
        {
          category: "Monitoring",
          priority: "moderate",
          recommendation:
            "Schedule follow-up testing in 3-6 months to track health trends",
          reasoning:
            "Regular monitoring helps detect changes early and assess intervention effectiveness",
          actionable: true,
          evidenceLevel: "high",
        },
      ],
      abnormalValues: abnormalBiomarkers.map((b) => ({
        biomarker: b.name,
        value: b.value,
        concern: "Outside reference range - requires attention",
        urgency:
          b.value >
          parseFloat(
            b.referenceRange.split("-")[1] ||
              b.referenceRange.replace(/[<>]/g, "")
          ) *
            1.5
            ? "soon"
            : "routine",
        clinicalSignificance:
          "Biomarker outside normal range may indicate need for lifestyle changes or medical evaluation",
      })),
      trends: [],
      summary:
        abnormalBiomarkers.length > 0
          ? `Analysis shows ${abnormalBiomarkers.length} biomarker(s) outside normal ranges. AI analysis temporarily unavailable - basic reference range analysis provided. Consider consulting with healthcare provider for personalized recommendations.`
          : "All biomarkers appear within normal ranges based on reference range analysis. AI analysis temporarily unavailable - continue healthy practices and regular monitoring.",
      confidence: 0.6,
      lastAnalysisDate: new Date(),
      dataCompleteness: biomarkers.length > 0 ? 0.8 : 0,
      trendAnalysis: [
        {
          category: "Overall",
          status: abnormalBiomarkers.length > 2 ? "needs_attention" : "stable",
          trend: "stable",
          riskFactors: abnormalBiomarkers.map((b) =>
            b.name.toLowerCase().replace(/\s+/g, "_")
          ),
          recommendations:
            abnormalBiomarkers.length > 0
              ? ["lifestyle_modification", "medical_consultation"]
              : ["maintain_current_practices"],
        },
      ],
      alerts:
        abnormalBiomarkers.length > 3
          ? [
              {
                type: "moderate",
                message: "Multiple biomarkers outside normal range",
                actionRequired: "Healthcare provider consultation recommended",
                urgency: "routine",
              },
            ]
          : [],
      modelVersion: "fallback-analysis-v2.0",
      processingTime: 50, // Fast fallback processing
    };
  }

  async getHealthInsights(
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
        testDate:
          b.testDate instanceof Date
            ? b.testDate.toISOString()
            : typeof b.testDate === "string"
            ? b.testDate
            : new Date().toISOString(),
      })),
      bodyComposition: bodyComposition
        ? {
            testDate:
              bodyComposition.testDate instanceof Date
                ? bodyComposition.testDate.toISOString()
                : typeof bodyComposition.testDate === "string"
                ? bodyComposition.testDate
                : new Date().toISOString(),
            totalWeight: bodyComposition.totalWeight || undefined,
            bodyFatPercentage: bodyComposition.bodyFatPercentage || undefined,
            skeletalMuscleMass: bodyComposition.skeletalMuscleMass || undefined,
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
  }

  // Performance metrics
  getPerformanceMetrics() {
    return {
      totalRequests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheHitRate:
        this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0,
      cacheSize: this.cache.size,
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log("🧹 Cache cleared");
  }
}

// Export singleton instance
export const optimizedBedrockAnalyzer = new OptimizedBedrockHealthAnalyzer();
