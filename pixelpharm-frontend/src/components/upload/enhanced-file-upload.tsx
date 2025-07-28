// src/components/upload/enhanced-file-upload.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status:
    | "pending"
    | "uploading"
    | "converting"
    | "processing"
    | "completed"
    | "error";
  error?: string;
  results?: any;
}

interface BiomarkerResult {
  name: string;
  value: number;
  unit: string;
  category: string;
  status: "normal" | "low" | "high";
  confidence: number;
}

interface ProcessingStep {
  step: string;
  status: "pending" | "active" | "completed" | "error";
  message: string;
  timestamp?: Date;
}

export default function EnhancedFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);

  const updateProcessingStep = (
    stepName: string,
    status: ProcessingStep["status"],
    message: string
  ) => {
    setProcessingSteps((prev) => {
      const existing = prev.find((s) => s.step === stepName);
      if (existing) {
        return prev.map((s) =>
          s.step === stepName
            ? { ...s, status, message, timestamp: new Date() }
            : s
        );
      } else {
        return [
          ...prev,
          { step: stepName, status, message, timestamp: new Date() },
        ];
      }
    });
  };

  const initializeProcessingSteps = () => {
    const steps: ProcessingStep[] = [
      { step: "upload", status: "pending", message: "Upload file to S3" },
      {
        step: "convert",
        status: "pending",
        message: "Convert PDF to high-quality PNG",
      },
      {
        step: "ocr",
        status: "pending",
        message: "Extract text using enhanced OCR",
      },
      {
        step: "extract",
        status: "pending",
        message: "Extract and analyze biomarkers",
      },
      {
        step: "store",
        status: "pending",
        message: "Store results in database",
      },
    ];
    setProcessingSteps(steps);
  };

  const generatePresignedUrl = async (
    fileName: string,
    fileType: string,
    userId: string
  ) => {
    const response = await fetch("/api/uploads/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType, userId }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate presigned URL: ${response.statusText}`
      );
    }

    return response.json();
  };

  const uploadToS3 = async (
    file: File,
    presignedUrl: string,
    onProgress: (progress: number) => void
  ) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const convertPdfToPng = async (fileKey: string, userId: string) => {
    const response = await fetch("/api/uploads/convert-pdf-to-png", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileKey, userId, uploadType: "blood_tests" }),
    });

    if (!response.ok) {
      throw new Error(`PDF conversion failed: ${response.statusText}`);
    }

    return response.json();
  };

  const processWithEnhancedOCR = async (
    imageKeys: string[],
    userId: string
  ) => {
    const response = await fetch("/api/ai/enhanced-ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageKeys, userId, uploadType: "blood_tests" }),
    });

    if (!response.ok) {
      throw new Error(`Enhanced OCR failed: ${response.statusText}`);
    }

    return response.json();
  };

  const storeBiomarkers = async (
    biomarkers: BiomarkerResult[],
    userId: string,
    fileKey: string
  ) => {
    const response = await fetch("/api/ai/store-biomarkers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        biomarkers,
        userId,
        fileKey,
        processingDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Biomarker storage failed: ${response.statusText}`);
    }

    return response.json();
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Get user ID from auth context or localStorage
      const userId = localStorage.getItem("userId") || "user-demo";
      const file = uploadedFile.file;

      // Step 1: Upload to S3
      updateProcessingStep("upload", "active", "Generating presigned URL...");

      const { presignedUrl, fileKey } = await generatePresignedUrl(
        file.name,
        file.type,
        userId
      );

      updateProcessingStep("upload", "active", "Uploading file to S3...");

      await uploadToS3(file, presignedUrl, (progress) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, progress, status: "uploading" }
              : f
          )
        );
      });

      updateProcessingStep("upload", "completed", "File uploaded successfully");

      // Step 2: Convert PDF to PNG (if PDF)
      let imageKeys: string[] = [];

      if (file.type === "application/pdf") {
        updateProcessingStep(
          "convert",
          "active",
          "Converting PDF to high-quality PNG images..."
        );

        const conversionResult = await convertPdfToPng(fileKey, userId);

        if (conversionResult.success) {
          imageKeys = conversionResult.convertedImages.map(
            (img: any) => img.key
          );
          updateProcessingStep(
            "convert",
            "completed",
            `Converted to ${
              conversionResult.conversion.pageCount
            } PNG images (${
              conversionResult.conversion.spaceSavingPercent
            }% space ${
              conversionResult.conversion.spaceSavingPercent > 0
                ? "saved"
                : "increase"
            })`
          );
        } else {
          throw new Error("PDF conversion failed");
        }
      } else {
        // For image files, use directly
        imageKeys = [fileKey];
        updateProcessingStep(
          "convert",
          "completed",
          "Using original image file"
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "converting" } : f
        )
      );

      // Step 3: Enhanced OCR Processing
      updateProcessingStep(
        "ocr",
        "active",
        "Extracting text with enhanced OCR..."
      );

      const ocrResult = await processWithEnhancedOCR(imageKeys, userId);

      if (ocrResult.success) {
        updateProcessingStep(
          "ocr",
          "completed",
          `Extracted text from ${ocrResult.pagesProcessed} pages with ${(
            ocrResult.confidence * 100
          ).toFixed(1)}% confidence`
        );
      } else {
        throw new Error("Enhanced OCR failed");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "processing" } : f
        )
      );

      // Step 4: Extract and Analyze Biomarkers
      updateProcessingStep("extract", "active", "Analyzing biomarkers...");

      const biomarkers = ocrResult.biomarkers || [];

      updateProcessingStep(
        "extract",
        "completed",
        `Found ${biomarkers.length} biomarkers across ${biomarkers.reduce(
          (acc: any, curr: any) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
          },
          {}
        )} categories`
      );

      // Step 5: Store Results
      if (biomarkers.length > 0) {
        updateProcessingStep(
          "store",
          "active",
          "Storing biomarkers in database..."
        );

        await storeBiomarkers(biomarkers, userId, fileKey);

        updateProcessingStep(
          "store",
          "completed",
          `Stored ${biomarkers.length} biomarkers successfully`
        );
      } else {
        updateProcessingStep(
          "store",
          "completed",
          "No biomarkers found to store"
        );
      }

      // Update file status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "completed",
                progress: 100,
                results: {
                  biomarkers,
                  metadata: ocrResult.metadata,
                  qualityMetrics: ocrResult.qualityMetrics,
                },
              }
            : f
        )
      );
    } catch (error) {
      console.error("❌ File processing failed:", error);

      // Update current step as error
      const currentStep = processingSteps.find((s) => s.status === "active");
      if (currentStep) {
        updateProcessingStep(
          currentStep.step,
          "error",
          error instanceof Error ? error.message : "Processing failed"
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Processing failed",
              }
            : f
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    initializeProcessingSteps();

    // Process files sequentially for better tracking
    for (const file of pendingFiles) {
      await processFile(file);
    }

    setIsUploading(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setProcessingSteps([]);
  };

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "uploading":
      case "converting":
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "uploading":
      case "converting":
      case "processing":
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderBiomarkerResults = (biomarkers: BiomarkerResult[]) => {
    if (!biomarkers || biomarkers.length === 0) return null;

    const categories = biomarkers.reduce((acc: any, biomarker) => {
      if (!acc[biomarker.category]) acc[biomarker.category] = [];
      acc[biomarker.category].push(biomarker);
      return acc;
    }, {});

    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-medium text-sm">Extracted Biomarkers</h4>
        {Object.entries(categories).map(
          ([category, biomarkers]: [string, any]) => (
            <div key={category} className="space-y-2">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {category.replace("_", " ")}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {biomarkers.map((biomarker: BiomarkerResult, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <span className="font-medium">{biomarker.name}</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {biomarker.value} {biomarker.unit}
                      </span>
                      <Badge
                        variant={
                          biomarker.status === "normal"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {biomarker.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Enhanced Blood Test Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-gray-400" />
              <p className="text-lg font-medium">
                {isDragActive ? "Drop files here" : "Upload Blood Test Reports"}
              </p>
              <p className="text-sm text-gray-600">
                PDF files will be converted to high-quality PNG for better OCR
              </p>
              <p className="text-xs text-gray-500">
                Supports: PDF, PNG, JPG (Max 10MB)
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={
                  isUploading || files.every((f) => f.status !== "pending")
                }
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isUploading ? "Processing..." : "Start Enhanced Processing"}
              </Button>
              <Button variant="outline" onClick={clearFiles}>
                Clear Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Steps */}
      {processingSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processingSteps.map((step, index) => (
                <div key={step.step} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : step.status === "active"
                        ? "bg-blue-100 text-blue-600"
                        : step.status === "error"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {step.step}
                      </span>
                      {step.status === "active" && (
                        <Clock className="w-3 h-3 animate-spin text-blue-600" />
                      )}
                      {step.status === "completed" && (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      )}
                      {step.status === "error" && (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{step.message}</p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-400">
                        {step.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((uploadedFile) => (
                <div key={uploadedFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadedFile.status)}
                      <span className="font-medium text-sm">
                        {uploadedFile.file.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {uploadedFile.file.type.includes("pdf")
                          ? "PDF"
                          : "Image"}
                      </Badge>
                    </div>
                    <span
                      className={`text-xs font-medium ${getStatusColor(
                        uploadedFile.status
                      )}`}
                    >
                      {uploadedFile.status.toUpperCase()}
                    </span>
                  </div>

                  {uploadedFile.progress > 0 && uploadedFile.progress < 100 && (
                    <Progress value={uploadedFile.progress} className="mb-2" />
                  )}

                  {uploadedFile.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadedFile.error}</AlertDescription>
                    </Alert>
                  )}

                  {uploadedFile.results?.biomarkers &&
                    renderBiomarkerResults(uploadedFile.results.biomarkers)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
