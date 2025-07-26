// File: src/app/dashboard/health-analytics/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BodyCompositionSummary } from "@/components/dashboard/body-composition-summary";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Heart,
  Activity,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  UserX,
  Database,
  Upload,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface MedicalReview {
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  healthMetrics: {
    totalReports: number;
    latestHealthScore: number;
    riskLevel: string;
    lastAnalysisDate: string | null;
  };
  biomarkers: {
    totalBiomarkers: number;
    abnormalCount: number;
    criticalCount: number;
    normalCount: number;
    lastTestDate: string | null;
  };
  bodyComposition?: {
    totalScans: number;
    latestBMI: number | null;
    bodyFatPercentage: number | null;
    muscleMass: number | null;
    lastScanDate: string | null;
  };
  trends?: {
    healthScoreTrend: string;
    weightTrend: string;
    cholesterolTrend: string;
    overallTrend: string;
  };
  recentActivity: Array<{
    type: string;
    date: string;
    description: string;
    status: string;
  }>;
  recommendations: {
    activeCount: number;
    highPriorityCount: number;
    completedCount: number;
    categories: string[];
  };
  dataQuality: {
    completeness: number;
    reliability: string;
    lastUpdated: string;
  };
  performance: {
    processingTime: number;
    cacheHit: boolean;
    dataSource: string;
    generatedAt: string;
  };
  _debug?: {
    fileUploadsFound: number;
    biomarkerValuesFound: number;
    userId: string;
    mostRecentUpload: string;
    mostRecentUploadDate: string;
  };
}

// Safe string helper to prevent .replace() errors
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

// Safe date helper
const safeDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  try {
    return new Date(value);
  } catch {
    return new Date();
  }
};

export default function EnhancedHealthAnalyticsDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [medicalReview, setMedicalReview] = useState<MedicalReview | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check authentication first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Authentication...
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Checking your login status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserX className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please sign in to access your health analytics dashboard.
            </p>
            <Button
              onClick={() => (window.location.href = "/auth/login")}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchMedicalReview = async (forceRefresh = false) => {
    if (!user?.userId) {
      setError("No user ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🏥 Loading comprehensive stats for user:", user.userId);

      // Call the comprehensive stats API that we just fixed
      const response = await fetch(
        `/api/dashboard/comprehensive-stats?userId=${
          user.userId
        }&_timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Received comprehensive stats:", data);

      // Transform the comprehensive stats into medical review format
      const transformedReview: MedicalReview = {
        user: data.user || {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        healthMetrics: data.healthMetrics || {
          totalReports: 0,
          latestHealthScore: 0,
          riskLevel: "UNKNOWN",
          lastAnalysisDate: null,
        },
        biomarkers: data.biomarkers || {
          totalBiomarkers: 0,
          abnormalCount: 0,
          criticalCount: 0,
          normalCount: 0,
          lastTestDate: null,
        },
        bodyComposition: data.bodyComposition,
        trends: data.trends,
        recentActivity: data.recentActivity || [],
        recommendations: data.recommendations || {
          activeCount: 0,
          highPriorityCount: 0,
          completedCount: 0,
          categories: [],
        },
        dataQuality: data.dataQuality || {
          completeness: 0,
          reliability: "LOW",
          lastUpdated: new Date().toISOString(),
        },
        performance: data.performance || {
          processingTime: 0,
          cacheHit: false,
          dataSource: "unknown",
          generatedAt: new Date().toISOString(),
        },
        _debug: data._debug,
      };

      setMedicalReview(transformedReview);
      console.log("✅ Medical review loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching medical review:", err);
      setError(safeString(err));
    } finally {
      setLoading(false);
    }
  };

  const triggerNewAnalysis = async () => {
    setIsAnalyzing(true);
    await fetchMedicalReview(true);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (user?.userId) {
      fetchMedicalReview();
    }
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Your Health Data
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Hello {user?.firstName || user?.email}! Fetching your health
              analytics...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !medicalReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analysis Error
              </h3>
              <p className="text-sm text-gray-600 mb-4">{safeString(error)}</p>
              <Button onClick={() => fetchMedicalReview()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!medicalReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Health Data Available
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Welcome {user?.firstName || user?.email}! Upload your biomarker
                data to get started.
              </p>
              <Link href="/upload">
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Health Data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskBadgeColor = (risk: string) => {
    const riskLevel = safeString(risk).toUpperCase();
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "CRITICAL":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    const sev = safeString(severity).toUpperCase();
    switch (sev) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "HIGH":
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case "MODERATE":
        return <Activity className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = safeString(priority).toUpperCase();
    switch (p) {
      case "HIGH":
        return "border-l-red-500 bg-red-50";
      case "MEDIUM":
        return "border-l-yellow-500 bg-yellow-50";
      case "LOW":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  // Check if this is real data or demo data
  const isRealData = medicalReview.performance?.dataSource === "database";
  const dataSourceBadge = isRealData ? "Real Data" : "Demo Data";
  const dataSourceColor = isRealData
    ? "bg-green-100 text-green-800"
    : "bg-blue-100 text-blue-800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Enhanced Health Analytics
              </h1>
              <p className="text-gray-600">
                Welcome {user?.firstName || user?.email}! • AI-powered health
                assessment • Last updated{" "}
                {medicalReview.healthMetrics.lastAnalysisDate
                  ? safeDate(
                      medicalReview.healthMetrics.lastAnalysisDate
                    ).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={dataSourceColor}>
                {dataSourceBadge} • User: {user?.userId}
              </Badge>
              <Button
                onClick={triggerNewAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isAnalyzing ? "Refreshing..." : "Refresh Data"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="clinical"
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>Clinical</span>
            </TabsTrigger>
            <TabsTrigger
              value="systems"
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Systems</span>
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Actions</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Data Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {medicalReview.healthMetrics.latestHealthScore}
                    </div>
                    <div className="text-lg font-semibold text-gray-600 mb-4">
                      Reports: {medicalReview.healthMetrics.totalReports}
                    </div>
                    <Badge
                      className={getRiskBadgeColor(
                        medicalReview.healthMetrics.riskLevel
                      )}
                    >
                      {safeString(medicalReview.healthMetrics.riskLevel)} RISK
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Biomarkers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span>Biomarkers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {medicalReview.biomarkers.totalBiomarkers}
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {medicalReview.biomarkers.criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {medicalReview.biomarkers.criticalCount} Critical
                        </Badge>
                      )}
                      {medicalReview.biomarkers.abnormalCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {medicalReview.biomarkers.abnormalCount} Abnormal
                        </Badge>
                      )}
                      {medicalReview.biomarkers.normalCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {medicalReview.biomarkers.normalCount} Normal
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Last test:{" "}
                      {medicalReview.biomarkers.lastTestDate
                        ? safeDate(
                            medicalReview.biomarkers.lastTestDate
                          ).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <BodyCompositionSummary userId={user?.userId || ""} />

              {/* Data Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-green-500" />
                    <span>Data Quality</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completeness</span>
                        <span>{medicalReview.dataQuality.completeness}%</span>
                      </div>
                      <Progress
                        value={medicalReview.dataQuality.completeness}
                        className="h-2"
                      />
                    </div>
                    <div className="text-center">
                      <Badge
                        className={
                          medicalReview.dataQuality.reliability === "HIGH"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {safeString(medicalReview.dataQuality.reliability)}{" "}
                        Reliability
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Debug Information */}
            {medicalReview._debug && (
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>
                    Technical details about your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Uploads Found:</span>{" "}
                      {medicalReview._debug.fileUploadsFound}
                    </div>
                    <div>
                      <span className="font-medium">Biomarker Values:</span>{" "}
                      {medicalReview._debug.biomarkerValuesFound}
                    </div>
                    <div>
                      <span className="font-medium">Most Recent Upload:</span>{" "}
                      {medicalReview._debug.mostRecentUpload}
                    </div>
                    <div>
                      <span className="font-medium">Upload Date:</span>{" "}
                      {medicalReview._debug.mostRecentUploadDate !== "None"
                        ? safeDate(
                            medicalReview._debug.mostRecentUploadDate
                          ).toLocaleDateString()
                        : "None"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Clinical Tab */}
          <TabsContent value="clinical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Clinical Summary</span>
                </CardTitle>
                <CardDescription>
                  Based on your uploaded health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {medicalReview.biomarkers.criticalCount}
                    </div>
                    <div className="text-sm text-gray-600">Critical Values</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {medicalReview.biomarkers.abnormalCount}
                    </div>
                    <div className="text-sm text-gray-600">Abnormal Values</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {medicalReview.biomarkers.normalCount}
                    </div>
                    <div className="text-sm text-gray-600">Normal Values</div>
                  </div>
                </div>

                {medicalReview.biomarkers.totalBiomarkers === 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 mb-4">
                      No biomarker data available yet.
                    </p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Blood Test Results
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
                <CardDescription>
                  Health system analysis based on available data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalReview.trends ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">
                        Cardiovascular Health
                      </h4>
                      <Badge
                        className={getRiskBadgeColor(
                          medicalReview.trends.cholesterolTrend === "concerning"
                            ? "HIGH"
                            : "LOW"
                        )}
                      >
                        {medicalReview.trends.cholesterolTrend?.toUpperCase() ||
                          "UNKNOWN"}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        Based on cholesterol and cardiovascular markers
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Overall Trend</h4>
                      <Badge
                        className={getRiskBadgeColor(
                          medicalReview.trends.overallTrend === "positive"
                            ? "LOW"
                            : "MODERATE"
                        )}
                      >
                        {medicalReview.trends.overallTrend?.toUpperCase() ||
                          "UNKNOWN"}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        General health trajectory assessment
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      System analysis requires more biomarker data.
                    </p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload More Health Data
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Recommended Actions</span>
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {medicalReview.recommendations.activeCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Active Recommendations
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {medicalReview.recommendations.highPriorityCount}
                    </div>
                    <div className="text-sm text-gray-600">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {medicalReview.recommendations.completedCount}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>

                {medicalReview.recommendations.categories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Recommendation Categories:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {medicalReview.recommendations.categories.map(
                        (category, index) => (
                          <Badge key={index} variant="outline">
                            {category}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Health Trends</span>
                </CardTitle>
                <CardDescription>
                  Analysis of health changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalReview.trends ? (
                  <div className="space-y-4">
                    {Object.entries(medicalReview.trends).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="font-medium capitalize">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace("Trend", "")}
                          </span>
                          <Badge
                            className={getRiskBadgeColor(
                              value === "improving" || value === "positive"
                                ? "LOW"
                                : value === "concerning"
                                ? "HIGH"
                                : "MODERATE"
                            )}
                          >
                            {safeString(value).toUpperCase()}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Trend analysis requires multiple data points over time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>
                    Latest health data uploads and analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalReview.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {medicalReview.recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between border-b pb-2 last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {safeString(activity.description)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {safeDate(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                activity.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {safeString(activity.status)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">No recent activity</p>
                      <Link href="/upload">
                        <Button size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Health Data
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>System Performance</span>
                  </CardTitle>
                  <CardDescription>
                    Technical details about data processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Processing Time
                        </div>
                        <div className="font-semibold">
                          {(
                            medicalReview.performance.processingTime / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Cache Status
                        </div>
                        <Badge
                          className={
                            medicalReview.performance.cacheHit
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {medicalReview.performance.cacheHit
                            ? "Cache Hit"
                            : "Fresh Analysis"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Data Source
                      </div>
                      <Badge
                        className={
                          isRealData
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {medicalReview.performance.dataSource}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Last Updated
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {safeDate(
                            medicalReview.performance.generatedAt
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Data Quality Score
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={medicalReview.dataQuality.completeness}
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-semibold">
                          {medicalReview.dataQuality.completeness}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Data Summary</CardTitle>
                <CardDescription>
                  Complete overview of your health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {medicalReview.healthMetrics.totalReports}
                    </div>
                    <div className="text-sm text-gray-600">Total Reports</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {medicalReview.biomarkers.totalBiomarkers}
                    </div>
                    <div className="text-sm text-gray-600">Biomarkers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {medicalReview.recommendations.activeCount}
                    </div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {medicalReview.recentActivity.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Recent Activities
                    </div>
                  </div>
                </div>

                {/* Call to Action if no real data */}
                {!isRealData && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">
                          Ready to see your real health data?
                        </h4>
                        <p className="text-sm text-blue-700">
                          Upload your blood test results to get personalized
                          AI-powered health insights.
                        </p>
                      </div>
                      <Link href="/upload">
                        <Button>Upload Now</Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Success message if real data */}
                {isRealData && medicalReview._debug && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900">
                          Real Health Data Loaded!
                        </h4>
                        <p className="text-sm text-green-700">
                          Found {medicalReview._debug.fileUploadsFound} upload
                          {medicalReview._debug.fileUploadsFound !== 1
                            ? "s"
                            : ""}
                          {medicalReview._debug.mostRecentUpload !== "None" &&
                            ` including "${medicalReview._debug.mostRecentUpload}"`}
                        </p>
                      </div>
                      <Link href="/upload">
                        <Button variant="outline">Upload More</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
