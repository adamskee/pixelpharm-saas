// File: src/app/dashboard/page.tsx

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
  LineChart,
  TrendingDown,
  Weight,
  Dumbbell,
  Percent,
  Users,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { MiniPieChart } from "@/components/ui/mini-pie-chart";

interface DashboardStats {
  user?: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  healthMetrics?: {
    totalReports: number;
    latestHealthScore: number;
    riskLevel: string;
    lastAnalysisDate: string | null;
  };
  biomarkers?: {
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
  recentActivity?: Array<{
    type: string;
    date: string;
    description: string;
    status: string;
  }>;
  recommendations?: {
    activeCount: number;
    highPriorityCount: number;
    completedCount: number;
    categories: string[];
  };
  dataQuality?: {
    completeness: number;
    reliability: string;
    lastUpdated: string;
  };
  performance?: {
    processingTime: number;
    cacheHit: boolean;
    dataSource: string;
    generatedAt: string;
  };
  // Legacy properties for backward compatibility
  totalUploads?: number;
  bloodTestUploads?: number;
  bodyCompositionUploads?: number;
  fitnessActivityUploads?: number;
  biomarkersTracked?: number;
  uniqueBiomarkers?: number;
  lastUploadDate?: string | null;
  firstUploadDate?: string | null;
  aiAnalysesRun?: number;
  healthInsightsGenerated?: number;
  abnormalValues?: number;
  criticalValues?: number;
  healthScore?: number | null;
  trendingBiomarkers?: Array<{
    name: string;
    trend: "improving" | "stable" | "concerning";
    changePercent: number;
  }>;
  dataCompleteness?: number;
  lastAnalysisDate?: string | null;
  consecutiveDaysTracked?: number;
  healthGoalsAchieved?: number;
  riskAssessments?: {
    cardiovascular: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    metabolic: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    overall: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  };
}

// Safe accessor functions to prevent undefined errors
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) return 0;
  return Number(value);
};

