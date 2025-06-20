"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface GarminActivity {
  activityType: string;
  date: string;
  favoriteTitle: string;
  distance: number;
  calories: number;
  time: string;
  avgHR: number;
  maxHR: number;
  aerobicTE: number;
  avgPace: string;
  maxPace: string;
  totalAscent: number;
  totalDescent: number;
  avgStrokeRate: number;
  totalStrokes: number;
  avgStrokeDistance: number;
  totalNumberOfStrokes: number;
  avgSwolf: number;
  avgStrokeDistance25y: number;
  decompression: string;
  bestLapTime: string;
  numberOfLaps: number;
  maxTemp: number;
  movingTime: string;
  elapsedTime: string;
  minElevation: number;
  maxElevation: number;
  trainingStressScore: number;
}

interface GarminCsvUploadProps {
  onUploadComplete?: (activities: GarminActivity[]) => void;
}

export default function GarminCsvUpload({
  onUploadComplete,
}: GarminCsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activities, setActivities] = useState<GarminActivity[]>([]);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activityStats, setActivityStats] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];

    if (!csvFile || !csvFile.name.endsWith(".csv")) {
      setErrorMessage("Please upload a CSV file from Garmin Connect");
      return;
    }

    setFile(csvFile);
    setUploadStatus("idle");
    setErrorMessage("");
    processGarminCsv(csvFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/csv": [".csv"],
    },
    multiple: false,
  });

  const processGarminCsv = async (file: File) => {
    setProcessing(true);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [",", "\t", "|", ";"],
      complete: (results) => {
        try {
          const processedActivities = results.data
            .filter((row: any) => row["Activity Type"] && row["Date"])
            .map((row: any) => ({
              activityType: row["Activity Type"] || "",
              date: row["Date"] || "",
              favoriteTitle: row["Favorite"] || "",
              distance: parseFloat(row["Distance"]) || 0,
              calories: parseInt(row["Calories"]) || 0,
              time: row["Time"] || "",
              avgHR: parseInt(row["Avg HR"]) || 0,
              maxHR: parseInt(row["Max HR"]) || 0,
              aerobicTE: parseFloat(row["Aerobic TE"]) || 0,
              avgPace: row["Avg Pace"] || "",
              maxPace: row["Max Pace"] || "",
              totalAscent: parseFloat(row["Total Ascent"]) || 0,
              totalDescent: parseFloat(row["Total Descent"]) || 0,
              avgStrokeRate: parseFloat(row["Avg Stroke Rate"]) || 0,
              totalStrokes: parseInt(row["Total Strokes"]) || 0,
              avgStrokeDistance: parseFloat(row["Avg Stroke Distance"]) || 0,
              totalNumberOfStrokes:
                parseInt(row["Total Number of Strokes"]) || 0,
              avgSwolf: parseFloat(row["Avg Swolf"]) || 0,
              avgStrokeDistance25y:
                parseFloat(row["Avg Stroke Distance (25y)"]) || 0,
              decompression: row["Decompression"] || "",
              bestLapTime: row["Best Lap Time"] || "",
              numberOfLaps: parseInt(row["Number of Laps"]) || 0,
              maxTemp: parseFloat(row["Max Temp"]) || 0,
              movingTime: row["Moving Time"] || "",
              elapsedTime: row["Elapsed Time"] || "",
              minElevation: parseFloat(row["Min Elevation"]) || 0,
              maxElevation: parseFloat(row["Max Elevation"]) || 0,
              trainingStressScore:
                parseFloat(row["Training Stress Score®"]) || 0,
            })) as GarminActivity[];

          setActivities(processedActivities);
          generateActivityStats(processedActivities);
          setUploadStatus("success");
        } catch (error) {
          setErrorMessage(
            "Error processing CSV file. Please check the format."
          );
          setUploadStatus("error");
        } finally {
          setProcessing(false);
        }
      },
      error: (error) => {
        setErrorMessage(`CSV parsing error: ${error.message}`);
        setUploadStatus("error");
        setProcessing(false);
      },
    });
  };

  const generateActivityStats = (activities: GarminActivity[]) => {
    const stats = {
      totalActivities: activities.length,
      totalCalories: activities.reduce((sum, a) => sum + a.calories, 0),
      totalDistance: activities.reduce((sum, a) => sum + a.distance, 0),
      avgHeartRate:
        activities
          .filter((a) => a.avgHR > 0)
          .reduce((sum, a) => sum + a.avgHR, 0) /
          activities.filter((a) => a.avgHR > 0).length || 0,
      activityTypes: [...new Set(activities.map((a) => a.activityType))],
      dateRange: {
        start:
          activities.length > 0
            ? new Date(
                Math.min(...activities.map((a) => new Date(a.date).getTime()))
              )
            : null,
        end:
          activities.length > 0
            ? new Date(
                Math.max(...activities.map((a) => new Date(a.date).getTime()))
              )
            : null,
      },
    };
    setActivityStats(stats);
  };

  const uploadToDatabase = async () => {
    if (activities.length === 0) return;

    setUploading(true);

    try {
      const response = await fetch("/api/fitness-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activities }),
      });

      if (!response.ok) {
        throw new Error("Failed to save activities to database");
      }

      if (onUploadComplete) {
        onUploadComplete(activities);
      }

      setUploadStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Garmin Connect Data Upload
          </CardTitle>
          <CardDescription>
            Upload your Garmin Connect activity history CSV file for fitness
            analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
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
              {isDragActive
                ? "Drop your CSV file here"
                : "Drag & drop Garmin Connect CSV"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to select your exported activities file
            </p>
            <p className="text-xs text-gray-400">
              Export from Garmin Connect → Activities → All Activities → Export
              CSV
            </p>
          </div>

          {/* Processing Status */}
          {processing && (
            <div className="mt-4">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-medium">
                  Processing CSV file...
                </span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          {/* File Info */}
          {file && !processing && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      {activityStats && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              Overview of your Garmin Connect activity data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {activityStats.totalActivities}
                </p>
                <p className="text-sm text-gray-600">Total Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {activityStats.totalCalories.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {activityStats.totalDistance.toFixed(1)} km
                </p>
                <p className="text-sm text-gray-600">Total Distance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Math.round(activityStats.avgHeartRate)} bpm
                </p>
                <p className="text-sm text-gray-600">Avg Heart Rate</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Activity Types:
              </p>
              <div className="flex flex-wrap gap-2">
                {activityStats.activityTypes.map(
                  (type: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {type}
                    </span>
                  )
                )}
              </div>
            </div>

            {activityStats.dateRange.start && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <strong>Date Range:</strong>{" "}
                  {activityStats.dateRange.start.toLocaleDateString()} -{" "}
                  {activityStats.dateRange.end?.toLocaleDateString()}
                </p>
              </div>
            )}

            <Button
              onClick={uploadToDatabase}
              disabled={uploading || activities.length === 0}
              className="w-full mt-4"
            >
              {uploading
                ? "Saving to Database..."
                : "Save Activities to PixelPharm"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {uploadStatus === "success" && !uploading && activities.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {activities.length} activities processed and saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Export Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Export from Garmin Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Log into <strong>Garmin Connect</strong> (connect.garmin.com)
            </li>
            <li>
              Navigate to <strong>Activities</strong> →{" "}
              <strong>All Activities</strong>
            </li>
            <li>
              Set your desired <strong>Date Range</strong> (last year
              recommended)
            </li>
            <li>
              Click the <strong>Export</strong> button
            </li>
            <li>
              Select <strong>Export to CSV</strong>
            </li>
            <li>Download and upload the CSV file here</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> For best results, export at least 3-6 months
              of activity data to enable meaningful trend analysis and health
              correlations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
