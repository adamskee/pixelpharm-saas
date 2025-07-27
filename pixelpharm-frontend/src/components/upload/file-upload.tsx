// File: src/components/upload/file-upload.tsx

"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
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
  Database,
} from "lucide-react";

interface FileUploadProps {
  onUploadComplete?: (
    fileKey: string,
    ocrResults?: any,
    uploadId?: string
  ) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  uploadType?: string;
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
  uploadType = "BLOOD_TESTS",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "storing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ocrResults, setOcrResults] = useState<OCRResult | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.userId || "";

  if (!userId) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="border-2 border-gray-300 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-2">Authentication Required</p>
          <p className="text-sm text-gray-500">
            Please sign in to upload files
          </p>
        </div>
      </div>
    );
  }

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
      setUploadId(null);
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

        // Step 1: Get presigned URL and upload to S3
        const response = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: uploadType,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API request failed: ${response.status} - ${errorText}`
          );
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

        setUploadProgress(25); // 25% - File uploaded

        // Step 2: Track upload in database
        setProcessingStep(`Recording ${file.name} in database...`);

        try {
          const trackResponse = await fetch("/api/uploads/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId,
              fileKey,
              uploadType: uploadType.toUpperCase().replace("-", "_"), // Convert to enum format
              originalFilename: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });

          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            console.log("✅ Upload tracked successfully:", trackData.uploadId);
            setUploadId(trackData.uploadId);
          } else {
            const trackError = await trackResponse.text();
            console.warn("Upload tracking failed:", trackError);
            // Continue with processing even if tracking fails
          }
        } catch (trackError) {
          console.warn("Upload tracking error:", trackError);
          // Continue with processing even if tracking fails
        }

        setUploadProgress(50); // 50% - Upload tracked

        // Step 3: OCR Processing (for PDFs and images)
        if (file.type === "application/pdf" || file.type.startsWith("image/")) {
          setUploadStatus("processing");
          setProcessingStep(`Analyzing ${file.name} with AI...`);

          try {
            const ocrResponse = await fetch("/api/ai/extract-text", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileKey,
                userId: userId,
              }),
            });

            if (ocrResponse.ok) {
              const ocrData = await ocrResponse.json();
              setOcrResults(ocrData);
              console.log("✅ OCR processing completed:", ocrData);

              // ✨ NEW: Store biomarkers if found
              if (
                ocrData.success &&
                ocrData.biomarkers &&
                ocrData.biomarkers.length > 0
              ) {
                setUploadStatus("storing");
                setProcessingStep(
                  `Storing ${ocrData.biomarkers.length} biomarkers...`
                );
                console.log(
                  "🩸 OCR extracted biomarkers, storing in database..."
                );

                try {
                  const storageResponse = await fetch(
                    "/api/ai/store-biomarkers",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: userId,
                        uploadId: uploadId || `temp-${Date.now()}`, // Use actual uploadId or fallback
                        biomarkers: ocrData.biomarkers,
                        testDate: ocrData.testInfo?.testDate,
                        labName: ocrData.testInfo?.labName,
                      }),
                    }
                  );

                  const storageResult = await storageResponse.json();

                  if (storageResult.success) {
                    console.log(
                      "✅ Biomarkers stored successfully:",
                      storageResult.data
                    );
                    setProcessingStep(
                      `Found and stored ${
                        storageResult.data?.storedBiomarkers ||
                        ocrData.biomarkers.length
                      } biomarkers from ${file.name}`
                    );
                  } else {
                    console.error(
                      "❌ Failed to store biomarkers:",
                      storageResult.error
                    );
                    setProcessingStep(
                      `Found ${ocrData.biomarkers.length} biomarkers in ${file.name} (storage failed)`
                    );
                  }
                } catch (storageError) {
                  console.error(
                    "❌ Error calling biomarker storage API:",
                    storageError
                  );
                  setProcessingStep(
                    `Found ${ocrData.biomarkers.length} biomarkers in ${file.name} (storage error)`
                  );
                }
              } else {
                setProcessingStep(
                  `Analyzed ${file.name} (no biomarkers found)`
                );
              }
            } else {
              console.warn("OCR processing failed for:", file.name);
              setProcessingStep(`Uploaded ${file.name} (OCR failed)`);
            }
          } catch (ocrError) {
            console.warn("OCR processing error:", ocrError);
            setProcessingStep(`Uploaded ${file.name} (OCR error)`);
          }
        }

        setUploadProgress(100); // 100% - Processing complete

        // Update progress for this file
        const progress = ((i + 1) / files.length) * 100;
        setUploadProgress(progress);
      }

      setUploadStatus("success");
      setProcessingStep("All files processed successfully!");

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(
          files[0] ? `fileKey-${Date.now()}` : "",
          ocrResults,
          uploadId
        );
      }

      // Reset files after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setProcessingStep("");
      }, 3000);
    } catch (error) {
      console.error("❌ Upload failed:", error);
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadStatus("idle");
    setErrorMessage("");
    setOcrResults(null);
    setUploadProgress(0);
    setProcessingStep("");
    setUploadId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload Area */}
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
        {isDragActive ? (
          <p className="text-lg text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Drag & drop your files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, JPEG, PNG, TIFF, WebP (max 25MB each)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Upload Progress</span>
            <span className="text-sm text-gray-500">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          {processingStep && (
            <div className="flex items-center space-x-2 mt-2">
              {uploadStatus === "storing" && (
                <Database className="h-4 w-4 animate-pulse text-blue-600" />
              )}
              {uploadStatus === "processing" && (
                <Brain className="h-4 w-4 animate-pulse text-purple-600" />
              )}
              <p className="text-sm text-gray-600">{processingStep}</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !uploading && uploadStatus !== "success" && (
        <div className="mt-6">
          <Button onClick={uploadFiles} className="w-full" size="lg">
            <Upload className="w-4 h-4 mr-2" />
            Upload {files.length} file{files.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Success State */}
      {uploadStatus === "success" && (
        <Alert className="mt-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Files uploaded and processed successfully!
            {ocrResults && (
              <span>
                {" "}
                Found {ocrResults.biomarkers?.length || 0} biomarkers.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {uploadStatus === "error" && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* OCR Results */}
      {ocrResults && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            AI Analysis Results
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Biomarkers Found</h4>
                <p className="text-sm text-gray-600">
                  {ocrResults.biomarkers?.length || 0} biomarkers detected
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Confidence Score</h4>
                <p className="text-sm text-gray-600">{ocrResults.confidence}</p>
              </div>
            </div>
            {ocrResults.biomarkers && ocrResults.biomarkers.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Detected Biomarkers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ocrResults.biomarkers.slice(0, 6).map((biomarker, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded">
                      <span className="font-medium">{biomarker.name}:</span>{" "}
                      {biomarker.value} {biomarker.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(uploadStatus === "success" || uploadStatus === "error") && (
        <div className="mt-6">
          <Button onClick={resetUpload} variant="outline" className="w-full">
            Upload More Files
          </Button>
        </div>
      )}
    </div>
  );
}
