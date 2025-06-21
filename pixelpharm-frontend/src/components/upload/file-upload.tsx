"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Brain,
  Eye,
} from "lucide-react";

interface FileUploadProps {
  onUploadComplete?: (fileKey: string, ocrResults?: any) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

interface OCRResult {
  success: boolean;
  biomarkers: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange?: string;
  }>;
  testInfo: {
    testDate: string;
    labName: string;
  };
  extractedText: string;
  confidence: string;
}

export default function FileUpload({
  onUploadComplete,
  acceptedFileTypes = [".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".webp"],
  maxFileSize = 25 * 1024 * 1024, // 25MB
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ocrResults, setOcrResults] = useState<OCRResult | null>(null);
  const [processingStep, setProcessingStep] = useState("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate file size
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxFileSize) {
          setErrorMessage(
            `File ${file.name} is too large. Maximum size is 25MB.`
          );
          return false;
        }
        return true;
      });

      setFiles(validFiles);
      setUploadStatus("idle");
      setErrorMessage("");
      setOcrResults(null);
    },
    [maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff"],
      "image/webp": [".webp"],
    },
    multiple: true,
  });

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("uploading");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setProcessingStep(`Uploading ${file.name}...`);

        // Get presigned URL
        const response = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: "blood-tests",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status}`);
        }

        const responseData = await response.json();
        const { uploadUrl, fileKey } = responseData;

        if (!uploadUrl) {
          throw new Error("No upload URL received from API");
        }

        // Upload file to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        setUploadProgress(((i + 1) / files.length) * 50); // Upload is 50% of total progress

        // Start OCR processing for PDF and image files
        if (file.type === "application/pdf" || file.type.startsWith("image/")) {
          setUploadStatus("processing");
          setProcessingStep("Analyzing document with AI...");

          try {
            const ocrResponse = await fetch("/api/ai/extract-text", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileKey,
                uploadType: "blood-tests",
              }),
            });

            if (ocrResponse.ok) {
              const ocrData = await ocrResponse.json();
              setOcrResults(ocrData);
              setProcessingStep(
                `Found ${ocrData.biomarkers?.length || 0} biomarkers`
              );
            } else {
              console.warn("OCR processing failed, but upload succeeded");
              setProcessingStep("Document uploaded (OCR analysis unavailable)");
            }
          } catch (ocrError) {
            console.warn("OCR processing error:", ocrError);
            setProcessingStep("Document uploaded (OCR analysis failed)");
          }
        }

        setUploadProgress(((i + 1) / files.length) * 100);

        if (onUploadComplete) {
          onUploadComplete(fileKey, ocrResults);
        }
      }

      setUploadStatus("success");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case "uploading":
        return "blue";
      case "processing":
        return "purple";
      case "success":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <Upload className="h-4 w-4" />;
      case "processing":
        return <Brain className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500 mb-4">or click to select files</p>
        <p className="text-xs text-gray-400">
          Supports: PDF, JPEG, PNG, TIFF, WebP (max 25MB each)
        </p>
        <p className="text-xs text-blue-600 mt-2 font-medium">
          ✨ AI-powered analysis for blood test documents
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {(file.type === "application/pdf" ||
                        file.type.startsWith("image/")) && (
                        <span className="ml-2 text-blue-600">
                          • AI Analysis Available
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {uploadStatus === "uploading" && "Uploading..."}
                    {uploadStatus === "processing" && "AI Processing..."}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {processingStep && (
                <p className="text-xs text-gray-600 mt-2">{processingStep}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="flex-1"
            >
              {uploading ? (
                <>
                  {getStatusIcon()}
                  <span className="ml-2">
                    {uploadStatus === "uploading" && "Uploading..."}
                    {uploadStatus === "processing" && "AI Processing..."}
                  </span>
                </>
              ) : (
                "Upload & Analyze Files"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {uploadStatus === "success" && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Files uploaded successfully!
            {ocrResults && ocrResults.biomarkers.length > 0 && (
              <span className="block mt-1">
                ✨ AI found {ocrResults.biomarkers.length} biomarkers in your
                document
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* OCR Results Display */}
      {ocrResults && ocrResults.success && (
        <div className="mt-6 border rounded-lg p-4 bg-slate-50">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-slate-700">
              AI Analysis Results
            </h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                ocrResults.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {ocrResults.confidence} confidence
            </span>
          </div>

          {/* Test Information */}
          {(ocrResults.testInfo.testDate || ocrResults.testInfo.labName) && (
            <div className="mb-4 p-3 bg-white rounded border">
              <h5 className="font-medium text-slate-700 mb-2">
                Test Information
              </h5>
              {ocrResults.testInfo.testDate && (
                <p className="text-sm text-slate-600">
                  📅 Date: {ocrResults.testInfo.testDate}
                </p>
              )}
              {ocrResults.testInfo.labName && (
                <p className="text-sm text-slate-600">
                  🏥 Lab: {ocrResults.testInfo.labName}
                </p>
              )}
            </div>
          )}

          {/* Biomarkers */}
          {ocrResults.biomarkers.length > 0 ? (
            <div className="mb-4">
              <h5 className="font-medium text-slate-700 mb-3">
                Detected Biomarkers ({ocrResults.biomarkers.length})
              </h5>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {ocrResults.biomarkers.map((biomarker, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {biomarker.name}
                    </span>
                    <div className="text-right">
                      <span className="text-slate-900">
                        {biomarker.value} {biomarker.unit}
                      </span>
                      {biomarker.referenceRange && (
                        <div className="text-xs text-slate-500">
                          Ref: {biomarker.referenceRange}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-700">
                📝 Document processed, but no biomarkers were automatically
                detected. This could be due to document format or image quality.
              </p>
            </div>
          )}

          {/* Extracted Text Preview */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
              <Eye className="inline h-4 w-4 mr-1" />
              View Extracted Text Preview
            </summary>
            <div className="mt-2 p-3 bg-white border rounded text-xs font-mono text-slate-600 max-h-32 overflow-y-auto">
              {ocrResults.extractedText || "No text preview available"}
            </div>
          </details>

          <div className="mt-4 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(ocrResults.biomarkers, null, 2)
                );
              }}
              className="text-xs"
            >
              📋 Copy Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOcrResults(null)}
              className="text-xs"
            >
              ✕ Close Results
            </Button>
          </div>
        </div>
      )}

      {/* Next Steps Hint */}
      {uploadStatus === "success" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            🚀 What's Next?
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Your document has been securely uploaded and analyzed</li>
            <li>
              • AI-extracted biomarkers will be used for health trend analysis
            </li>
            <li>• Visit your dashboard to see insights and recommendations</li>
            {ocrResults && ocrResults.biomarkers.length > 0 && (
              <li>
                • Detected values will be compared against reference ranges
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
