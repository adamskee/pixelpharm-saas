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
  Scale,
} from "lucide-react";

interface BodyCompositionUploadProps {
  onUploadComplete?: (fileKey: string) => void;
}

export default function BodyCompositionUpload({
  onUploadComplete,
}: BodyCompositionUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

    setFiles(validFiles);
    setUploadStatus("idle");
    setErrorMessage("");
  }, []);

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

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Get presigned URL for body composition uploads
        const response = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: "body-composition", // Specify this is body composition data
          }),
        });

        const { uploadUrl, fileKey } = await response.json();

        // Upload file to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        setUploadProgress(((i + 1) / files.length) * 100);

        if (onUploadComplete) {
          onUploadComplete(fileKey);
        }
      }

      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Scale className="mx-auto h-12 w-12 text-green-400 mb-4" />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          {isDragActive
            ? "Drop body composition files here"
            : "Drag & drop body composition scans"}
        </p>
        <p className="text-sm text-gray-500 mb-4">or click to select files</p>
        <p className="text-xs text-gray-400">
          Upload InBody 570, DEXA scans, or other body composition reports
          <br />
          Supports: PDF, JPEG, PNG, TIFF, WebP (max 25MB each)
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
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload Body Composition Scans"}
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
            Body composition scans uploaded successfully!
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
    </div>
  );
}
