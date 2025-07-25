// File: src/app/api/test/optimized-bedrock/route.ts
// Copy this entire code into the file

import { NextResponse } from "next/server";
import { optimizedBedrockAnalyzer } from "@/lib/aws/bedrock-optimized";

export async function GET() {
  try {
    console.log("=== TESTING OPTIMIZED BEDROCK ANALYZER ===");

    // Mock biomarker data for testing
    const mockBiomarkers = [
      {
        name: "Total Cholesterol",
        value: 220,
        unit: "mg/dL",
        referenceRange: "<200",
        isAbnormal: true,
        testDate: new Date().toISOString(),
      },
      {
        name: "HDL Cholesterol",
        value: 45,
        unit: "mg/dL",
        referenceRange: ">40",
        isAbnormal: false,
        testDate: new Date().toISOString(),
      },
      {
        name: "Glucose",
        value: 95,
        unit: "mg/dL",
        referenceRange: "70-100",
        isAbnormal: false,
        testDate: new Date().toISOString(),
      },
    ];

    const mockUserProfile = {
      age: 35,
      gender: "male",
      height: 175,
      weight: 80,
    };

    // Test the optimized analyzer
    console.log("Testing optimized health analysis...");
    const startTime = Date.now();

    const result = await optimizedBedrockAnalyzer.getHealthInsights(
      "test-user",
      mockBiomarkers,
      undefined,
      mockUserProfile
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${totalTime}ms`);

    // Test cache functionality
    console.log("Testing cache functionality...");
    const cacheStartTime = Date.now();

    const cachedResult = await optimizedBedrockAnalyzer.getHealthInsights(
      "test-user",
      mockBiomarkers,
      undefined,
      mockUserProfile
    );

    const cacheTime = Date.now() - cacheStartTime;
    console.log(`✅ Cached analysis completed in ${cacheTime}ms`);

    return NextResponse.json({
      success: true,
      message: "Optimized Bedrock analyzer working perfectly!",
      performance: {
        firstAnalysis: `${totalTime}ms`,
        cachedAnalysis: `${cacheTime}ms`,
        speedImprovement: `${Math.round(
          ((totalTime - cacheTime) / totalTime) * 100
        )}%`,
      },
      result: {
        healthScore: result.healthScore,
        riskLevel: result.riskLevel,
        keyFindings: result.keyFindings?.slice(0, 3), // First 3 findings
        processingTime: result.processingTime,
        cacheHit: result.cacheHit,
        modelVersion: result.modelVersion,
        confidence: result.confidence,
      },
      cachedResult: {
        cacheHit: cachedResult.cacheHit,
        processingTime: cachedResult.processingTime,
      },
    });
  } catch (error: any) {
    console.error("Error testing optimized analyzer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: "Check the console for full error details",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Test with custom priority
    const mockRequest = {
      biomarkers: [
        {
          name: "Creatinine",
          value: 2.5, // High value - should trigger urgent priority
          unit: "mg/dL",
          referenceRange: "0.6-1.2",
          isAbnormal: true,
          testDate: new Date().toISOString(),
        },
      ],
      userProfile: { age: 45, gender: "female" },
      analysisType: "comprehensive" as const,
      priority: "urgent" as const,
      forceRefresh: true,
    };

    console.log("Testing urgent priority analysis...");
    const urgentResult = await optimizedBedrockAnalyzer.analyzeHealth(
      mockRequest
    );

    return NextResponse.json({
      success: true,
      message: "Urgent analysis completed",
      result: {
        modelUsed: urgentResult.modelVersion,
        processingTime: urgentResult.processingTime,
        riskLevel: urgentResult.riskLevel,
        urgentAlerts: urgentResult.alerts?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
