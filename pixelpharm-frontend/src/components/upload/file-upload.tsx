// src/components/upload/optimized-file-upload.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { usePlanStatus } from "@/hooks/usePlanStatus";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  DollarSign,
  TrendingDown,
} from "lucide-react";

interface ConversionStats {
  originalSize: number;
  optimizedSize: number;
  sizeReduction: number;
  tokensEstimated: number;
  costSavings: number;
}

interface ProcessingResult {
  fileKey: string;
  pngKey?: string;
  biomarkers: any[];
  conversionStats?: ConversionStats;
  processingTime: number;
}

type UploadStatus =
  | "idle"
  | "uploading"
  | "converting"
  | "processing"
  | "success"
  | "error";

interface OptimizedFileUploadProps {
  onUploadComplete?: (results: ProcessingResult[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
}

export default function OptimizedFileUpload({
  onUploadComplete,
  acceptedTypes = [".png", ".jpg", ".jpeg", ".webp", ".tiff"],
  maxFiles = 5,
}: OptimizedFileUploadProps) {
  const { user } = useAuth();
  const { planStatus, loading: planLoading } = usePlanStatus();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [costSavings, setCostSavings] = useState<ConversionStats | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/tiff": [".tiff", ".tif"],
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: true,
    maxFiles,
    onDrop: useCallback((acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      setUploadStatus("idle");
      setErrorMessage("");
      setResults([]);
      setCostSavings(null);
    }, []),
  });

