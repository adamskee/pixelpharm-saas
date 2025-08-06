// File: src/components/health/recovery-protocol.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Moon,
  Zap,
  Heart,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface RecoveryProtocolProps {
  userId: string;
}

interface RecoveryData {
  overallRecoveryScore: number;
  stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sleepRecommendation: string;
  exerciseRecommendation: string;
  nutritionProtocol: string[];
  supplementProtocol: string[];
  hrv_analysis: {
    estimated_hrv_status: string;
    recovery_indicators: string[];
  };
  inflammatory_analysis: {
    inflammation_level: string;
    recovery_timeline: string;
    risk_factors: string[];
  };
  actionable_steps: string[];
  monitoring_frequency: string;
  red_flags: string[];
}

export function RecoveryProtocol({ userId }: RecoveryProtocolProps) {
  const [loading, setLoading] = useState(false);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRecoveryProtocol = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/health/recovery-protocol?userId=${userId}&_timestamp=${Date.now()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No biomarker data available. Upload blood test results to generate recovery protocols.");
        }
        throw new Error("Failed to generate recovery protocol");
      }
      
      const data = await response.json();
      setRecoveryData(data.recoveryProtocol);
      setLastUpdated(data.generatedAt);
    } catch (err: any) {
      console.error("Recovery protocol error:", err);
      setError(err.message || "Failed to load recovery protocol");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecoveryProtocol();
    }
  }, [userId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case "LOW": return "bg-green-100 text-green-800";
      case "MODERATE": return "bg-yellow-100 text-yellow-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "CRITICAL": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Recovery Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Analyzing your biomarkers for personalized recovery protocol...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Recovery Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={fetchRecoveryProtocol} 
            variant="outline" 
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!recoveryData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Recovery Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Recovery Protocol Analysis</span>
            </CardTitle>
            <Button 
              onClick={fetchRecoveryProtocol} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Generated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recovery Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(recoveryData.overallRecoveryScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Recovery Score</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {recoveryData.overallRecoveryScore}/100
              </div>
              <Progress value={recoveryData.overallRecoveryScore} className="mb-2" />
              <p className="text-xs">
                {recoveryData.overallRecoveryScore >= 80 ? "Excellent recovery capacity" :
                 recoveryData.overallRecoveryScore >= 60 ? "Good recovery status" :
                 recoveryData.overallRecoveryScore >= 40 ? "Moderate recovery needs" :
                 "Critical recovery attention needed"}
              </p>
            </div>

            {/* Stress Level */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Stress Level</span>
                <Brain className="h-4 w-4 text-gray-500" />
              </div>
              <Badge className={`text-sm ${getStressLevelColor(recoveryData.stressLevel)}`}>
                {recoveryData.stressLevel}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Based on inflammatory markers and stress indicators
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HRV & Inflammatory Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HRV Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span>HRV Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Estimated HRV Status</h4>
                <p className="text-sm text-gray-600">
                  {recoveryData.hrv_analysis.estimated_hrv_status}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Recovery Indicators</h4>
                <ul className="space-y-1">
                  {recoveryData.hrv_analysis.recovery_indicators.map((indicator, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inflammatory Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Inflammatory Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Inflammation Level</span>
                <Badge className={
                  recoveryData.inflammatory_analysis.inflammation_level === "LOW" ? "bg-green-100 text-green-800" :
                  recoveryData.inflammatory_analysis.inflammation_level === "MODERATE" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }>
                  {recoveryData.inflammatory_analysis.inflammation_level}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Recovery Timeline</h4>
                <p className="text-sm text-gray-600">
                  {recoveryData.inflammatory_analysis.recovery_timeline}
                </p>
              </div>
              {recoveryData.inflammatory_analysis.risk_factors.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Risk Factors</h4>
                  <ul className="space-y-1">
                    {recoveryData.inflammatory_analysis.risk_factors.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep & Exercise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <span>Sleep & Training</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Sleep Recommendation</h4>
              <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                {recoveryData.sleepRecommendation}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Exercise Modification</h4>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                {recoveryData.exerciseRecommendation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition & Supplements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <span>Nutrition Protocol</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Nutrition Guidelines</h4>
              <ul className="space-y-1">
                {recoveryData.nutritionProtocol.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Supplement Protocol</h4>
              <ul className="space-y-1">
                {recoveryData.supplementProtocol.map((supplement, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <Zap className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{supplement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Steps & Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span>Action Plan & Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Actionable Steps</h4>
              <div className="space-y-2">
                {recoveryData.actionable_steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Monitoring Frequency</h4>
                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                  {recoveryData.monitoring_frequency}
                </p>
              </div>

              {recoveryData.red_flags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Warning Signs</span>
                  </h4>
                  <ul className="space-y-1">
                    {recoveryData.red_flags.map((flag, index) => (
                      <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        • {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}