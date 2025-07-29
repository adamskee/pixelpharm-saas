"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Scale,
  Activity,
  Database,
  Brain,
} from "lucide-react";

interface BodyCompositionUploadProps {
  onUploadComplete?: (
    fileKey: string,
    bodyCompositionData?: any,
    uploadId?: string
  ) => void;
}

export default function BodyCompositionUpload({
  onUploadComplete,
}: BodyCompositionUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "storing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [bodyCompositionResults, setBodyCompositionResults] =
    useState<any>(null);
  const [uploadId, setUploadId] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate file size (25MB max)
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(
          `File ${file.name} is too large. Maximum size is 25MB.`
        );
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setUploadStatus("idle");
    setErrorMessage("");
    setBodyCompositionResults(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".tiff", ".webp"],
    },
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  const uploadFiles = async () => {
    if (files.length === 0 || !user?.userId) {
      setErrorMessage("Please select files and ensure you're logged in");
      return;
    }

    setUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStep(`Uploading ${file.name}...`);

        // Step 1: Get presigned URL
        const presignedResponse = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: "BODY_COMPOSITION", // Changed to match enum
            userId: user.userId,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, fileKey } = await presignedResponse.json();

        // Step 2: Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        setUploadProgress(25);

        // Step 3: Track upload in database
        setProcessingStep("Recording body composition scan in database...");
        let trackData = null;

        const trackResponse = await fetch("/api/uploads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.userId,
            userEmail: user?.email,
            userFirstName: user?.firstName,
            userLastName: user?.lastName,
            fileKey,
            originalFilename: file.name,
            fileType: file.type,
            uploadType: "BODY_COMPOSITION",
            fileSize: file.size,
          }),
        });

        if (!trackResponse.ok) {
          console.warn("Failed to track upload in database");
        } else {
          trackData = await trackResponse.json();
          setUploadId(trackData.uploadId);
        }

        setUploadProgress(50);

        // Step 4: Claude AI Processing for body composition
        setUploadStatus("processing");
        setProcessingStep("Analyzing body composition scan with Claude AI...");

        let aiData = null; // Use local variable instead of state

        try {
          const aiResponse = await fetch("/api/ai/extract-body-composition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileKey,
              uploadType: "BODY_COMPOSITION",
            }),
          });

          if (aiResponse.ok) {
            aiData = await aiResponse.json(); // Store in local variable
            setBodyCompositionResults(aiData); // Also update state for UI
            const metricsCount = Object.keys(
              aiData.bodyComposition || {}
            ).length;
            setProcessingStep(`Claude AI extracted ${metricsCount} body composition metrics`);
            console.log("🎯 Claude body composition analysis completed:", aiData);
          } else {
            console.warn(
              "Claude AI analysis failed, but upload succeeded"
            );
            setProcessingStep("Scan uploaded (Claude AI analysis unavailable)");
          }
        } catch (aiError) {
          console.warn("Claude AI processing error:", aiError);
          setProcessingStep("Scan uploaded (Claude AI analysis failed)");
        }

        setUploadProgress(75);

        // Step 5: Store body composition results in database
        // Use local aiData variable instead of state
        if (aiData && aiData.success && trackData?.uploadId) {
          setUploadStatus("storing");
          setProcessingStep("Storing body composition data in database...");

          try {
            console.log("💾 Attempting to store body composition data:", {
              uploadId: trackData.uploadId,
              userId: user.userId,
              hasBodyComposition: !!aiData.bodyComposition,
              metricsCount: Object.keys(aiData.bodyComposition || {}).length,
            });

            const storeResponse = await fetch(
              "/api/ai/store-body-composition",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uploadId: trackData.uploadId,
                  userId: user.userId,
                  bodyCompositionData: aiData, // Use local variable
                }),
              }
            );

            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              setProcessingStep(
                `Stored ${
                  storeData.metricsStored || 0
                } body composition metrics in database`
              );
              console.log(
                "💾 Body composition data stored successfully:",
                storeData
              );
            } else {
              const errorText = await storeResponse.text();
              console.error(
                "Failed to store body composition data:",
                errorText
              );
              setProcessingStep("Results processed (database storage failed)");
            }
          } catch (storeError) {
            console.error("Database storage error:", storeError);
            setProcessingStep("Results processed (database storage failed)");
          }
        } else {
          console.warn("Skipping storage - missing data:", {
            hasAiData: !!aiData,
            aiDataSuccess: aiData?.success,
            hasTrackData: !!trackData,
            hasUploadId: !!trackData?.uploadId,
          });
        }

        setUploadProgress(((i + 1) / files.length) * 100);

        if (onUploadComplete) {
          onUploadComplete(
            fileKey,
            aiData, // Use local variable
            trackData?.uploadId
          );
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

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <Upload className="h-4 w-4" />;
      case "processing":
        return <Brain className="h-4 w-4" />;
      case "storing":
        return <Database className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Claude AI Analysis...";
      case "storing":
        return "Saving to Database...";
      case "success":
        return "Complete!";
      case "error":
        return "Error";
      default:
        return "Upload & Analyze Scans";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Scale className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">
            Drop the body composition scans here...
          </p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop body composition scans here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports: InBody 570, DEXA scans, Bod Pod reports (PDF, PNG, JPG,
              TIFF, WebP)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: 25MB each
            </p>
          </div>
        )}
      </div>

      {/* Authentication Check */}
      {!user?.userId && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please log in to upload body composition scans
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Files ready for upload:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {file.name}
                  </p>
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
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {processingStep}
            </span>
            <span className="text-sm text-gray-500">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex space-x-3">
          <Button
            onClick={uploadFiles}
            disabled={uploading || !user?.userId}
            className="flex-1"
          >
            {uploading ? (
              <>
                {getStatusIcon()}
                <span className="ml-2">{getStatusText()}</span>
              </>
            ) : (
              "Upload & Analyze Scans"
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
      )}

      {/* Success Message */}
      {uploadStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Body composition scans uploaded and analyzed successfully!
            {bodyCompositionResults &&
              Object.keys(bodyCompositionResults.bodyComposition || {}).length >
                0 && (
                <span className="block mt-1">
                  ✨ Claude AI extracted{" "}
                  {Object.keys(bodyCompositionResults.bodyComposition).length}{" "}
                  body composition metrics
                </span>
              )}
            {uploadId && (
              <span className="block mt-1 text-xs">
                📊 Upload ID: {uploadId}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {uploadStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Body Composition Results Display */}
      {bodyCompositionResults && bodyCompositionResults.success && (
        <div className="border rounded-lg p-4 bg-slate-50">
          <div className="flex items-center space-x-2 mb-4">
            <Scale className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-slate-700">
              Body Composition Analysis Results
            </h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                bodyCompositionResults.confidence === "high"
                  ? "bg-green-100 text-green-800"
                  : bodyCompositionResults.confidence === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {bodyCompositionResults.confidence} confidence
            </span>
          </div>

          {bodyCompositionResults.processingInfo && (
            <div className="mb-3 text-sm text-gray-600">
              <strong>Detected Device:</strong>{" "}
              {bodyCompositionResults.processingInfo.detectedDevice}
              {bodyCompositionResults.processingInfo.extractionDate && (
                <span className="ml-4">
                  <strong>Processed:</strong>{" "}
                  {new Date(
                    bodyCompositionResults.processingInfo.extractionDate
                  ).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {bodyCompositionResults.bodyComposition && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(bodyCompositionResults.bodyComposition).map(
                ([key, value]: [string, any]) => {
                  if (value === undefined || value === null) return null;

                  // Skip rendering objects (like nested muscle/fat/water data)
                  if (typeof value === "object" && value !== null) return null;

                  return (
                    <div key={key} className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-gray-600">
                        {typeof value === "number" ? value.toFixed(1) : String(value)}
                        {key.includes("Percentage") || key.includes("Fat")
                          ? "%"
                          : ""}
                        {key.includes("Weight") || key.includes("Mass")
                          ? " kg"
                          : ""}
                        {key.includes("bmr") ? " kcal" : ""}
                        {key.includes("Level") && typeof value === "number"
                          ? ""
                          : ""}
                      </div>
                    </div>
                  );
                }
              )}
              
              {/* Render nested objects separately if they exist */}
              {bodyCompositionResults.bodyComposition.muscle && (
                <div className="bg-blue-50 p-3 rounded border col-span-full">
                  <div className="font-medium text-gray-700 mb-2">Muscle Distribution</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(bodyCompositionResults.bodyComposition.muscle).map(
                      ([musclePart, muscleValue]: [string, any]) => (
                        <div key={musclePart} className="flex justify-between">
                          <span className="capitalize">{musclePart.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span>{typeof muscleValue === "number" ? muscleValue.toFixed(1) : String(muscleValue)} kg</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              
              {bodyCompositionResults.bodyComposition.fat && (
                <div className="bg-red-50 p-3 rounded border col-span-full">
                  <div className="font-medium text-gray-700 mb-2">Fat Distribution</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(bodyCompositionResults.bodyComposition.fat).map(
                      ([fatPart, fatValue]: [string, any]) => (
                        <div key={fatPart} className="flex justify-between">
                          <span className="capitalize">{fatPart.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span>{typeof fatValue === "number" ? fatValue.toFixed(1) : String(fatValue)}{fatPart.includes("Percentage") || fatPart.includes("Fat") ? "%" : fatPart.includes("Level") ? "" : " kg"}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              
              {bodyCompositionResults.bodyComposition.water && (
                <div className="bg-cyan-50 p-3 rounded border col-span-full">
                  <div className="font-medium text-gray-700 mb-2">Water Content</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(bodyCompositionResults.bodyComposition.water).map(
                      ([waterPart, waterValue]: [string, any]) => (
                        <div key={waterPart} className="flex justify-between">
                          <span className="capitalize">{waterPart.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span>{typeof waterValue === "number" ? waterValue.toFixed(1) : String(waterValue)} L</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              
              {bodyCompositionResults.bodyComposition.metabolic && (
                <div className="bg-green-50 p-3 rounded border col-span-full">
                  <div className="font-medium text-gray-700 mb-2">Metabolic Data</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(bodyCompositionResults.bodyComposition.metabolic).map(
                      ([metPart, metValue]: [string, any]) => (
                        <div key={metPart} className="flex justify-between">
                          <span className="capitalize">{metPart.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span>{typeof metValue === "number" ? metValue.toFixed(1) : String(metValue)}{metPart.includes("bmr") ? " kcal" : " kg"}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(
                    bodyCompositionResults.bodyComposition,
                    null,
                    2
                  )
                );
              }}
              className="text-xs"
            >
              📋 Copy Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBodyCompositionResults(null)}
              className="text-xs"
            >
              ✕ Close Results
            </Button>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {uploadStatus === "success" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            🚀 What's Next?
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              • Your body composition scan has been securely uploaded and
              analyzed by Claude AI
            </li>
            <li>
              • Claude AI-extracted metrics are now stored in your health database
            </li>
            <li>
              • Visit your dashboard to see body composition trends and
              correlations
            </li>
            <li>
              • Upload more scans to track body composition changes over time
            </li>
            <li>
              • Combine with blood test data for comprehensive health insights
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