  const processFile = async (
    file: File,
    index: number
  ): Promise<ProcessingResult> => {
    const startTime = Date.now();

    try {
      // Step 1: Upload to S3
      setProcessingStep(`Uploading ${file.name}...`);
      setUploadProgress(20);

      const presignedResponse = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          userId: user?.userId, // Send the actual user ID
        }),
      });

      console.log("🔍 Presigned URL Response:", {
        status: presignedResponse.status,
        statusText: presignedResponse.statusText,
        ok: presignedResponse.ok,
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        console.log("❌ Presigned URL Error:", errorText);
        throw new Error(
          `Failed to get presigned URL: ${presignedResponse.status} - ${errorText}`
        );
      }
      const { uploadUrl, fileKey, uploadId } = await presignedResponse.json();
      console.log("🆔 Upload ID received:", uploadId); // Add this debug line

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress(70);

      // Process image file directly
      let processingKey = fileKey;

      // Step 3: Claude OCR Processing
      setProcessingStep(`Analyzing ${file.name} with Multi-Medical Model AI...`);

      const ocrResponse = await fetch("/api/ai/claude-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: processingKey,
          userId: user?.userId,
          originalFormat: "image",
        }),
      });

      setUploadProgress(90);

      if (!ocrResponse.ok) {
        throw new Error("Claude OCR processing failed");
      }

      const ocrResult = await ocrResponse.json();

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || "OCR processing failed");
      }

      // Step 4: Store biomarkers in database
      if (ocrResult.biomarkers?.length > 0) {
        setProcessingStep(
          `Storing ${ocrResult.biomarkers.length} biomarkers...`
        );

        const storeResponse = await fetch("/api/ai/store-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.userId,
            fileKey: processingKey,
            uploadId: uploadId,
            biomarkers: ocrResult.biomarkers,
            testInfo: ocrResult.testInfo,
            uploadType: "blood_tests",
          }),
        });

        if (!storeResponse.ok) {
          console.warn("Failed to store biomarkers in database");
        }
      }

      setUploadProgress(100);

      const processingTime = Date.now() - startTime;

      return {
        fileKey,
        biomarkers: ocrResult.biomarkers || [],
        processingTime,
      };
    } catch (error) {
      console.error(`❌ Processing failed for ${file.name}:`, error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!user?.userId) {
      setErrorMessage("Please sign in to upload files");
      return;
    }

    if (files.length === 0) {
      setErrorMessage("Please select files to upload");
      return;
    }

    // Check upload limits
    if (!planStatus?.canUpload) {
      setErrorMessage(
        planStatus?.currentPlan === 'free' 
          ? "Free upload limit reached. Please upgrade to continue uploading files."
          : "Upload limit reached. Please upgrade your plan or wait for your limit to reset."
      );
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const processedResults: ProcessingResult[] = [];
      const totalSavings = { size: 0, tokens: 0, cost: 0 };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStep(
          `Processing ${file.name} (${i + 1}/${files.length})...`
        );

        const result = await processFile(file, i);
        processedResults.push(result);

        // Accumulate savings stats
        if (result.conversionStats) {
          totalSavings.size += result.conversionStats.sizeReduction;
          totalSavings.tokens += result.conversionStats.tokensEstimated;
          totalSavings.cost += result.conversionStats.costSavings;
        }

        // Update progress for this file
        const progress = ((i + 1) / files.length) * 100;
        setUploadProgress(progress);
      }

      // Set overall savings stats
      if (totalSavings.cost > 0) {
        setCostSavings({
          originalSize: 0,
          optimizedSize: 0,
          sizeReduction: totalSavings.size / files.length,
          tokensEstimated: totalSavings.tokens,
          costSavings: totalSavings.cost,
        });
      }

      setResults(processedResults);
      setUploadStatus("success");
      setProcessingStep("All files processed successfully!");

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(processedResults);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setProcessingStep("");
        setUploadStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("❌ Upload failed:", error);
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
      case "converting":
      case "processing":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case "success":
        return "border-green-300 bg-green-50";
      case "error":
        return "border-red-300 bg-red-50";
      case "uploading":
      case "converting":
      case "processing":
        return "border-blue-300 bg-blue-50";
      default:
        return "border-gray-300 hover:border-gray-400";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : getStatusColor()
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex items-center justify-center mb-4">
          {getStatusIcon()}
          <FileText className="h-8 w-8 text-gray-400 ml-2" />
        </div>

        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop blood test files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports PNG, JPG, WebP and TIFF Image types.
            </p>
          </div>
        )}
      </div>


      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {file.type === "application/pdf" ? (
                    <FileText className="h-5 w-5 text-red-500 mr-3" />
                  ) : (
                    <Image className="h-5 w-5 text-blue-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.type === "application/pdf" && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Will optimize
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploadStatus !== "idle"}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {uploadStatus !== "idle" && uploadStatus !== "error" && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Processing Progress</span>
            <span className="text-sm text-gray-500">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          {processingStep && (
            <p className="text-sm text-gray-600 mt-2">{processingStep}</p>
          )}
        </div>
      )}

      {/* 
     
     Cost Savings Summary 
      {costSavings && (
        <Alert className="mt-6 border-green-200 bg-green-50">
          <DollarSign className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-800">Storage Saved</div>
                <div className="text-green-600">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  {costSavings.sizeReduction.toFixed(1)}% reduction
                </div>
              </div>
              <div>
                <div className="font-medium text-green-800">Tokens Saved</div>
                <div className="text-green-600">
                  ~{costSavings.tokensEstimated.toFixed(0)} tokens
                </div>
              </div>
              <div>
                <div className="font-medium text-green-800">Cost Savings</div>
                <div className="text-green-600">
                  ${costSavings.costSavings.toFixed(4)}
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      */}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Processing Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      File {index + 1} processed successfully
                    </p>
                    <p className="text-sm text-green-600">
                      Found {result.biomarkers.length} biomarkers • Processed in{" "}
                      {(result.processingTime / 1000).toFixed(1)}s
                      {result.pngKey && " • Optimized to PNG"}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                {result.biomarkers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600 mb-1">
                      Extracted biomarkers:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.biomarkers.slice(0, 5).map((biomarker, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {biomarker.name}: {biomarker.value} {biomarker.unit}
                        </Badge>
                      ))}
                      {result.biomarkers.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.biomarkers.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      <div className="mt-6 flex justify-center">
        {console.log("🔧 FileUpload Button Debug:", {
          filesLength: files.length,
          uploadStatus,
          userId: user?.userId,
          planLoading,
          canUpload: planStatus?.canUpload,
          planType: planStatus?.currentPlan,
          buttonDisabled: files.length === 0 || uploadStatus !== "idle" || !user?.userId || planLoading || !planStatus?.canUpload
        })}
        <Button
          onClick={handleUpload}
          disabled={
            files.length === 0 || uploadStatus !== "idle" || !user?.userId || planLoading || !planStatus?.canUpload
          }
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          size="lg"
        >
          {uploadStatus === "uploading" && "Uploading..."}
          {uploadStatus === "converting" && "Converting..."}
          {uploadStatus === "processing" && "Processing..."}
          {uploadStatus === "idle" &&
            `Process ${files.length} File${files.length !== 1 ? "s" : ""}`}
          {uploadStatus === "success" && "Complete!"}
          {uploadStatus === "error" && "Retry Upload"}
        </Button>
      </div>

    </div>
  );
}