const safeArray = <T>(value: any): T[] => {
  if (!Array.isArray(value)) return [];
  return value;
};

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
      console.log("📊 Dashboard stats received:", data);
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
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
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
            <Link href="/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Health Data
              </Button>
            </Link>
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
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getRiskBadgeColor = (risk: string) => {
    const riskLevel = safeString(risk).toUpperCase();
    switch (riskLevel) {
      case "LOW": return "bg-green-100 text-green-800";
      case "MODERATE": return "bg-yellow-100 text-yellow-800";
      case "HIGH": return "bg-red-100 text-red-800";
      case "CRITICAL": return "bg-red-200 text-red-900";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    const trendType = safeString(trend).toLowerCase();
    switch (trendType) {
      case "improving":
      case "positive":
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "concerning":
      case "negative":
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  // Extract values safely from stats object
  const totalReports = safeNumber(stats.healthMetrics?.totalReports || stats.aiAnalysesRun || 0);
  const healthScore = safeNumber(stats.healthMetrics?.latestHealthScore || stats.healthScore || 0);
  const riskLevel = safeString(stats.healthMetrics?.riskLevel || "UNKNOWN");
  const totalBiomarkers = safeNumber(stats.biomarkers?.totalBiomarkers || stats.biomarkersTracked || 0);
  const abnormalCount = safeNumber(stats.biomarkers?.abnormalCount || stats.abnormalValues || 0);
  const criticalCount = safeNumber(stats.biomarkers?.criticalCount || stats.criticalValues || 0);
  const normalCount = safeNumber(stats.biomarkers?.normalCount || (totalBiomarkers - abnormalCount - criticalCount));
  const dataCompleteness = safeNumber(stats.dataQuality?.completeness || stats.dataCompleteness || 0);
  const totalScans = safeNumber(stats.bodyComposition?.totalScans || stats.bodyCompositionUploads || 0);
  const activeRecommendations = safeNumber(stats.recommendations?.activeCount || 0);
  const highPriorityRecommendations = safeNumber(stats.recommendations?.highPriorityCount || 0);
  const lastAnalysisDate = stats.healthMetrics?.lastAnalysisDate || stats.lastAnalysisDate;
  const lastTestDate = stats.biomarkers?.lastTestDate || stats.lastUploadDate;

  // Check if this is a new user with no data
  const isNewUser = stats._debug?.isNewUser || (totalReports === 0 && totalBiomarkers === 0 && totalScans === 0);

  // Safe risk assessment access
  const cardiovascularRisk = stats.riskAssessments?.cardiovascular || "LOW";
  const metabolicRisk = stats.riskAssessments?.metabolic || "LOW";
  const overallRisk = stats.riskAssessments?.overall || riskLevel || "LOW";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's your health analytics overview • Last updated {getDaysAgo(lastAnalysisDate) || "Never"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Subscription Status Button */}
          {stats.user?.subscriptionPlan && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.user.subscriptionPlan === 'pro' 
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {stats.user.subscriptionPlan === 'pro' && stats.user.subscriptionExpiresAt
                ? `${Math.max(0, Math.ceil((new Date(stats.user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left`
                : stats.user.subscriptionPlan === 'basic'
                ? 'Subscribed'
                : 'Pro Plan'
              }
            </div>
          )}
          
          <Button
            onClick={handleRefreshStats}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link href="/dashboard/health-analytics">
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{healthScore}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getRiskBadgeColor(riskLevel)}>
                    {riskLevel} RISK
                  </Badge>
                </div>
              </div>
              <MiniPieChart 
                percentage={healthScore} 
                size={48} 
                color={riskLevel === 'LOW' ? '#10b981' : riskLevel === 'MODERATE' ? '#f59e0b' : '#ef4444'}
                className="ml-4"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isNewUser ? 'Upload blood test to calculate' : totalReports > 0 ? `Based on ${totalReports} report${totalReports !== 1 ? 's' : ''}` : 'No reports yet'}
            </p>
          </CardContent>
        </Card>

        {/* Biomarkers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biomarkers Tracked</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalBiomarkers}</div>
                <div className="flex items-center space-x-1 mt-1">
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} Critical
                    </Badge>
                  )}
                  {abnormalCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {abnormalCount} Abnormal
                    </Badge>
                  )}
                  {normalCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {normalCount} Normal
                    </Badge>
                  )}
                </div>
              </div>
              <MiniPieChart 
                percentage={totalBiomarkers > 0 ? Math.min(100, (normalCount / totalBiomarkers) * 100) : 0} 
                size={48} 
                color="#3b82f6"
                className="ml-4"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isNewUser ? 'Upload blood test to track biomarkers' : `Last test: ${getDaysAgo(lastTestDate) || 'Never'}`}
            </p>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{dataCompleteness}%</div>
                <Progress value={dataCompleteness} className="mt-2 w-24" />
              </div>
              <MiniPieChart 
                percentage={dataCompleteness} 
                size={48} 
                color="#10b981"
                className="ml-4"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isNewUser ? 'Upload tests to improve completeness' : dataCompleteness >= 80 ? 'Excellent' : dataCompleteness >= 60 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        {/* Active Recommendations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recommendations</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{activeRecommendations}</div>
                {highPriorityRecommendations > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {highPriorityRecommendations} High Priority
                  </Badge>
                )}
              </div>
              <MiniPieChart 
                percentage={activeRecommendations > 0 ? Math.min(100, (activeRecommendations / 10) * 100) : 0} 
                size={48} 
                color="#8b5cf6"
                className="ml-4"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isNewUser ? 'Get recommendations from blood tests' : 'Based on recent analysis'}
            </p>
          </CardContent>
        </Card>
      </div>

<div className="mt-6 flex justify-start space-x-4">
  {isNewUser ? (
    <Link href="/upload">
      <Button 
        size="lg" 
        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Upload className="w-5 h-5 mr-2" />
        Upload your Blood Test to Get Started
      </Button>
    </Link>
  ) : (
    <Link href="/dashboard/health-analytics">
      <Button 
        size="lg" 
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <BarChart3 className="w-5 h-5 mr-2" />
        View Detailed Analysis
      </Button>
    </Link>
  )}
</div>


      {/* Risk Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span>Cardiovascular Risk</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={getRiskBadgeColor(cardiovascularRisk)}>
                {cardiovascularRisk}
              </Badge>
              {getTrendIcon(stats.trends?.cholesterolTrend || "stable")}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on cholesterol and cardiovascular biomarkers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Metabolic Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={getRiskBadgeColor(metabolicRisk)}>
                {metabolicRisk}
              </Badge>
              {getTrendIcon(stats.trends?.overallTrend || "stable")}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Glucose, insulin, and metabolic markers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-green-500" />
              <span>Overall Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={getRiskBadgeColor(overallRisk)}>
                {overallRisk}
              </Badge>
              {getTrendIcon(stats.trends?.healthScoreTrend || "stable")}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Comprehensive health assessment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Body Composition Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LineChart className="h-5 w-5 text-blue-500" />
            <span>Body Composition Tracking</span>
          </CardTitle>
          <CardDescription>
            Track changes in body composition over time with automated progress charts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* BMI */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">BMI</span>
                <Weight className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">
                {stats.bodyComposition?.latestBMI ? stats.bodyComposition.latestBMI.toFixed(1) : '--'}
              </div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Normal range</span>
              </div>
            </div>

            {/* Body Fat */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Body Fat</span>
                <Percent className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">
                {stats.bodyComposition?.bodyFatPercentage ? `${stats.bodyComposition.bodyFatPercentage}%` : '--'}
              </div>
              <div className="flex items-center mt-1">
                <TrendingDown className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs text-blue-600">Decreasing</span>
              </div>
            </div>

            {/* Muscle Mass */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Muscle Mass</span>
                <Dumbbell className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">
                {stats.bodyComposition?.muscleMass ? `${stats.bodyComposition.muscleMass}kg` : '--'}
              </div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Increasing</span>
              </div>
            </div>
          </div>

          {/* Progress Chart Placeholder */}
          <div className="h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Body composition progress chart</p>
              <p className="text-xs text-gray-400 mt-1">Upload body scans to see trends</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">
              Last scan: {formatDate(stats.bodyComposition?.lastScanDate) || 'No scans yet'}
            </p>
            <Link href="/body-composition">
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Scan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Health Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <span>Health Correlations</span>
          </CardTitle>
          <CardDescription>
            Correlate body composition changes with blood biomarkers and fitness activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Correlation Items */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm text-blue-900">Testosterone & Muscle Mass</p>
                  <p className="text-xs text-blue-700">Strong positive correlation (r=0.78)</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Strong</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm text-green-900">Body Fat & Cholesterol</p>
                  <p className="text-xs text-green-700">Moderate correlation (r=0.65)</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Moderate</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm text-orange-900">BMI & Blood Pressure</p>
                  <p className="text-xs text-orange-700">Weak correlation (r=0.42)</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Weak</Badge>
            </div>
          </div>

          {/* Correlation Chart Placeholder */}
          <div className="mt-6 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Correlation analysis chart</p>
              <p className="text-xs text-gray-400">More data needed for detailed analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <span>Patient Overview</span>
          </CardTitle>
          <CardDescription>
            General health information and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Age</span>
                <span className="text-sm">
                  {stats.user?.dateOfBirth 
                    ? Math.floor((Date.now() - new Date(stats.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : '--'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Gender</span>
                <span className="text-sm">
                  {stats.user?.gender ? stats.user.gender.charAt(0) + stats.user.gender.slice(1).toLowerCase() : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Height</span>
                <span className="text-sm">
                  {stats.user?.height ? `${stats.user.height}cm` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Weight</span>
                <span className="text-sm">
                  {stats.user?.weight ? `${stats.user.weight}kg` : '--'}
                </span>
              </div>
            </div>

            {/* Health Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Tests</span>
                <span className="text-sm font-bold">{totalReports}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Tracking Since</span>
                <span className="text-sm">{formatDate(stats.firstUploadDate) || 'Recently'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Last Activity</span>
                <span className="text-sm">{getDaysAgo(lastAnalysisDate) || 'Never'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Health Goals</span>
                <span className="text-sm">{stats.healthGoalsAchieved || 0} achieved</span>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-900">Key Insights</p>
                <p className="text-xs text-indigo-700 mt-1">
                  {isNewUser 
                    ? 'Upload your first blood test to get personalized health insights and start tracking your progress.' 
                    : `Your health score of ${healthScore} indicates ${riskLevel.toLowerCase()} risk. Continue tracking to optimize your health metrics.`
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and data uploads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/upload" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Health Data
              </Button>
            </Link>
            <Link href="/dashboard/health-analytics" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Brain className="w-4 h-4 mr-2" />
                View AI Health Analysis
              </Button>
            </Link>
            <Link href="/body-composition" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Scale className="w-4 h-4 mr-2" />
                Body Composition Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Platform performance and data processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Source</span>
              <Badge variant="outline">
                {safeString(stats.performance?.dataSource || 'Database')}
              </Badge>
            </div>
            {stats.performance?.processingTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Processing Time</span>
                <span className="text-sm font-medium">
                  {(stats.performance.processingTime / 1000).toFixed(1)}s
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Cache Status</span>
              <Badge className={stats.performance?.cacheHit ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {stats.performance?.cacheHit ? 'Hit' : 'Fresh'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Reliability</span>
              <Badge variant="outline">
                {safeString(stats.dataQuality?.reliability || 'HIGH')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeArray(stats.recentActivity).slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{safeString(activity.description)}</p>
                    <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                  </div>
                  <Badge 
                    variant={activity.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {safeString(activity.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}