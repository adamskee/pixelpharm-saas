"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface EnhancedDashboardProps {
  userId?: string;
}

interface HealthInsights {
  healthScore: number;
  riskLevel: string;
  keyFindings: string[];
  recommendations: any[];
  abnormalValues: any[];
  trends: any[];
  summary: string;
  confidence: number;
  lastAnalysisDate: Date;
  processingTime?: number;
  cacheHit?: boolean;
  modelVersion?: string;
}

interface MedicalReview {
  overview: {
    overallHealth: {
      score: number;
      grade: string;
      status: string;
      trend: string;
    };
    riskProfile: {
      level: string;
      primaryRisks: string[];
      timeToAction: string;
    };
    dataQuality: {
      completeness: number;
      recency: number;
      reliability: number;
    };
  };
  clinicalFindings: {
    critical: any[];
    abnormal: any[];
    borderline: any[];
    normal: any[];
  };
  systemReviews: any;
  recommendations: {
    immediate: any[];
    shortTerm: any[];
    longTerm: any[];
    lifestyle: any[];
    monitoring: any[];
  };
  trends: any;
  visualizations: any;
  metadata: {
    generatedAt: Date;
    analysisVersion: string;
    dataPoints: number;
    confidenceScore: number;
    nextReviewDate: Date;
  };
  performance?: {
    processingTime: number;
    dataPoints: number;
    hasBodyComposition: boolean;
    generatedAt: string;
    usingMockData?: boolean;
  };
}

