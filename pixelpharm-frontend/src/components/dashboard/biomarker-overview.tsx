// File: src/components/dashboard/biomarker-overview.tsx

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
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Loader2,
  RefreshCw,
  Upload,
  BarChart3,
  Target,
} from "lucide-react";
import Link from "next/link";

interface BiomarkerData {
  valueId: string;
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  testDate: string;
}

interface BiomarkerOverviewProps {
  medicalReview: any;
  user: any;
}

export function BiomarkerOverviewSection({ medicalReview, user }: BiomarkerOverviewProps) {
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBiomarkerData = async () => {
    if (!user?.userId || medicalReview?.biomarkers?.totalBiomarkers === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔬 Fetching ALL biomarker data for user:", user.userId);

      // Fetch all biomarkers without limit
      const response = await fetch(`/api/user/biomarkers?userId=${user.userId}&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch biomarker data: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔬 Received all biomarker data:", data);

      if (data.biomarkers && Array.isArray(data.biomarkers)) {
        setBiomarkerData(data.biomarkers);
        console.log(`✅ Loaded ${data.biomarkers.length} biomarkers`);
      } else {
        console.log("⚠️ No biomarker array in response");
        setBiomarkerData([]);
      }
    } catch (err) {
      console.error("❌ Error fetching biomarker data:", err);
      setError(err instanceof Error ? err.message : "Failed to load biomarker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiomarkerData();
  }, [user?.userId, medicalReview?.biomarkers?.totalBiomarkers]);

  const getBiomarkerBadge = (isAbnormal: boolean) => {
    return isAbnormal ? (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Abnormal
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Normal
      </Badge>
    );
  };

  const formatValue = (value: number, unit: string) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // If no biomarker data exists in medical review, show upload prompt
  if (medicalReview?.biomarkers?.totalBiomarkers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Biomarker Overview</span>
          </CardTitle>
          <CardDescription>
            Detailed view of your biomarker data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Biomarker Data Available
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your blood test results to see detailed biomarker analysis and trends.
            </p>
            <Link href="/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Blood Test Results
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Biomarker Overview</span>
            </CardTitle>
            <CardDescription>
              Detailed view of your {medicalReview.biomarkers.totalBiomarkers} biomarker{medicalReview.biomarkers.totalBiomarkers !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchBiomarkerData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {medicalReview.biomarkers.totalBiomarkers}
            </div>
            <div className="text-sm text-gray-600">Total Biomarkers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {medicalReview.biomarkers.normalCount}
            </div>
            <div className="text-sm text-gray-600">Normal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {medicalReview.biomarkers.abnormalCount}
            </div>
            <div className="text-sm text-gray-600">Abnormal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {medicalReview.biomarkers.criticalCount}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                onClick={fetchBiomarkerData} 
                variant="outline" 
                size="sm" 
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Loading detailed biomarker data...</span>
          </div>
        ) : biomarkerData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">All Biomarker Results</h4>
              <Badge variant="outline" className="text-xs">
                Showing {biomarkerData.length} biomarkers
              </Badge>
            </div>
            
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {biomarkerData.map((biomarker) => (
                <div
                  key={biomarker.valueId}
                  className={`p-4 rounded-lg border ${
                    biomarker.isAbnormal 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="font-medium text-gray-900">
                          {biomarker.biomarkerName}
                        </h5>
                        {getBiomarkerBadge(biomarker.isAbnormal)}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-semibold">
                          Value: {formatValue(biomarker.value, biomarker.unit)}
                        </span>
                        {biomarker.referenceRange && (
                          <span>Reference: {biomarker.referenceRange}</span>
                        )}
                        <span>Date: {formatDate(biomarker.testDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {biomarker.isAbnormal ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {biomarkerData.length > 0 && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total: {biomarkerData.length} biomarker records loaded
                </p>
              </div>
            )}
          </div>
        ) : medicalReview.biomarkers.totalBiomarkers > 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">
              Biomarker summary available, but detailed data couldn't be loaded.
            </p>
            <Button onClick={fetchBiomarkerData} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Loading Details
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">No detailed biomarker data available.</p>
            <Link href="/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload More Data
              </Button>
            </Link>
          </div>
        )}

        {/* Last Test Date */}
        {medicalReview.biomarkers.lastTestDate && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <strong>Last Test Date:</strong> {formatDate(medicalReview.biomarkers.lastTestDate)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}