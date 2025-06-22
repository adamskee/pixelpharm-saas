import { NextResponse } from "next/server";
import { bedrockAnalyzer } from "@/lib/aws/bedrock";

export async function GET() {
  try {
    const testRequest = {
      biomarkers: [
        {
          name: "Total Cholesterol",
          value: 220,
          unit: "mg/dL",
          referenceRange: "<200",
          isAbnormal: true,
          testDate: new Date().toISOString(),
        },
      ],
      userProfile: { age: 35, gender: "male" },
      analysisType: "comprehensive" as const,
    };

    const result = await bedrockAnalyzer.analyzeHealth(testRequest);
    return NextResponse.json({
      success: true,
      result,
      message: "Bedrock integration working!",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