export default function EnhancedHealthAnalyticsDashboard({
  userId = "demo-user",
}: EnhancedDashboardProps) {
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [medicalReview, setMedicalReview] = useState<MedicalReview | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadHealthData();
  }, [userId]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both AI insights and enhanced medical review
      const [insightsRes, reviewRes] = await Promise.all([
        fetch(`/api/health/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, forceRefresh: false }),
        }),
        fetch(`/api/health/enhanced-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      ]);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
        setLastAnalyzed(insightsData.lastAnalysisDate);
      }

      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setMedicalReview(reviewData);
      } else {
        // If medical review fails, try to get insights only
        console.log("Medical review failed, using insights only");
      }
    } catch (err) {
      console.error("Error loading health data:", err);
      setError("Failed to load health analytics");
    } finally {
      setLoading(false);
    }
  };

  const runNewAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const response = await fetch("/api/health/enhanced-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          forceRefresh: true,
          priority: "urgent",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMedicalReview(data);
        setLastAnalyzed(new Date().toISOString());

        // Also refresh regular insights
        await loadHealthData();
      }
    } catch (err) {
      console.error("Error running analysis:", err);
      setError("Failed to run new analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      LOW: "bg-green-100 text-green-800 border-green-200",
      MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      CRITICAL: "bg-red-100 text-red-800 border-red-200",
      UNKNOWN: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[riskLevel as keyof typeof colors] || colors.UNKNOWN;
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      A: "text-green-600",
      B: "text-blue-600",
      C: "text-yellow-600",
      D: "text-orange-600",
      F: "text-red-600",
    };
    return colors[grade as keyof typeof colors] || "text-gray-600";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "moderate":
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading enhanced health analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error && !medicalReview) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadHealthData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Health Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered comprehensive health assessment with advanced medical
            review
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={runNewAnalysis}
            disabled={analyzing}
            variant="outline"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {analyzing ? "Analyzing..." : "New Analysis"}
          </Button>
          {lastAnalyzed && (
            <p className="text-sm text-muted-foreground">
              Last analyzed: {new Date(lastAnalyzed).toLocaleString()}
              {insights?.cacheHit && " (cached)"}
            </p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {(insights?.processingTime ||
        medicalReview?.performance?.processingTime) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span>Analysis Performance:</span>
              <div className="flex items-center gap-4">
                <span>
                  Processing Time:{" "}
                  {medicalReview?.performance?.processingTime ||
                    insights?.processingTime}
                  ms
                </span>
                <span>Model: {insights?.modelVersion || "Claude 3 Haiku"}</span>
                <span>
                  Confidence:{" "}
                  {(
                    (insights?.confidence ||
                      medicalReview?.metadata?.confidenceScore ||
                      0.85) * 100
                  ).toFixed(1)}
                  %
                </span>
                {medicalReview?.performance?.usingMockData && (
                  <span className="text-blue-600">Using Demo Data</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {medicalReview && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold ${getGradeColor(
                          medicalReview.overview.overallHealth.grade
                        )}`}
                      >
                        {medicalReview.overview.overallHealth.score}
                        <span className="text-lg ml-2">
                          ({medicalReview.overview.overallHealth.grade})
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {medicalReview.overview.overallHealth.status}
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        {medicalReview.overview.overallHealth.trend ===
                        "improving" ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : medicalReview.overview.overallHealth.trend ===
                          "declining" ? (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500 mr-1" />
                        )}
                        <span className="text-sm capitalize">
                          {medicalReview.overview.overallHealth.trend}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Risk Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge
                        className={getRiskColor(
                          medicalReview.overview.riskProfile.level
                        )}
                      >
                        {medicalReview.overview.riskProfile.level} RISK
                      </Badge>
                      <div className="mt-4 space-y-2">
                        {medicalReview.overview.riskProfile.primaryRisks.map(
                          (risk, index) => (
                            <div
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              {risk}
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Action needed:{" "}
                          {medicalReview.overview.riskProfile.timeToAction.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Quality */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Data Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completeness</span>
                          <span>
                            {medicalReview.overview.dataQuality.completeness}%
                          </span>
                        </div>
                        <Progress
                          value={
                            medicalReview.overview.dataQuality.completeness
                          }
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Recency</span>
                          <span>
                            {medicalReview.overview.dataQuality.recency}%
                          </span>
                        </div>
                        <Progress
                          value={medicalReview.overview.dataQuality.recency}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Reliability</span>
                          <span>
                            {medicalReview.overview.dataQuality.reliability}%
                          </span>
                        </div>
                        <Progress
                          value={medicalReview.overview.dataQuality.reliability}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Health Score Chart */}
              {medicalReview.visualizations?.healthScoreHistory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Health Score Trend</CardTitle>
                    <CardDescription>
                      Your health score progression over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={
                          medicalReview.visualizations.healthScoreHistory.data
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Clinical Findings Tab */}
        <TabsContent value="clinical" className="space-y-6">
          {medicalReview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Abnormal Findings */}
              {medicalReview.clinicalFindings.abnormal.length > 0 && (
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      Abnormal Findings
                    </CardTitle>
                    <CardDescription>
                      Outside normal range, need attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {medicalReview.clinicalFindings.abnormal.map(
                        (finding, index) => (
                          <div
                            key={index}
                            className="border border-orange-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                {finding.biomarker}
                              </span>
                              <Badge variant="secondary">
                                {finding.clinicalSignificance}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>
                                Value: {finding.value} {finding.unit}
                              </div>
                              <div>Reference: {finding.referenceRange}</div>
                              <div className="mt-1">
                                {finding.interpretation}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Normal Findings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Normal Findings
                  </CardTitle>
                  <CardDescription>
                    Biomarkers within healthy ranges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-green-600">
                      {medicalReview.clinicalFindings.normal.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Biomarkers in normal range
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {medicalReview.clinicalFindings.normal
                        .slice(0, 3)
                        .map((f) => f.biomarker)
                        .join(", ")}
                      {medicalReview.clinicalFindings.normal.length > 3 &&
                        ` and ${
                          medicalReview.clinicalFindings.normal.length - 3
                        } more`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* System Reviews Tab */}
        <TabsContent value="systems" className="space-y-6">
          {medicalReview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(medicalReview.systemReviews).map(
                ([system, review]: [string, any]) => (
                  <Card key={system}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{system} System</span>
                        <Badge
                          variant={
                            review.overallStatus === "optimal"
                              ? "default"
                              : review.overallStatus === "good"
                              ? "secondary"
                              : review.overallStatus === "concerning"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {review.overallStatus}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">
                            Key Markers
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            {review.keyMarkers.slice(0, 3).join(", ")}
                            {review.keyMarkers.length > 3 &&
                              ` +${review.keyMarkers.length - 3} more`}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-1">Findings</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {review.findings
                              .slice(0, 2)
                              .map((finding: string, index: number) => (
                                <li key={index}>• {finding}</li>
                              ))}
                          </ul>
                        </div>

                        {review.risks.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-1 text-orange-600">
                              Potential Risks
                            </h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {review.risks
                                .slice(0, 2)
                                .map((risk: string, index: number) => (
                                  <li key={index}>• {risk}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {medicalReview && (
            <div className="space-y-6">
              {/* Short Term Recommendations */}
              {medicalReview.recommendations.shortTerm.length > 0 && (
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <Clock className="h-5 w-5" />
                      Short Term Actions
                    </CardTitle>
                    <CardDescription>
                      Take action within 2-4 weeks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {medicalReview.recommendations.shortTerm.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="border border-orange-200 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              {getPriorityIcon(rec.priority)}
                              <div className="flex-1">
                                <div className="font-medium">{rec.action}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {rec.reasoning}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Timeframe: {rec.timeframe}</span>
                                  <span>Expected: {rec.expectedOutcome}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lifestyle Recommendations */}
              {medicalReview.recommendations.lifestyle.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Lifestyle Recommendations
                    </CardTitle>
                    <CardDescription>
                      Sustainable changes for long-term health
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medicalReview.recommendations.lifestyle.map(
                        (rec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.category}
                              </Badge>
                              {getPriorityIcon(rec.priority)}
                            </div>
                            <div className="font-medium text-sm">
                              {rec.action}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {rec.expectedOutcome}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monitoring Recommendations */}
              {medicalReview.recommendations.monitoring.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      Monitoring & Follow-up
                    </CardTitle>
                    <CardDescription>
                      Keep track of your progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {medicalReview.recommendations.monitoring.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {rec.action}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Every {rec.timeframe}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {medicalReview && (
            <div className="space-y-6">
              {/* Trend Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      Improving
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {medicalReview.trends.improving.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Biomarkers trending better
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Stable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {medicalReview.trends.stable.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Biomarkers maintaining levels
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <TrendingDown className="h-5 w-5" />
                      Concerning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {medicalReview.trends.concerning.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Biomarkers needing attention
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Trend Analysis */}
              {medicalReview.trends.concerning.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Concerning Trends</CardTitle>
                    <CardDescription>
                      Biomarkers that require attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {medicalReview.trends.concerning.map((trend, index) => (
                        <div
                          key={index}
                          className="border border-orange-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {trend.biomarker}
                            </span>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-orange-500" />
                              <Badge variant="outline">{trend.magnitude}</Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              Clinical relevance: {trend.clinicalRelevance}
                            </div>
                            <div>Projection: {trend.projectedOutcome}</div>
                            <div>
                              Confidence: {(trend.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {(insights || medicalReview) && (
            <div className="space-y-6">
              {/* AI Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Health Analysis Summary
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis from Claude 3 Haiku
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-sm leading-relaxed">
                      {insights?.summary ||
                        "AI-powered health analysis completed successfully with comprehensive medical review."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key AI Findings */}
              {insights?.keyFindings && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key AI Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insights.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* AI Recommendations */}
              {insights?.recommendations &&
                insights.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {insights.recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{rec.category}</Badge>
                              {getPriorityIcon(rec.priority)}
                            </div>
                            <div className="font-medium text-sm mb-1">
                              {rec.recommendation}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {rec.reasoning}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {medicalReview?.performance?.processingTime ||
                          insights?.processingTime ||
                          0}
                        ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Processing Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(
                          (insights?.confidence ||
                            medicalReview?.metadata?.confidenceScore ||
                            0.85) * 100
                        ).toFixed(0)}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Confidence
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {medicalReview?.performance?.dataPoints ||
                          insights?.metadata?.totalBiomarkers ||
                          6}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data Points
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {insights?.cacheHit ? "HIT" : "MISS"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cache Status
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer with Next Review Date */}
      {medicalReview && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span>
                  Analysis Version:{" "}
                  {medicalReview.metadata?.analysisVersion || "2.0.0"}
                </span>
                <span>
                  Data Points:{" "}
                  {medicalReview.metadata?.dataPoints ||
                    medicalReview.performance?.dataPoints}
                </span>
                <span>
                  Confidence:{" "}
                  {(
                    (medicalReview.metadata?.confidenceScore || 0.85) * 100
                  ).toFixed(1)}
                  %
                </span>
                {medicalReview.performance?.usingMockData && (
                  <Badge variant="outline" className="text-blue-600">
                    Demo Data
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Next Review:{" "}
                  {medicalReview.metadata?.nextReviewDate
                    ? new Date(
                        medicalReview.metadata.nextReviewDate
                      ).toLocaleDateString()
                    : "TBD"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
