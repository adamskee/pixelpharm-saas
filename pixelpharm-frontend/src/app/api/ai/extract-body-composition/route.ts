// File: src/app/api/ai/extract-body-composition/route.ts
// Fixed to use AWS SDK v3 and match your existing setup

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

// Configure AWS clients (matching your existing setup)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface BodyCompositionData {
  totalWeight?: number;
  bodyFatPercentage?: number;
  skeletalMuscleMass?: number;
  visceralFatLevel?: number;
  bmr?: number;
  muscle?: {
    dryLeanMass?: number;
    bodyMuscleMass?: number;
    rightArm?: number;
    leftArm?: number;
    trunk?: number;
    rightLeg?: number;
    leftLeg?: number;
  };
  fat?: {
    bodyFatMass?: number;
    percentBodyFat?: number;
    visceralFatLevel?: number;
  };
  water?: {
    totalBodyWater?: number;
    intracellularWater?: number;
    extracellularWater?: number;
  };
  mineral?: {
    boneMineralContent?: number;
  };
  metabolic?: {
    bmr?: number;
    proteinMass?: number;
    mineralMass?: number;
  };
  testDate?: string;
  labName?: string;
  deviceModel?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileKey, uploadType } = await request.json();

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    console.log(`🏋️ Starting body composition extraction for: ${fileKey}`);
    console.log(`📁 Retrieving file from S3...`);

    // Get file from S3 using AWS SDK v3
    try {
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: fileKey,
        })
      );

      if (!s3Response.Body) {
        throw new Error("File not found in S3");
      }

      console.log(`🔍 Starting Textract OCR for body composition...`);

      // Extract text using Textract
      const textractResponse = await textractClient.send(
        new DetectDocumentTextCommand({
          Document: {
            S3Object: {
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Name: fileKey,
            },
          },
        })
      );

      if (!textractResponse.Blocks) {
        throw new Error("No text detected in document");
      }

      // Extract text content
      const extractedText = textractResponse.Blocks.filter(
        (block) => block.BlockType === "LINE"
      )
        .map((block) => block.Text || "")
        .join("\n");

      console.log(
        `📝 Extracted text length: ${extractedText.length} characters`
      );

      // Process body composition data
      const bodyCompositionData = extractBodyCompositionData(extractedText);

      console.log(
        `🎯 Found body composition metrics:`,
        Object.keys(bodyCompositionData)
      );

      // Calculate confidence score
      const confidence = calculateConfidence(
        bodyCompositionData,
        extractedText
      );

      const result = {
        success: true,
        confidence:
          confidence >= 0.7 ? "high" : confidence >= 0.4 ? "medium" : "low",
        confidenceScore: confidence,
        extractedText: extractedText.substring(0, 1000), // First 1000 chars for debugging
        bodyComposition: bodyCompositionData,
        processingInfo: {
          fileKey,
          uploadType,
          extractionDate: new Date().toISOString(),
          detectedDevice: detectDevice(extractedText),
          textLength: extractedText.length,
          metricsFound: Object.keys(bodyCompositionData).length,
        },
      };

      console.log(
        `✅ Body composition extraction completed with ${confidence.toFixed(
          2
        )} confidence`
      );

      return NextResponse.json(result);
    } catch (awsError: any) {
      console.error("❌ AWS service error:", awsError);

      // If AWS services fail, provide a fallback response
      return NextResponse.json(
        {
          success: false,
          error: "AWS processing failed",
          details: awsError.message,
          fallback: true,
          message:
            "File uploaded successfully but AI analysis is temporarily unavailable",
        },
        { status: 503 }
      ); // Service Unavailable
    }
  } catch (error: any) {
    console.error("❌ Body composition extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract body composition data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function extractBodyCompositionData(text: string): BodyCompositionData {
  const data: BodyCompositionData = {};
  const lines = text.toLowerCase().split("\n");

  // Weight patterns
  const weightPatterns = [
    /(?:total\s*)?weight[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
    /body\s*weight[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
    /wt[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
  ];

  // Body fat patterns
  const bodyFatPatterns = [
    /(?:percent\s*)?body\s*fat[:\s%]*(\d+\.?\d*)\s*%?/i,
    /body\s*fat\s*percentage[:\s%]*(\d+\.?\d*)\s*%?/i,
    /bf[:\s%]*(\d+\.?\d*)\s*%?/i,
    /fat[:\s%]*(\d+\.?\d*)\s*%/i,
  ];

  // Muscle mass patterns
  const musclePatterns = [
    /skeletal\s*muscle\s*mass[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
    /muscle\s*mass[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
    /lean\s*mass[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
    /smm[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i,
  ];

  // Visceral fat patterns
  const visceralPatterns = [
    /visceral\s*fat[:\s]*(\d+\.?\d*)/i,
    /vf[:\s]*(\d+\.?\d*)/i,
    /visceral\s*fat\s*level[:\s]*(\d+\.?\d*)/i,
  ];

  // BMR patterns
  const bmrPatterns = [
    /bmr[:\s]*(\d+\.?\d*)\s*(?:kcal|cal)?/i,
    /basal\s*metabolic\s*rate[:\s]*(\d+\.?\d*)\s*(?:kcal|cal)?/i,
    /metabolic\s*rate[:\s]*(\d+\.?\d*)\s*(?:kcal|cal)?/i,
  ];

  // Extract weight
  for (const pattern of weightPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.totalWeight = parseFloat(match[1]);
      break;
    }
  }

  // Extract body fat percentage
  for (const pattern of bodyFatPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.bodyFatPercentage = parseFloat(match[1]);
      break;
    }
  }

  // Extract muscle mass
  for (const pattern of musclePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.skeletalMuscleMass = parseFloat(match[1]);
      break;
    }
  }

  // Extract visceral fat
  for (const pattern of visceralPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.visceralFatLevel = parseFloat(match[1]);
      break;
    }
  }

  // Extract BMR
  for (const pattern of bmrPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.bmr = parseFloat(match[1]);
      break;
    }
  }

  // Extract test date
  const datePatterns = [
    /(?:test\s*date|date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.testDate = match[1];
      break;
    }
  }

  // Extract additional metrics for InBody scans
  if (text.toLowerCase().includes("inbody")) {
    // Total Body Water
    const tbwMatch = text.match(
      /total\s*body\s*water[:\s]*(\d+\.?\d*)\s*(?:l|liters?)/i
    );
    if (tbwMatch) {
      data.water = { totalBodyWater: parseFloat(tbwMatch[1]) };
    }

    // Protein Mass
    const proteinMatch = text.match(
      /protein[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i
    );
    if (proteinMatch) {
      data.metabolic = {
        ...data.metabolic,
        proteinMass: parseFloat(proteinMatch[1]),
      };
    }

    // Mineral Mass
    const mineralMatch = text.match(
      /mineral[:\s]*(\d+\.?\d*)\s*(?:kg|lb|lbs)/i
    );
    if (mineralMatch) {
      data.metabolic = {
        ...data.metabolic,
        mineralMass: parseFloat(mineralMatch[1]),
      };
    }
  }

  return data;
}

function detectDevice(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("inbody")) {
    if (lowerText.includes("570")) return "InBody 570";
    if (lowerText.includes("770")) return "InBody 770";
    if (lowerText.includes("970")) return "InBody 970";
    return "InBody Scanner";
  }

  if (lowerText.includes("dexa") || lowerText.includes("dxa"))
    return "DEXA Scanner";
  if (lowerText.includes("bod pod")) return "Bod Pod";
  if (lowerText.includes("hydrostatic")) return "Hydrostatic Weighing";

  return "Unknown Device";
}

function calculateConfidence(data: BodyCompositionData, text: string): number {
  let score = 0;
  let maxScore = 0;

  // Core metrics scoring
  if (data.totalWeight !== undefined) {
    score += 20;
  }
  maxScore += 20;

  if (data.bodyFatPercentage !== undefined) {
    score += 25;
  }
  maxScore += 25;

  if (data.skeletalMuscleMass !== undefined) {
    score += 20;
  }
  maxScore += 20;

  if (data.visceralFatLevel !== undefined) {
    score += 15;
  }
  maxScore += 15;

  if (data.bmr !== undefined) {
    score += 10;
  }
  maxScore += 10;

  if (data.testDate) {
    score += 10;
  }
  maxScore += 10;

  // Device detection bonus
  const device = detectDevice(text);
  if (device !== "Unknown Device") {
    score += 10;
    maxScore += 10;
  }

  return maxScore > 0 ? score / maxScore : 0;
}
