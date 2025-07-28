// src/app/api/ai/enhanced-ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const textractClient = new TextractClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface BiomarkerPattern {
  name: string;
  aliases: string[];
  pattern: RegExp;
  unit?: string;
  normalRange?: { min: number; max: number };
  category:
    | "lipid"
    | "glucose"
    | "liver"
    | "kidney"
    | "thyroid"
    | "complete_blood_count"
    | "electrolyte"
    | "cardiac"
    | "other";
}

// Enhanced biomarker patterns for medical lab reports
const BIOMARKER_PATTERNS: BiomarkerPattern[] = [
  // Lipid Panel
  {
    name: "Total Cholesterol",
    aliases: ["cholesterol", "total chol", "tchol", "chol total"],
    pattern:
      /(?:total\s+)?cholesterol[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 125, max: 200 },
    category: "lipid",
  },
  {
    name: "HDL Cholesterol",
    aliases: ["hdl", "hdl cholesterol", "high density lipoprotein"],
    pattern: /hdl[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 40, max: 100 },
    category: "lipid",
  },
  {
    name: "LDL Cholesterol",
    aliases: ["ldl", "ldl cholesterol", "low density lipoprotein"],
    pattern: /ldl[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 0, max: 100 },
    category: "lipid",
  },
  {
    name: "Triglycerides",
    aliases: ["triglycerides", "trig", "trigs"],
    pattern: /triglycerides?[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 0, max: 150 },
    category: "lipid",
  },

  // Glucose/Diabetes
  {
    name: "Glucose",
    aliases: ["glucose", "blood glucose", "fasting glucose", "random glucose"],
    pattern:
      /(?:fasting\s+|random\s+)?glucose[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 70, max: 100 },
    category: "glucose",
  },
  {
    name: "HbA1c",
    aliases: ["hba1c", "hemoglobin a1c", "glycated hemoglobin"],
    pattern: /(?:hba1c|hemoglobin\s+a1c)[:\s]*(\d+(?:\.\d+)?)\s*%?/i,
    unit: "%",
    normalRange: { min: 4.0, max: 5.6 },
    category: "glucose",
  },

  // Complete Blood Count
  {
    name: "White Blood Cell Count",
    aliases: ["wbc", "white blood cells", "leukocytes"],
    pattern:
      /(?:wbc|white\s+blood\s+cells?)[:\s]*(\d+(?:\.\d+)?)\s*(?:k\/ul|x10\^3\/ul)?/i,
    unit: "K/uL",
    normalRange: { min: 4.5, max: 11.0 },
    category: "complete_blood_count",
  },
  {
    name: "Red Blood Cell Count",
    aliases: ["rbc", "red blood cells", "erythrocytes"],
    pattern:
      /(?:rbc|red\s+blood\s+cells?)[:\s]*(\d+(?:\.\d+)?)\s*(?:m\/ul|x10\^6\/ul)?/i,
    unit: "M/uL",
    normalRange: { min: 4.2, max: 5.4 },
    category: "complete_blood_count",
  },
  {
    name: "Hemoglobin",
    aliases: ["hemoglobin", "hgb", "hb"],
    pattern: /(?:hemoglobin|hgb|hb)[:\s]*(\d+(?:\.\d+)?)\s*(?:g\/dl)?/i,
    unit: "g/dL",
    normalRange: { min: 12.0, max: 15.5 },
    category: "complete_blood_count",
  },
  {
    name: "Hematocrit",
    aliases: ["hematocrit", "hct"],
    pattern: /(?:hematocrit|hct)[:\s]*(\d+(?:\.\d+)?)\s*%?/i,
    unit: "%",
    normalRange: { min: 36.0, max: 46.0 },
    category: "complete_blood_count",
  },
  {
    name: "Platelet Count",
    aliases: ["platelets", "plt", "platelet count"],
    pattern: /(?:platelets?|plt)[:\s]*(\d+(?:\.\d+)?)\s*(?:k\/ul|x10\^3\/ul)?/i,
    unit: "K/uL",
    normalRange: { min: 150, max: 450 },
    category: "complete_blood_count",
  },

  // Liver Function
  {
    name: "ALT",
    aliases: ["alt", "alanine aminotransferase", "sgpt"],
    pattern:
      /(?:alt|alanine\s+aminotransferase|sgpt)[:\s]*(\d+(?:\.\d+)?)\s*(?:u\/l|iu\/l)?/i,
    unit: "U/L",
    normalRange: { min: 7, max: 56 },
    category: "liver",
  },
  {
    name: "AST",
    aliases: ["ast", "aspartate aminotransferase", "sgot"],
    pattern:
      /(?:ast|aspartate\s+aminotransferase|sgot)[:\s]*(\d+(?:\.\d+)?)\s*(?:u\/l|iu\/l)?/i,
    unit: "U/L",
    normalRange: { min: 10, max: 40 },
    category: "liver",
  },

  // Kidney Function
  {
    name: "Creatinine",
    aliases: ["creatinine", "creat"],
    pattern: /creatinine?[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|umol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 0.6, max: 1.2 },
    category: "kidney",
  },
  {
    name: "BUN",
    aliases: ["bun", "blood urea nitrogen", "urea"],
    pattern:
      /(?:bun|blood\s+urea\s+nitrogen|urea)[:\s]*(\d+(?:\.\d+)?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: "mg/dL",
    normalRange: { min: 7, max: 20 },
    category: "kidney",
  },

  // Thyroid
  {
    name: "TSH",
    aliases: ["tsh", "thyroid stimulating hormone"],
    pattern:
      /(?:tsh|thyroid\s+stimulating\s+hormone)[:\s]*(\d+(?:\.\d+)?)\s*(?:miu\/l|uiu\/ml)?/i,
    unit: "mIU/L",
    normalRange: { min: 0.4, max: 4.0 },
    category: "thyroid",
  },
];

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function extractBiomarkersFromText(text: string): Array<{
  name: string;
  value: number;
  unit: string;
  category: string;
  status: "normal" | "low" | "high";
  confidence: number;
}> {
  const biomarkers = [];
  const processedText = text.toLowerCase().replace(/\s+/g, " ");

  for (const pattern of BIOMARKER_PATTERNS) {
    const match = processedText.match(pattern.pattern);

    if (match && match[1]) {
      const value = parseFloat(match[1]);

      if (!isNaN(value) && value > 0) {
        // Determine status based on normal range
        let status: "normal" | "low" | "high" = "normal";
        if (pattern.normalRange) {
          if (value < pattern.normalRange.min) status = "low";
          else if (value > pattern.normalRange.max) status = "high";
        }

        // Calculate confidence based on context
        let confidence = 0.8; // Base confidence

        // Higher confidence if found with common lab format
        if (text.includes(":") || text.includes("=")) confidence += 0.1;
        if (
          pattern.unit &&
          text.toLowerCase().includes(pattern.unit.toLowerCase())
        )
          confidence += 0.1;

        biomarkers.push({
          name: pattern.name,
          value: value,
          unit: pattern.unit || "",
          category: pattern.category,
          status: status,
          confidence: Math.min(confidence, 1.0),
        });
      }
    }
  }

  return biomarkers;
}

function extractTestMetadata(text: string): {
  testDate?: string;
  labName?: string;
  patientInfo?: string;
  reportType?: string;
} {
  const metadata: any = {};

  // Extract test date
  const datePatterns = [
    /(?:date|collected|drawn)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(?:date|collected|drawn)[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      metadata.testDate = match[1];
      break;
    }
  }

  // Extract lab name
  const labPatterns = [
    /(?:laboratory|lab|medical center|clinic)[:\s]*([^\n\r]+)/i,
    /(quest diagnostics|labcorp|bioReference|arup)/i,
  ];

  for (const pattern of labPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      metadata.labName = match[1].trim();
      break;
    }
  }

  // Determine report type
  if (
    text.toLowerCase().includes("comprehensive metabolic panel") ||
    text.toLowerCase().includes("cmp")
  ) {
    metadata.reportType = "Comprehensive Metabolic Panel";
  } else if (
    text.toLowerCase().includes("lipid panel") ||
    text.toLowerCase().includes("cholesterol")
  ) {
    metadata.reportType = "Lipid Panel";
  } else if (
    text.toLowerCase().includes("complete blood count") ||
    text.toLowerCase().includes("cbc")
  ) {
    metadata.reportType = "Complete Blood Count";
  } else {
    metadata.reportType = "General Blood Work";
  }

  return metadata;
}

