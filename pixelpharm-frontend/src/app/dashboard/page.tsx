// src/app/dashboard/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Brain,
  Heart,
  Scale,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Upload,
  ArrowRight,
  User,
  Settings,
  Bell,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface DashboardStats {
  totalUploads: number;
  bloodTestUploads: number;
  bodyCompositionUploads: number;
  fitnessActivityUploads: number;
  biomarkersTracked: number;
  uniqueBiomarkers: number;
  lastUploadDate: string | null;
  firstUploadDate: string | null;
  aiAnalysesRun: number;
  healthInsightsGenerated: number;
  abnormalValues: number;
  criticalValues: number;
  healthScore: number | null;
  trendingBiomarkers: Array<{
    name: string;
    trend: "improving" | "stable" | "concerning";
    changePercent: number;
  }>;
  dataCompleteness: number;
  lastAnalysisDate: string | null;
  consecutiveDaysTracked: number;
  healthGoalsAchieved: number;
  riskAssessments: {
    cardiovascular: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    metabolic: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    overall: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  };
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchDashboardStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/dashboard/comprehensive-stats?userId=${
          user?.userId
        }&_timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (!user?.userId) return;
    fetchDashboardStats();
  }, [user?.userId]);

  const handleRefreshStats = () => {
    if (!user?.userId || refreshing) return;
    fetchDashboardStats(true);
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">
            Loading your health dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                Unable to Load Dashboard
              </h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <FileText className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                No Health Data Yet
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload your first health document to get started
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return null;
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "text-green-600 bg-green-50";
      case "MODERATE":
        return "text-yellow-600 bg-yellow-50";
      case "HIGH":
        return "text-orange-600 bg-orange-50";
      case "CRITICAL":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "stable":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "concerning":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Dashboard Header with Refresh Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || "Health Explorer"}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Here's your comprehensive health analytics overview
          </p>
        </div>
        <Button
          onClick={handleRefreshStats}
          disabled={refreshing}
          variant="outline"
          className="flex items-center space-x-2 hover:bg-blue-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh Stats"}</span>
        </Button>
      </div>

      {/* Fitness Data Integration Notice */}
      {stats.fitnessActivityUploads > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  Fitness Data Integrated! 🏃‍♂️
                </h3>
                <p className="text-sm text-orange-700">
                  {stats.fitnessActivityUploads} Garmin activities successfully
                  processed and included in your health analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            <p>
              Your PixelPharm dashboard provides a comprehensive view of your
              health data and MMMS powered insights. Here you can track your
              uploaded health documents, monitor your overall health score, and
              access personalized recommendations based on your latest biomarker
              analysis. To get started, upload your blood test results, body
              composition reports, or fitness activity data using the upload
              buttons above.
            </p>{" "}
            <p>
              Our advanced Multi Model Medical System (MMMS) will automatically
              extract key health metrics and provide professional-grade analysis
              with actionable recommendations. Your health score is calculated
              in real-time based on all available data, giving you an instant
              snapshot of your current wellness status.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/upload">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer group">
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="text-left flex-1">
                  <div className="font-medium text-blue-900 group-hover:text-blue-700">
                    Upload Blood Test
                  </div>
                  <div className="text-sm text-blue-600">
                    Add new lab results
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-400 group-hover:text-blue-600" />
              </div>
            </Link>

            <Link href="/body-composition">
              <div className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer group">
                <Scale className="h-6 w-6 text-green-600" />
                <div className="text-left flex-1">
                  <div className="font-medium text-green-900 group-hover:text-green-700">
                    Body Composition
                  </div>
                  <div className="text-sm text-green-600">
                    Upload InBody/DEXA scan
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-green-400 group-hover:text-green-600" />
              </div>
            </Link>

            <Link href="/dashboard/health-analytics">
              <div className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer group">
                <Brain className="h-6 w-6 text-purple-600" />
                <div className="text-left flex-1">
                  <div className="font-medium text-purple-900 group-hover:text-purple-700">
                    AI Health Analysis
                  </div>
                  <div className="text-sm text-purple-600">
                    Get AI-powered insights
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
              </div>
            </Link>

            <Link href="/fitness-activities">
              <div className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer group">
                <Activity className="h-6 w-6 text-orange-600" />
                <div className="text-left flex-1">
                  <div className="font-medium text-orange-900 group-hover:text-orange-700">
                    Fitness Data
                  </div>
                  <div className="text-sm text-orange-600">
                    Upload activity data - Garmin Currently supported
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-orange-400 group-hover:text-orange-600" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Health Score & Risk Assessment Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overall Health Score */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Health Score
            </CardTitle>
            <Heart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats.healthScore !== null ? `${stats.healthScore}/100` : "N/A"}
            </div>
            {stats.healthScore !== null && (
              <Progress value={stats.healthScore} className="mt-2" />
            )}
            <p className="text-xs text-blue-600 mt-2">
              {stats.healthScore !== null
                ? stats.healthScore >= 80
                  ? "Excellent health indicators"
                  : stats.healthScore >= 60
                  ? "Good overall health"
                  : stats.healthScore >= 40
                  ? "Some areas need attention"
                  : "Consider consulting healthcare provider"
                : "Upload data for health score"}
            </p>
          </CardContent>
        </Card>

        {/* Cardiovascular Risk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cardiovascular Risk
            </CardTitle>
            <Heart className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <Badge
              className={`${getRiskColor(
                stats.riskAssessments.cardiovascular
              )} text-sm font-semibold`}
            >
              {stats.riskAssessments.cardiovascular}
            </Badge>
            <p className="text-xs text-gray-600 mt-2">
              Based on lipid panel, blood pressure markers
            </p>
          </CardContent>
        </Card>

        {/* Metabolic Risk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metabolic Risk
            </CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <Badge
              className={`${getRiskColor(
                stats.riskAssessments.metabolic
              )} text-sm font-semibold`}
            >
              {stats.riskAssessments.metabolic}
            </Badge>
            <p className="text-xs text-gray-600 mt-2">
              Glucose, insulin, metabolic markers
            </p>
          </CardContent>
        </Card>

        {/* Data Completeness */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Data Completeness
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataCompleteness}%</div>
            <Progress value={stats.dataCompleteness} className="mt-2" />
            <p className="text-xs text-gray-600 mt-2">
              {stats.dataCompleteness >= 80
                ? "Comprehensive profile"
                : "Upload more data for better insights"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Uploads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Health Uploads
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUploads}</div>
            <p className="text-xs text-gray-600">
              <span className="text-green-600">
                {stats.bloodTestUploads} blood tests
              </span>{" "}
              •
              <span className="text-purple-600">
                {" "}
                {stats.bodyCompositionUploads} body comp
              </span>{" "}
              •
              <span className="text-orange-600">
                {" "}
                {stats.fitnessActivityUploads} fitness
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Biomarkers Tracked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Biomarkers Tracked
            </CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.biomarkersTracked}</div>
            <p className="text-xs text-gray-600">
              {stats.uniqueBiomarkers} unique markers across all tests
            </p>
          </CardContent>
        </Card>

        {/* Last Upload */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
            <Calendar className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(stats.lastUploadDate)}
            </div>
            <p className="text-xs text-gray-600">
              {getDaysAgo(stats.lastUploadDate)}
            </p>
            {stats.firstUploadDate && (
              <p className="text-xs text-gray-500 mt-1">
                Tracking since {formatDate(stats.firstUploadDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Consecutive Days */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tracking Streak
            </CardTitle>
            <Zap className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.consecutiveDaysTracked}
            </div>
            <p className="text-xs text-gray-600">
              {stats.consecutiveDaysTracked === 1 ? "day" : "days"} of
              consistent tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis & Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* AI Analyses Run */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
            <Brain className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiAnalysesRun}</div>
            <p className="text-xs text-gray-600">
              Comprehensive health assessments
            </p>
            {stats.lastAnalysisDate && (
              <p className="text-xs text-gray-500 mt-1">
                Last: {getDaysAgo(stats.lastAnalysisDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Health Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Health Insights
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.healthInsightsGenerated}
            </div>
            <p className="text-xs text-gray-600">
              Personalized recommendations generated
            </p>
          </CardContent>
        </Card>

        {/* Abnormal Values */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Values Flagged
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.abnormalValues}
              {stats.criticalValues > 0 && (
                <span className="text-lg text-red-600 ml-2">
                  ({stats.criticalValues} critical)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Values outside normal ranges
            </p>
          </CardContent>
        </Card>

        {/* Health Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Goals Achieved
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.healthGoalsAchieved}
            </div>
            <p className="text-xs text-gray-600">
              Health targets successfully met
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trending Biomarkers */}
      {stats.trendingBiomarkers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Biomarker Trends</span>
            </CardTitle>
            <CardDescription>
              Recent changes in your key health markers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.trendingBiomarkers.map((biomarker, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(biomarker.trend)}
                    <span className="font-medium">{biomarker.name}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        biomarker.trend === "improving"
                          ? "text-green-600"
                          : biomarker.trend === "concerning"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {biomarker.changePercent > 0 ? "+" : ""}
                      {biomarker.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Summary */}
      {stats.lastUploadDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Latest upload processed</div>
                    <div className="text-sm text-gray-600">
                      {getDaysAgo(stats.lastUploadDate)}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Completed
                </Badge>
              </div>

              {stats.aiAnalysesRun > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">AI analysis completed</div>
                      <div className="text-sm text-gray-600">
                        {stats.aiAnalysesRun} total analyses
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Active
                  </Badge>
                </div>
              )}

              {stats.abnormalValues > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-yellow-800">
                        Values flagged for review
                      </div>
                      <div className="text-sm text-yellow-600">
                        {stats.abnormalValues} biomarkers outside normal range
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/health-analytics">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Review
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
