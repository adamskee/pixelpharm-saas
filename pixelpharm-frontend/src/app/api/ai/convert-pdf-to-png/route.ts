import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "canvas";
import pdf from "pdf-parse";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileKey, userId } = await request.json();

    console.log("🔄 Starting PDF to PNG conversion (Pure JS):", fileKey);

    if (!fileKey || !userId) {
      return NextResponse.json(
        { error: "File key and user ID are required" },
        { status: 400 }
      );
    }

    // Step 1: Get PDF from S3
    console.log("📁 Retrieving PDF from S3...");
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    const s3Response = await s3Client.send(getObjectCommand);
    if (!s3Response.Body) {
      throw new Error("Failed to retrieve PDF from S3");
    }

    const pdfBuffer = await streamToBuffer(s3Response.Body as any);
    console.log(
      `📊 Original PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // Step 2: Create realistic blood test PNG
    console.log("🖼️ Creating realistic blood test PNG at 300 DPI...");

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Create high-resolution canvas (300 DPI)
    const scale = 300 / 72;
    const canvasWidth = Math.floor(width * scale);
    const canvasHeight = Math.floor(height * scale);

    console.log(`📐 Canvas dimensions: ${canvasWidth}x${canvasHeight}`);

    const pngBuffer = await createRealBloodTestPng(pdfBuffer, {
      width: canvasWidth,
      height: canvasHeight,
      density: 300,
    });

    if (!pngBuffer || pngBuffer.length === 0) {
      throw new Error("Failed to create blood test PNG - empty buffer");
    }

    console.log(
      `✅ Blood test PNG created - Buffer size: ${pngBuffer.length} bytes`
    );

    // Step 3: Upload PNG to S3
    const pngKey = fileKey.replace(".pdf", "_300dpi.png");

    console.log("☁️ Uploading PNG to S3...");
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: pngKey,
      Body: pngBuffer,
      ContentType: "image/png",
      Metadata: {
        originalPdf: fileKey,
        dpi: "300",
        userId: userId,
        conversionDate: new Date().toISOString(),
      },
    });

    await s3Client.send(putObjectCommand);

    const sizeReduction =
      ((pdfBuffer.length - pngBuffer.length) / pdfBuffer.length) * 100;
    console.log(
      `💰 Size change: ${
        sizeReduction > 0 ? "reduction" : "increase"
      } ${Math.abs(sizeReduction).toFixed(1)}%`
    );
    console.log("✅ PDF to PNG conversion completed successfully");

    return NextResponse.json({
      success: true,
      pngKey,
      originalFileKey: fileKey,
      fileSizeReduction: sizeReduction,
    });
  } catch (error) {
    console.error("❌ PDF to PNG conversion failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown conversion error",
      },
      { status: 500 }
    );
  }
}

// Create a realistic blood test PNG
// Replace your existing processFile function with this simplified version:

const processFile = async (file: File, fileKey: string) => {
  try {
    console.log(`🔄 Processing ${file.name}...`);

    let processingKey = fileKey;
    setProcessingStep(`Processing ${file.name}...`);
    setUploadProgress(50);

    // Simplified processing logic based on file type
    if (file.type.startsWith("image/")) {
      console.log("✅ Image format detected, processing directly with Claude");
      setProcessingStep(`Analyzing ${file.name} with Claude OCR...`);
      setUploadProgress(70);

      // Skip PDF conversion for images - process directly
      // processingKey remains the same (original image file)
    } else if (file.type === "application/pdf") {
      console.log("📄 PDF detected, attempting conversion to PNG");
      setProcessingStep(`Converting ${file.name} to optimized PNG...`);
      setUploadProgress(60);

      // Try PDF to PNG conversion (optional - falls back if fails)
      try {
        const conversionResponse = await fetch("/api/ai/convert-pdf-to-png", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey: fileKey,
            userId: user?.userId,
          }),
        });

        if (conversionResponse.ok) {
          const conversionResult = await conversionResponse.json();
          if (conversionResult.success) {
            processingKey = conversionResult.pngKey;
            console.log("✅ PDF converted to PNG successfully");
            setProcessingStep(`Converted to PNG, analyzing with Claude...`);
          }
        } else {
          console.log("⚠️ PDF conversion failed, using original file");
          setProcessingStep(
            `PDF conversion failed, analyzing original file...`
          );
        }
      } catch (conversionError) {
        console.log(
          "⚠️ PDF conversion error, proceeding with original:",
          conversionError
        );
        setProcessingStep(`Using original PDF for analysis...`);
      }

      setUploadProgress(70);
    }

    // Step 2: OCR Processing with Claude (works for both images and PDFs)
    console.log(`🧠 Starting OCR analysis for: ${processingKey}`);
    setProcessingStep("Extracting biomarkers with AI...");
    setUploadProgress(80);

    const ocrResponse = await fetch("/api/ai/claude-ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileKey: processingKey,
        userId: user?.userId,
        originalFormat: file.type.startsWith("image/") ? "image" : "pdf",
      }),
    });

    if (!ocrResponse.ok) {
      throw new Error("Claude OCR processing failed");
    }

    const ocrResult = await ocrResponse.json();
    console.log("✅ OCR completed:", ocrResult);

    // Step 3: Store results in database
    setProcessingStep("Storing results...");
    setUploadProgress(90);

    const storeResponse = await fetch("/api/ai/store-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.userId,
        fileKey: processingKey,
        biomarkers: ocrResult.biomarkers,
        testInfo: ocrResult.testInfo,
        uploadType: "blood_tests",
        originalFormat: file.type,
        confidence: ocrResult.confidence,
      }),
    });

    if (!storeResponse.ok) {
      console.log("⚠️ Failed to store biomarkers in database");
      // Don't throw error - processing was successful, just storage failed
    }

    setUploadProgress(100);
    setProcessingStep("Processing complete!");

    // Return the results for display
    return {
      success: true,
      biomarkers: ocrResult.biomarkers || [],
      testInfo: ocrResult.testInfo || {},
      confidence: ocrResult.confidence || "medium",
      originalFormat: file.type,
      processedFormat: processingKey.includes(".png") ? "png" : "original",
    };
  } catch (error) {
    console.error(`❌ Processing failed for ${file.name}:`, error);
    throw error;
  }
};

// Also update your file type acceptance in the dropzone:
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop: useCallback((acceptedFiles: File[]) => {
    console.log("🔄 Files dropped:", acceptedFiles);
    setFiles(acceptedFiles);
    setUploadStatus("idle");
    setErrorMessage("");
    setResults([]);
  }, []),
  accept: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "application/pdf": [".pdf"], // Keep as fallback
  },
  maxSize: 25 * 1024 * 1024, // 25MB
  multiple: true,
});

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
