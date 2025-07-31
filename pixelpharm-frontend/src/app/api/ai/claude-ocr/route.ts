// src/app/api/ai/claude-ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface BiomarkerResult {
  name: string;
  value: number;
  unit: string;
  normalRange?: string;
  status?: "normal" | "high" | "low" | "critical";
  category: string;
}

interface OcrResult {
  success: boolean;
  fileKey: string;
  extractedText: string;
  biomarkers: BiomarkerResult[];
  testInfo: {
    testDate?: string;
    labName?: string;
    patientInfo?: any;
  };
  confidence: "high" | "medium" | "low";
  processingTime: number;
  costOptimization: {
    usedPng: boolean;
    originalFormat: string;
    tokensSaved?: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("🔍 PixelPharm's OCR API called");
    console.log("🔐 Environment check:");
    console.log("- ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
    console.log(
      "- AWS_S3_BUCKET_NAME exists:",
      !!process.env.AWS_S3_BUCKET_NAME
    );
    console.log(
      "- NEXT_PUBLIC_AWS_REGION exists:",
      !!process.env.NEXT_PUBLIC_AWS_REGION
    );

    const { fileKey, userId, originalFormat = "pdf" } = await request.json();
    console.log("🎯 Processing:", { fileKey, userId, originalFormat });

    console.log("🧠 Starting Claude OCR extraction for:", fileKey);

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Get image from S3
    console.log("📁 Retrieving optimized image from S3...");
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    const s3Response = await s3Client.send(getObjectCommand);
    if (!s3Response.Body) {
      throw new Error("Failed to retrieve image from S3");
    }

    // Convert to base64 for Claude
    const imageBuffer = await streamToBuffer(s3Response.Body as any);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = fileKey.endsWith(".pdf")
      ? "application/pdf"
      : fileKey.endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    console.log(
      `📊 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // Enhanced Claude prompt for blood test OCR
    const claudePrompt = `You are an expert medical data extraction AI. Please analyze this blood test image and extract ALL biomarker data with extreme precision.

EXTRACTION REQUIREMENTS:
1. Extract every numerical value with its corresponding biomarker name
2. Include units (mg/dL, mmol/L, %, etc.)
3. Identify reference ranges where visible
4. Determine if values are normal, high, low, or critical
5. Extract test date, lab name, and patient information
6. Categorize biomarkers (lipids, glucose, liver, kidney, etc.)

CRITICAL ACCURACY FACTORS:
- OCR this image with 100% accuracy for all numerical values
- Pay special attention to decimal points and units
- Distinguish between similar numbers (e.g., 6 vs 8, 1 vs I)
- Capture both individual test results and calculated ratios
- Include any footnotes or special markers

FORMAT RESPONSE AS JSON:
{
  "biomarkers": [
    {
      "name": "Total Cholesterol",
      "value": 220,
      "unit": "mg/dL",
      "normalRange": "< 200",
      "status": "high",
      "category": "lipids"
    }
  ],
  "testInfo": {
    "testDate": "2024-07-25",
    "labName": "LabCorp",
    "patientInfo": {...}
  },
  "extractedText": "full text content...",
  "confidence": "high"
}

Please analyze this blood test image now:`;

    // Call Claude Vision API
    console.log(
      "🧠 Sending image to PixelPharm Multi Medical Model AI for OCR analysis..."
    );

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
      throw new Error("Unexpected response type from PixelPharm");
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
        biomarkers: extractBiomarkersFromText(responseContent.text),
        testInfo: {},
        extractedText: responseContent.text,
        confidence: "medium",
      };
    }

    // Enhance biomarker data with additional processing
    const enhancedBiomarkers =
      parsedData.biomarkers?.map((biomarker: any) => ({
        ...biomarker,
        extractedAt: new Date().toISOString(),
        sourceImage: fileKey,
        userId: userId,
      })) || [];

    const processingTime = Date.now() - startTime;

    console.log(`✅ PixelPharm's OCR completed in ${processingTime}ms`);
    console.log(`🧬 Extracted ${enhancedBiomarkers.length} biomarkers`);

    const result: OcrResult = {
      success: true,
      fileKey,
      extractedText: parsedData.extractedText || responseContent.text,
      biomarkers: enhancedBiomarkers,
      testInfo: parsedData.testInfo || {},
      confidence: parsedData.confidence || "high",
      processingTime,
      costOptimization: {
        usedPng: fileKey.includes("_300dpi.png"),
        originalFormat,
        tokensSaved: originalFormat === "pdf" ? 2000 : 0,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ PixelPharm's OCR failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "PixelPharm's OCR extraction failed",
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

// Fallback biomarker extraction for non-JSON responses
function extractBiomarkersFromText(text: string): BiomarkerResult[] {
  const biomarkers: BiomarkerResult[] = [];
  const lines = text.split("\n");

  // Common biomarker patterns
  const patterns = [
    /(\w+(?:\s+\w+)*)\s*:?\s*([\d.]+)\s*(mg\/dL|mmol\/L|%|g\/dL|IU\/L|U\/L)/gi,
    /(\w+(?:\s+\w+)*)\s+([\d.]+)\s+(mg\/dL|mmol\/L|%|g\/dL|IU\/L|U\/L)/gi,
  ];

  lines.forEach((line) => {
    patterns.forEach((pattern) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach((match) => {
        if (match[1] && match[2] && match[3]) {
          biomarkers.push({
            name: match[1].trim(),
            value: parseFloat(match[2]),
            unit: match[3],
            category: categorizeBiomarker(match[1].trim()),
          });
        }
      });
    });
  });

  return biomarkers;
}

// Helper to categorize biomarkers
function categorizeBiomarker(name: string): string {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("cholesterol") ||
    lowerName.includes("ldl") ||
    lowerName.includes("hdl") ||
    lowerName.includes("triglycer")
  ) {
    return "lipids";
  }
  if (
    lowerName.includes("glucose") ||
    lowerName.includes("hba1c") ||
    lowerName.includes("insulin")
  ) {
    return "diabetes";
  }
  if (
    lowerName.includes("ast") ||
    lowerName.includes("alt") ||
    lowerName.includes("bilirubin")
  ) {
    return "liver";
  }
  if (
    lowerName.includes("creatinine") ||
    lowerName.includes("bun") ||
    lowerName.includes("gfr")
  ) {
    return "kidney";
  }
  if (
    lowerName.includes("tsh") ||
    lowerName.includes("t3") ||
    lowerName.includes("t4")
  ) {
    return "thyroid";
  }

  return "general";
}