export async function POST(request: NextRequest) {
  try {
    const {
      imageKeys,
      userId,
      uploadType = "blood_tests",
    } = await request.json();

    console.log("🔍 Starting enhanced OCR for", imageKeys.length, "PNG images");

    if (!imageKeys || !Array.isArray(imageKeys) || imageKeys.length === 0) {
      return NextResponse.json(
        { error: "Image keys array is required" },
        { status: 400 }
      );
    }

    const allBiomarkers = [];
    const allExtractedText = [];
    let combinedConfidence = 0;

    // Process each PNG image
    for (let i = 0; i < imageKeys.length; i++) {
      const imageKey = imageKeys[i];
      console.log(`📄 Processing page ${i + 1}: ${imageKey}`);

      // Get PNG image from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: imageKey,
      });

      const s3Response = await s3Client.send(getObjectCommand);
      if (!s3Response.Body) {
        console.warn(`⚠️ Failed to retrieve image: ${imageKey}`);
        continue;
      }

      const imageBuffer = await streamToBuffer(s3Response.Body);

      // Use Textract ANALYZE_DOCUMENT for better table/form detection
      const analyzeCommand = new AnalyzeDocumentCommand({
        Document: {
          Bytes: imageBuffer,
        },
        FeatureTypes: ["TABLES", "FORMS"], // Better for lab reports
      });

      try {
        const textractResponse = await textractClient.send(analyzeCommand);

        if (textractResponse.Blocks) {
          // Extract text from all blocks
          const pageText = textractResponse.Blocks.filter(
            (block) => block.BlockType === "LINE"
          )
            .map((block) => block.Text)
            .join("\n");

          allExtractedText.push(pageText);

          // Extract biomarkers from this page
          const pageBiomarkers = extractBiomarkersFromText(pageText);
          allBiomarkers.push(...pageBiomarkers);

          // Calculate confidence based on detected blocks
          const lineBlocks = textractResponse.Blocks.filter(
            (b) => b.BlockType === "LINE"
          ).length;
          const pageConfidence = Math.min(lineBlocks / 20, 1.0); // Normalize based on expected content
          combinedConfidence += pageConfidence;

          console.log(
            `✅ Page ${i + 1}: Found ${
              pageBiomarkers.length
            } biomarkers, confidence: ${pageConfidence.toFixed(2)}`
          );
        }
      } catch (error) {
        console.error(`❌ Textract failed for page ${i + 1}:`, error);
        // Continue with next page
      }
    }

    // Combine all extracted text
    const fullText = allExtractedText.join("\n\n");
    const averageConfidence = combinedConfidence / imageKeys.length;

    // Extract metadata from combined text
    const metadata = extractTestMetadata(fullText);

    // Remove duplicate biomarkers (keep highest confidence)
    const uniqueBiomarkers = [];
    const seenBiomarkers = new Map();

    for (const biomarker of allBiomarkers) {
      const key = biomarker.name.toLowerCase();
      const existing = seenBiomarkers.get(key);

      if (!existing || biomarker.confidence > existing.confidence) {
        seenBiomarkers.set(key, biomarker);
      }
    }

    uniqueBiomarkers.push(...seenBiomarkers.values());

    console.log(`🧬 Total unique biomarkers found: ${uniqueBiomarkers.length}`);
    console.log(`📊 Average confidence: ${averageConfidence.toFixed(2)}`);

    const result = {
      success: true,
      imageKeys,
      uploadType,
      pagesProcessed: imageKeys.length,
      extractedText: fullText.substring(0, 2000), // First 2000 chars for preview
      biomarkers: uniqueBiomarkers,
      metadata,
      processingDate: new Date().toISOString(),
      confidence: averageConfidence,
      qualityMetrics: {
        totalPages: imageKeys.length,
        averageConfidence: averageConfidence,
        biomarkersFound: uniqueBiomarkers.length,
        textLength: fullText.length,
        processingMethod: "textract_analyze_document",
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Enhanced OCR processing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Enhanced OCR processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
