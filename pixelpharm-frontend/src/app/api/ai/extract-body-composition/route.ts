// File: src/app/api/ai/extract-body-composition/route.ts
// Updated to use Claude API instead of Textract OCR (matching blood test pipeline)

import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const s3Client = new S3Client({
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("🏋️ Claude Body Composition API called");
    console.log("🔐 Environment check:");
    console.log("- ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
    console.log("- AWS_S3_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);
    console.log("- AWS_REGION:", process.env.AWS_REGION || "us-east-1");

    const requestBody = await request.json();
    console.log("📥 Full request body:", JSON.stringify(requestBody, null, 2));

    const { fileKey, uploadType = "BODY_COMPOSITION" } = requestBody;
    console.log("🎯 Processing body composition scan:", { fileKey, uploadType });

    if (!fileKey) {
      console.error("❌ No fileKey provided in request");
      return NextResponse.json(
        { error: "File key is required", receivedBody: requestBody },
        { status: 400 }
      );
    }

    console.log("🧠 Starting Claude analysis for body composition:", fileKey);

    // Get image from S3
    console.log("📁 Retrieving image from S3...");
    console.log("📁 S3 Bucket:", process.env.AWS_S3_BUCKET_NAME);
    console.log("📁 S3 Key:", fileKey);
    
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    let s3Response;
    try {
      s3Response = await s3Client.send(getObjectCommand);
    } catch (s3Error: any) {
      console.error("❌ S3 GetObject failed:", s3Error);
      console.error("❌ S3 Error details:", {
        code: s3Error.name,
        message: s3Error.message,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: fileKey
      });
      
      throw new Error(`S3 file retrieval failed: ${s3Error.message}. Check if the file was uploaded successfully with key: ${fileKey}`);
    }

    if (!s3Response.Body) {
      throw new Error("Failed to retrieve image from S3 - empty response body");
    }
    
    console.log("✅ Successfully retrieved file from S3");

    // Convert to base64 for Claude
    const imageBuffer = await streamToBuffer(s3Response.Body as any);
    const base64Image = imageBuffer.toString("base64");
    
    // Determine proper MIME type based on file extension
    let mimeType = "image/jpeg"; // default
    if (fileKey.endsWith(".pdf")) {
      mimeType = "application/pdf";
    } else if (fileKey.endsWith(".png")) {
      mimeType = "image/png";
    } else if (fileKey.endsWith(".webp")) {
      mimeType = "image/webp";
    } else if (fileKey.endsWith(".gif")) {
      mimeType = "image/gif";
    } else if (fileKey.endsWith(".jpeg") || fileKey.endsWith(".jpg")) {
      mimeType = "image/jpeg";
    }
    
    console.log(`📎 File type detected: ${mimeType} from ${fileKey}`);

    console.log(
      `📊 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // Enhanced Claude prompt for body composition analysis
    const claudePrompt = `You are an expert body composition analysis AI. Please analyze this body composition scan image and extract ALL metrics with extreme precision.

EXTRACTION REQUIREMENTS:
1. Extract every numerical value with its corresponding metric name
2. Include units (kg, %, L, kcal, etc.)
3. Identify the device type (InBody 570/770/970, DEXA, Bod Pod, etc.)
4. Extract test date and any facility information
5. Categorize measurements into muscle, fat, water, mineral, and metabolic data
6. Calculate derived metrics if possible

CRITICAL ACCURACY FACTORS:
- OCR this image with 100% accuracy for all numerical values
- Pay special attention to decimal points and units
- Distinguish between similar numbers (e.g., 6 vs 8, 1 vs I)
- Capture both raw measurements and percentages
- Include segmental analysis data (arms, legs, trunk) if present
- Look for InBody-specific metrics like ECW/TBW ratios

COMMON BODY COMPOSITION METRICS TO EXTRACT:
- Total Weight, Body Fat %, Skeletal Muscle Mass
- Visceral Fat Level, BMR (Basal Metabolic Rate)
- Total Body Water, Protein Mass, Mineral Mass
- Dry Lean Mass, Body Fat Mass
- Segmental muscle/fat distribution
- Phase Angle, ECW/TBW ratio (for InBody scans)

FORMAT RESPONSE AS JSON:
{
  "bodyComposition": {
    "totalWeight": 75.2,
    "bodyFatPercentage": 18.5,
    "skeletalMuscleMass": 32.1,
    "visceralFatLevel": 8,
    "bmr": 1650,
    "muscle": {
      "dryLeanMass": 14.2,
      "bodyMuscleMass": 32.1,
      "rightArm": 3.2,
      "leftArm": 3.1,
      "trunk": 19.8,
      "rightLeg": 8.9,
      "leftLeg": 8.7
    },
    "fat": {
      "bodyFatMass": 14.1,
      "percentBodyFat": 18.5,
      "visceralFatLevel": 8
    },
    "water": {
      "totalBodyWater": 43.2,
      "intracellularWater": 28.1,
      "extracellularWater": 15.1
    },
    "mineral": {
      "boneMineralContent": 3.1
    },
    "metabolic": {
      "bmr": 1650,
      "proteinMass": 11.2,
      "mineralMass": 3.8
    }
  },
  "deviceInfo": {
    "deviceModel": "InBody 570",
    "testDate": "2024-07-25",
    "facilityName": "HealthCenter ABC"
  },
  "extractedText": "full text content from scan...",
  "confidence": "high"
}

Please analyze this body composition scan now:`;

    // Call Claude Vision API
    console.log("🧠 Sending image to Claude for body composition analysis...");

    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: claudePrompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const responseContent = claudeResponse.content[0];
    if (responseContent.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse Claude's JSON response
    let parsedData;
    try {
      // Extract JSON from Claude's response (may be wrapped in markdown)
      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", parseError);
      // Fallback: create structured data from text response
      parsedData = {
        bodyComposition: extractBodyCompositionFromText(responseContent.text),
        deviceInfo: {},
        extractedText: responseContent.text,
        confidence: "medium",
      };
    }

    // Process and enhance the body composition data
    const bodyCompositionData = {
      totalWeight: parsedData.bodyComposition?.totalWeight,
      bodyFatPercentage: parsedData.bodyComposition?.bodyFatPercentage,
      skeletalMuscleMass: parsedData.bodyComposition?.skeletalMuscleMass,
      visceralFatLevel: parsedData.bodyComposition?.visceralFatLevel,
      bmr: parsedData.bodyComposition?.bmr,
      testDate: parsedData.deviceInfo?.testDate,
      labName: parsedData.deviceInfo?.facilityName,
      deviceModel: parsedData.deviceInfo?.deviceModel,
      ...parsedData.bodyComposition, // Include all extracted data
    };

    // Calculate confidence score
    const confidence = calculateConfidence(bodyCompositionData, responseContent.text);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Claude body composition analysis completed in ${processingTime}ms`);
    console.log(`🏋️ Extracted metrics:`, Object.keys(bodyCompositionData));

    const result = {
      success: true,
      confidence: confidence >= 0.7 ? "high" : confidence >= 0.4 ? "medium" : "low",
      confidenceScore: confidence,
      extractedText: parsedData.extractedText || responseContent.text,
      bodyComposition: bodyCompositionData,
      processingInfo: {
        fileKey,
        uploadType,
        extractionDate: new Date().toISOString(),
        detectedDevice: parsedData.deviceInfo?.deviceModel || detectDevice(responseContent.text),
        textLength: responseContent.text.length,
        metricsFound: Object.keys(bodyCompositionData).filter(key => 
          bodyCompositionData[key as keyof typeof bodyCompositionData] !== undefined
        ).length,
        processingTime,
        aiModel: "claude-3-5-sonnet-20241022",
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Claude body composition analysis failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Claude body composition analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// Fallback body composition extraction for non-JSON responses
function extractBodyCompositionFromText(text: string): BodyCompositionData {
  const data: BodyCompositionData = {};
  const lowerText = text.toLowerCase();

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

  // Extract measurements using patterns
  for (const pattern of weightPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.totalWeight = parseFloat(match[1]);
      break;
    }
  }

  for (const pattern of bodyFatPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.bodyFatPercentage = parseFloat(match[1]);
      break;
    }
  }

  for (const pattern of musclePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.skeletalMuscleMass = parseFloat(match[1]);
      break;
    }
  }

  for (const pattern of visceralPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.visceralFatLevel = parseFloat(match[1]);
      break;
    }
  }

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
    score += 5;
  }
  maxScore += 5;

  // Device detection bonus
  const device = detectDevice(text);
  if (device !== "Unknown Device") {
    score += 5;
  }
  maxScore += 5;

  return maxScore > 0 ? score / maxScore : 0;
}