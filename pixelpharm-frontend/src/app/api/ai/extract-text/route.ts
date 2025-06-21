import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const textractClient = new TextractClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Common biomarkers to look for in blood tests
const BIOMARKER_PATTERNS = [
  // Lipid Panel
  {
    name: "Total Cholesterol",
    patterns: ["total cholesterol", "cholesterol total", "chol total"],
  },
  {
    name: "HDL Cholesterol",
    patterns: ["hdl cholesterol", "hdl-c", "high density"],
  },
  {
    name: "LDL Cholesterol",
    patterns: ["ldl cholesterol", "ldl-c", "low density"],
  },
  { name: "Triglycerides", patterns: ["triglycerides", "trig"] },

  // Basic Metabolic Panel
  { name: "Glucose", patterns: ["glucose", "blood sugar", "fasting glucose"] },
  { name: "Hemoglobin A1C", patterns: ["a1c", "hba1c", "hemoglobin a1c"] },
  { name: "Creatinine", patterns: ["creatinine"] },
  { name: "BUN", patterns: ["bun", "blood urea nitrogen"] },

  // Complete Blood Count
  {
    name: "White Blood Cells",
    patterns: ["wbc", "white blood cell", "leukocytes"],
  },
  {
    name: "Red Blood Cells",
    patterns: ["rbc", "red blood cell", "erythrocytes"],
  },
  { name: "Hemoglobin", patterns: ["hemoglobin", "hgb", "hb"] },
  { name: "Hematocrit", patterns: ["hematocrit", "hct"] },
  { name: "Platelets", patterns: ["platelets", "plt"] },

  // Liver Function
  { name: "ALT", patterns: ["alt", "alanine aminotransferase"] },
  { name: "AST", patterns: ["ast", "aspartate aminotransferase"] },
  { name: "Bilirubin", patterns: ["bilirubin", "total bilirubin"] },

  // Thyroid
  { name: "TSH", patterns: ["tsh", "thyroid stimulating hormone"] },
  { name: "T4", patterns: ["t4", "thyroxine", "free t4"] },
  { name: "T3", patterns: ["t3", "triiodothyronine", "free t3"] },

  // Vitamins & Minerals
  { name: "Vitamin D", patterns: ["vitamin d", "25-hydroxy", "25(oh)d"] },
  { name: "Vitamin B12", patterns: ["vitamin b12", "b12", "cobalamin"] },
  { name: "Iron", patterns: ["iron", "serum iron"] },
  { name: "Ferritin", patterns: ["ferritin"] },
];

function extractBiomarkers(text: string) {
  const lines = text.split("\n").map((line) => line.trim().toLowerCase());
  const biomarkers: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange?: string;
    rawText: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try to match each biomarker pattern
    for (const biomarker of BIOMARKER_PATTERNS) {
      for (const pattern of biomarker.patterns) {
        if (line.includes(pattern)) {
          // Look for numeric values in this line and nearby lines
          const context = [
            lines[i - 1] || "",
            line,
            lines[i + 1] || "",
            lines[i + 2] || "",
          ].join(" ");

          // Extract numeric values and units
          const valueMatches = context.match(/(\d+\.?\d*)\s*([a-zA-Z\/]+)?/g);
          const referenceMatch = context.match(
            /(reference|ref|normal):?\s*([^\n]+)/i
          );

          if (valueMatches && valueMatches.length > 0) {
            const valueMatch = valueMatches[0];
            const [, value, unit] =
              valueMatch.match(/(\d+\.?\d*)\s*([a-zA-Z\/]+)?/) || [];

            biomarkers.push({
              name: biomarker.name,
              value: value || "",
              unit: unit || "",
              referenceRange: referenceMatch ? referenceMatch[2] : undefined,
              rawText: context.substring(0, 100), // First 100 chars for context
            });
          }
          break;
        }
      }
    }
  }

  return biomarkers;
}

function extractTestInfo(text: string) {
  const lines = text.split("\n").map((line) => line.trim());

  // Extract test date
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i,
  ];

  let testDate = "";
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        testDate = match[0];
        break;
      }
    }
    if (testDate) break;
  }

  // Extract lab name (usually at the top)
  const labPatterns = [/quest|labcorp|mayo|cleveland|kaiser|arup/i];

  let labName = "";
  for (const line of lines.slice(0, 10)) {
    // Check first 10 lines
    for (const pattern of labPatterns) {
      if (pattern.test(line)) {
        labName = line;
        break;
      }
    }
    if (labName) break;
  }

  return { testDate, labName };
}

export async function POST(request: NextRequest) {
  try {
    const { fileKey, uploadType } = await request.json();

    console.log("🔍 Starting OCR extraction for:", fileKey);

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Get file from S3
    console.log("📁 Retrieving file from S3...");
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    const s3Response = await s3Client.send(getObjectCommand);

    if (!s3Response.Body) {
      throw new Error("Failed to retrieve file from S3");
    }

    // Convert stream to buffer
    const fileBuffer = await streamToBuffer(s3Response.Body as any);

    console.log("🔍 Starting Textract OCR...");

    // Process with Textract
    const textractCommand = new DetectDocumentTextCommand({
      Document: {
        Bytes: fileBuffer,
      },
    });

    const textractResponse = await textractClient.send(textractCommand);

    if (!textractResponse.Blocks) {
      throw new Error("No text blocks found in document");
    }

    // Extract text from Textract response
    const extractedText = textractResponse.Blocks.filter(
      (block) => block.BlockType === "LINE"
    )
      .map((block) => block.Text)
      .join("\n");

    console.log("📝 Extracted text length:", extractedText.length);

    // Parse biomarkers and test info
    const biomarkers = extractBiomarkers(extractedText);
    const testInfo = extractTestInfo(extractedText);

    console.log("🧬 Found biomarkers:", biomarkers.length);

    const result = {
      success: true,
      fileKey,
      uploadType,
      extractedText: extractedText.substring(0, 1000), // First 1000 chars for preview
      biomarkers,
      testInfo,
      processingDate: new Date().toISOString(),
      confidence: textractResponse.Blocks.length > 10 ? "high" : "medium", // Simple confidence based on text blocks
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ OCR extraction failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "OCR extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
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
