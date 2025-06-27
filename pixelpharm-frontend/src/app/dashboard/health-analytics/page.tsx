"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
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
import {
  Loader2,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface HealthInsights {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  keyFindings: string[];
  recommendations: Array<{
    category: string;
    priority: string;
    recommendation: string;
    reasoning: string;
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    concern: string;
    urgency: string;
  }>;
  trends: Array<{
    biomarker: string;
    trend: string;
    timeframe: string;
  }>;
  summary: string;
}

export default function HealthAnalyticsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const fetchHealthInsights = async (forceRefresh = false) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/health/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId, // Use real user ID
          forceRefresh,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setInsights(data.insights);
        setLastAnalyzed(data.analyzedAt);
        setCached(data.cached);
      } else {
        console.error("Error fetching insights:", data.error);
      }
    } catch (error) {
      console.error("Error fetching health insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const runNewAnalysis = async () => {
    setAnalyzing(true);
    await fetchHealthInsights(true);
    setAnalyzing(false);
  };

  useEffect(() => {
    fetchHealthInsights();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyzing your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Health Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights from your health data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runNewAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {analyzing ? "Analyzing..." : "New Analysis"}
          </Button>
          {lastAnalyzed && (
            <p className="text-sm text-muted-foreground flex items-center">
              {cached ? "Cached analysis from " : "Last analyzed: "}
              {new Date(lastAnalyzed).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {insights && (
        <>
          {/* Health Score and Risk Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-center">
                  {insights.healthScore}/100
                </div>
                <div className="text-center text-muted-foreground mt-2">
                  Based on your latest biomarkers
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge className={getRiskColor(insights.riskLevel)}>
                    {insights.riskLevel} RISK
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Findings */}
          <Card>
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
              <CardDescription>
                Important insights from your biomarker analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Abnormal Values Alert */}
          {insights.abnormalValues.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Attention Required</div>
                <div className="space-y-2">
                  {insights.abnormalValues.map((abnormal, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{abnormal.biomarker}</span>:{" "}
                      {abnormal.concern}
                      <Badge
                        className={`ml-2 ${
                          abnormal.urgency === "immediate"
                            ? "bg-red-100 text-red-800"
                            : abnormal.urgency === "moderate"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {abnormal.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                AI-generated suggestions based on your health data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{rec.category}</Badge>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <div className="font-medium mb-1">{rec.recommendation}</div>
                    <div className="text-sm text-muted-foreground">
                      {rec.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.summary}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
