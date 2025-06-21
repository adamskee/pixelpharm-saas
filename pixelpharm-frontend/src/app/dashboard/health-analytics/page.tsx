"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Zap,
  Target,
  Calendar,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";

// Types for our health data
interface BiomarkerValue {
  biomarkerName: string;
  value: number;
  unit: string;
  testDate: string;
  referenceRange?: string;
  isAbnormal: boolean;
}

interface HealthSummary {
  totalUploads: number;
  totalBloodTests: number;
  totalBiomarkers: number;
}

interface DashboardData {
  trends: Record<string, BiomarkerValue[]>;
  summary: HealthSummary;
  totalDataPoints: number;
}

export default function HealthAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState("12"); // months

  // TODO: Get real user ID from auth context
  const userId = "cmc64o5u70000w1dsmzexzi88";

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/health/biomarkers?userId=${userId}&months=${selectedTimeRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data.data);

      // Calculate health score
      const score = calculateHealthScore(data.data.trends);
      setHealthScore(score);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate health score based on biomarker data
  const calculateHealthScore = (trends: Record<string, BiomarkerValue[]>) => {
    if (!trends || Object.keys(trends).length === 0) return 0;

    let totalScore = 0;
    let scoredBiomarkers = 0;

    // Define optimal ranges and weights for key biomarkers
    const biomarkerCriteria = {
      "Total Cholesterol": { optimal: [0, 200], weight: 15 },
      "HDL Cholesterol": { optimal: [40, 100], weight: 12 },
      "LDL Cholesterol": { optimal: [0, 100], weight: 12 },
      Triglycerides: { optimal: [0, 150], weight: 10 },
      Glucose: { optimal: [70, 100], weight: 15 },
      "Hemoglobin A1C": { optimal: [0, 5.6], weight: 15 },
      Hemoglobin: { optimal: [12, 18], weight: 8 },
      "White Blood Cells": { optimal: [4, 11], weight: 6 },
      Creatinine: { optimal: [0.6, 1.3], weight: 7 },
    };

    Object.entries(trends).forEach(([biomarkerName, values]) => {
      const criteria =
        biomarkerCriteria[biomarkerName as keyof typeof biomarkerCriteria];
      if (criteria && values.length > 0) {
        const latestValue = values[values.length - 1];
        const [min, max] = criteria.optimal;

        let biomarkerScore = 0;
        if (latestValue.value >= min && latestValue.value <= max) {
          biomarkerScore = 100; // Perfect score for optimal range
        } else {
          // Partial score based on how far from optimal
          const distance = Math.min(
            Math.abs(latestValue.value - min),
            Math.abs(latestValue.value - max)
          );
          biomarkerScore = Math.max(0, 100 - distance * 10);
        }

        totalScore += biomarkerScore * criteria.weight;
        scoredBiomarkers += criteria.weight;
      }
    });

    // Add bonus points for data completeness and recent testing
    const dataCompletenessBonus = Math.min(10, Object.keys(trends).length * 2);
    const recentTestingBonus = hasRecentTest(trends) ? 5 : 0;

    const finalScore =
      scoredBiomarkers > 0
        ? totalScore / scoredBiomarkers +
          dataCompletenessBonus +
          recentTestingBonus
        : 0;

    return Math.min(100, Math.round(finalScore));
  };

  // Check if user has recent test (within 90 days)
  const hasRecentTest = (trends: Record<string, BiomarkerValue[]>) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return Object.values(trends).some((values) =>
      values.some((value) => new Date(value.testDate) > threeMonthsAgo)
    );
  };

  // Get key biomarkers with latest values
  const getKeyBiomarkers = () => {
    if (!dashboardData?.trends) return [];

    const keyBiomarkerNames = [
      "Total Cholesterol",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "Glucose",
      "Hemoglobin A1C",
    ];

    return keyBiomarkerNames
      .map((name) => {
        const values = dashboardData.trends[name];
        if (values && values.length > 0) {
          const latest = values[values.length - 1];
          const previous = values.length > 1 ? values[values.length - 2] : null;

          // Calculate trend
          let trend: "up" | "down" | "stable" = "stable";
          let trendPercent = 0;

          if (previous) {
            const change = latest.value - previous.value;
            trendPercent = Math.round((change / previous.value) * 100);
            if (Math.abs(trendPercent) > 5) {
              trend = change > 0 ? "up" : "down";
            }
          }

          return {
            name,
            value: latest.value,
            unit: latest.unit,
            date: latest.testDate,
            trend,
            trendPercent: Math.abs(trendPercent),
            isAbnormal: latest.isAbnormal,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // Get health score color and text
  const getHealthScoreDisplay = () => {
    if (healthScore >= 80) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        text: "Excellent",
        description: "Your health metrics are in great shape!",
      };
    } else if (healthScore >= 60) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        text: "Good",
        description: "Most metrics are healthy with room for improvement.",
      };
    } else if (healthScore >= 40) {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        text: "Fair",
        description: "Several metrics need attention.",
      };
    } else {
      return {
        color: "text-red-600",
        bgColor: "bg-red-100",
        text: "Needs Attention",
        description: "Important health metrics require immediate focus.",
      };
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid gap-6">
          {/* Loading skeleton */}
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const keyBiomarkers = getKeyBiomarkers();
  const healthScoreDisplay = getHealthScoreDisplay();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Health Analytics
          </h1>
          <p className="text-slate-600 mt-1">
            Your comprehensive health insights and biomarker trends
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 2 years</option>
          </select>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            RefreshCw
          </Button>
        </div>
      </div>

      {/* Health Score Card */}
      <Card className={`${healthScoreDisplay.bgColor} border-0`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Overall Health Score
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-slate-900">
                  {healthScore}
                </div>
                <div className="flex-1">
                  <Progress value={healthScore} className="h-3" />
                  <div
                    className={`text-sm font-medium mt-1 ${healthScoreDisplay.color}`}
                  >
                    {healthScoreDisplay.text}
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm mt-2">
                {healthScoreDisplay.description}
              </p>
            </div>
            <Heart className={`h-12 w-12 ${healthScoreDisplay.color}`} />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Uploads
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {dashboardData?.summary?.totalUploads || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Blood Tests
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {dashboardData?.summary.totalBloodTests || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Biomarkers Tracked
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {Object.keys(dashboardData?.trends || {}).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Data Points
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {dashboardData?.totalDataPoints || 0}
                </p>
              </div>
              <Zap className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Biomarkers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Key Biomarkers
          </CardTitle>
          <CardDescription>
            Latest values for your most important health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keyBiomarkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keyBiomarkers.map((biomarker, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">
                      {biomarker.name}
                    </h4>
                    {biomarker.trend === "up" && (
                      <div className="flex items-center text-red-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {biomarker.trendPercent}%
                        </span>
                      </div>
                    )}
                    {biomarker.trend === "down" && (
                      <div className="flex items-center text-green-600">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {biomarker.trendPercent}%
                        </span>
                      </div>
                    )}
                    {biomarker.trend === "stable" && (
                      <div className="flex items-center text-slate-400">
                        <Minus className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      {biomarker.value} {biomarker.unit}
                    </span>
                    {biomarker.isAbnormal && (
                      <Badge variant="destructive" className="text-xs">
                        Outside Range
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Last tested: {new Date(biomarker.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No biomarker data available</p>
              <p className="text-sm">
                Upload a blood test to see your health metrics
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">View Trends</h3>
            <p className="text-sm text-slate-600">
              Detailed biomarker trends and correlations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Export Report</h3>
            <p className="text-sm text-slate-600">
              Download comprehensive health report
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Schedule Test</h3>
            <p className="text-sm text-slate-600">
              Set reminders for next blood work
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
