// src/app/api/uploads/convert-pdf-to-png/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { fromPdf } from "pdf2pic";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ConversionOptions {
  density: number; // DPI for PDF conversion (300+ for medical documents)
  format: "png";
  saveFilename: string;
  savePath: string;
  width: number; // Output width in pixels
  height: number; // Output height in pixels
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function convertPdfToHighQualityPng(
  pdfBuffer: Buffer,
  options: Partial<ConversionOptions> = {}
): Promise<Buffer[]> {
  const defaultOptions: ConversionOptions = {
    density: 300, // High DPI for medical documents
    format: "png",
    saveFilename: "page",
    savePath: "/tmp",
    width: 2480, // A4 at 300 DPI
    height: 3508, // A4 at 300 DPI
    ...options,
  };

  try {
    // Convert PDF to images using pdf2pic
    const convert = fromPdf(pdfBuffer, defaultOptions);
    const pages = await convert.bulk(-1); // Convert all pages

    const processedImages: Buffer[] = [];

    for (const page of pages) {
      if (page.buffer) {
        // Enhance image quality using Sharp
        const enhancedBuffer = await sharp(page.buffer)
          .png({
            compressionLevel: 6, // Good compression while maintaining quality
            adaptiveFiltering: true,
            force: true,
          })
          .resize(2480, 3508, {
            // Ensure consistent dimensions
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .normalize() // Improve contrast
          .sharpen({
            // Enhance text clarity
            sigma: 1,
            flat: 1,
            jagged: 2,
          })
          .toBuffer();

        processedImages.push(enhancedBuffer);
      }
    }

    return processedImages;
  } catch (error) {
    console.error("❌ PDF to PNG conversion failed:", error);
    throw new Error(
      `PDF conversion failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      fileKey,
      userId,
      uploadType = "blood_tests",
    } = await request.json();

    console.log("🔄 Starting PDF to PNG conversion for:", fileKey);

    if (!fileKey || !userId) {
      return NextResponse.json(
        { error: "File key and user ID are required" },
        { status: 400 }
      );
    }

    // Get PDF file from S3
    console.log("📁 Retrieving PDF from S3...");
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    const s3Response = await s3Client.send(getObjectCommand);
    if (!s3Response.Body) {
      throw new Error("Failed to retrieve PDF from S3");
    }

    const pdfBuffer = await streamToBuffer(s3Response.Body);
    console.log(
      "📄 PDF size:",
      (pdfBuffer.length / 1024 / 1024).toFixed(2),
      "MB"
    );

    // Convert PDF to high-quality PNG images
    console.log("🖼️ Converting PDF to PNG images...");
    const pngImages = await convertPdfToHighQualityPng(pdfBuffer, {
      density: 300, // High DPI for medical documents
      width: 2480, // A4 at 300 DPI
      height: 3508, // A4 at 300 DPI
    });

    console.log(`✅ Converted to ${pngImages.length} PNG image(s)`);

    // Upload PNG images to S3
    const uploadedImages = [];
    for (let i = 0; i < pngImages.length; i++) {
      const imageId = uuidv4();
      const pngKey = `uploads/${userId}/${uploadType}/converted/${imageId}_page_${
        i + 1
      }.png`;

      console.log(`📤 Uploading PNG page ${i + 1} to S3...`);

      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: pngKey,
        Body: pngImages[i],
        ContentType: "image/png",
        Metadata: {
          "original-pdf": fileKey,
          "page-number": (i + 1).toString(),
          "conversion-date": new Date().toISOString(),
          "user-id": userId,
          "upload-type": uploadType,
          "image-quality": "300dpi",
          "processed-by": "pdf2pic-sharp",
        },
      });

      await s3Client.send(putObjectCommand);

      uploadedImages.push({
        key: pngKey,
        pageNumber: i + 1,
        size: pngImages[i].length,
        dimensions: "2480x3508",
        dpi: 300,
      });

      console.log(`✅ Uploaded page ${i + 1}: ${pngKey}`);
    }

    // Calculate space savings
    const originalSize = pdfBuffer.length;
    const totalPngSize = pngImages.reduce((sum, img) => sum + img.length, 0);
    const spaceSaving = (
      ((originalSize - totalPngSize) / originalSize) *
      100
    ).toFixed(1);

    console.log("💾 Space Analysis:");
    console.log(
      `   Original PDF: ${(originalSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`   Total PNGs: ${(totalPngSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `   Space ${
        spaceSaving.startsWith("-") ? "increase" : "saved"
      }: ${Math.abs(Number(spaceSaving))}%`
    );

    return NextResponse.json({
      success: true,
      originalFile: fileKey,
      convertedImages: uploadedImages,
      conversion: {
        pageCount: pngImages.length,
        originalSize: originalSize,
        totalConvertedSize: totalPngSize,
        spaceSavingPercent: Number(spaceSaving),
        quality: "300dpi",
        format: "PNG",
        dimensions: "2480x3508",
      },
      processingDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ PDF to PNG conversion failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "PDF to PNG conversion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
