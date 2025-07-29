// File: src/components/dashboard/body-composition-summary.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, TrendingUp, TrendingDown, Minus, Upload } from "lucide-react";
import Link from "next/link";

interface BodyCompositionSummaryProps {
  userId: string;
}

export function BodyCompositionSummary({
  userId,
}: BodyCompositionSummaryProps) {
  const [bodyData, setBodyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBodyComposition() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        console.log(`📊 Fetching body composition for user: ${userId}`);
        const response = await fetch(
          `/api/health/body-composition?userId=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Body composition data received:", data);
          setBodyData(data.latest || data); // Use latest data from API response
        } else if (response.status === 404) {
          // No data found - this is normal for new users
          setBodyData(null);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        console.error("Failed to fetch body composition:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBodyComposition();
  }, [userId]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Scale className="h-5 w-5" />
            Body Composition Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!bodyData) {
    return (
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            Body Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <Scale className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              No body composition data available. Upload your first scan to
              track your progress.
            </p>
            <Button asChild>
              <Link href="/body-composition">
                <Upload className="h-4 w-4 mr-2" />
                Upload Body Composition Scan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-blue-600" />
          Latest Body Composition
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {bodyData.bodyFatPercentage && (
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {typeof bodyData.bodyFatPercentage === "number"
                  ? bodyData.bodyFatPercentage.toFixed(1)
                  : bodyData.bodyFatPercentage}
                %
              </div>
              <div className="text-sm text-gray-600">Body Fat</div>
            </div>
          )}

          {bodyData.skeletalMuscleMass && (
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {typeof bodyData.skeletalMuscleMass === "number"
                  ? bodyData.skeletalMuscleMass.toFixed(1)
                  : bodyData.skeletalMuscleMass}
                kg
              </div>
              <div className="text-sm text-gray-600">Muscle Mass</div>
            </div>
          )}

          {bodyData.totalWeight && (
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">
                {typeof bodyData.totalWeight === "number"
                  ? bodyData.totalWeight.toFixed(1)
                  : bodyData.totalWeight}
                kg
              </div>
              <div className="text-sm text-gray-600">Weight</div>
            </div>
          )}

          {bodyData.bmr && (
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">
                {bodyData.bmr}
              </div>
              <div className="text-sm text-gray-600">BMR (kcal)</div>
            </div>
          )}

          {bodyData.visceralFatLevel && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100 col-span-2">
              <div className="text-xl font-bold text-yellow-600">
                Level {bodyData.visceralFatLevel}
              </div>
              <div className="text-sm text-gray-600">Visceral Fat</div>
            </div>
          )}
        </div>

        {/* Test Date and Status */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>
            Last scan:{" "}
            {bodyData.testDate
              ? new Date(bodyData.testDate).toLocaleDateString()
              : bodyData.createdAt
              ? new Date(bodyData.createdAt).toLocaleDateString()
              : "Unknown date"}
          </span>
          <Badge variant="outline" className="text-xs">
            <Scale className="h-3 w-3 mr-1" />
            Body Scan
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/body-composition">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Scan
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/dashboard/health-analytics">View Trends</Link>
          </Button>
        </div>

        {/* Additional Metrics Display */}
        {bodyData.rawData?.bodyComposition && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Additional Body Composition Metrics
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(bodyData.rawData.bodyComposition)
                .filter(([key, value]) => {
                  // Filter out already displayed metrics and null/undefined values
                  const mainMetrics = ['bodyFatPercentage', 'skeletalMuscleMass', 'totalWeight', 'bmr', 'visceralFatLevel'];
                  return !mainMetrics.includes(key) && value !== null && value !== undefined && typeof value !== 'object';
                })
                .slice(0, 12) // Show up to 12 additional metrics
                .map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-lg font-semibold text-gray-700">
                      {typeof value === 'number' ? value.toFixed(1) : String(value)}
                      {key.toLowerCase().includes('percentage') || key.toLowerCase().includes('fat') ? '%' : 
                       key.toLowerCase().includes('weight') || key.toLowerCase().includes('mass') ? ' kg' :
                       key.toLowerCase().includes('bmr') ? ' kcal' : ''}
                    </div>
                    <div className="text-xs text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Nested Objects Display (muscle, fat, water, metabolic data) */}
            {bodyData.rawData?.bodyComposition && Object.entries(bodyData.rawData.bodyComposition)
              .filter(([key, value]) => typeof value === 'object' && value !== null)
              .map(([category, data]) => (
                <div key={category} className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()} Distribution
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(data as Record<string, any>).map(([subKey, subValue]) => (
                      <div key={subKey} className={`text-center p-2 rounded-lg border ${
                        category === 'muscle' ? 'bg-blue-50 border-blue-100' :
                        category === 'fat' ? 'bg-red-50 border-red-100' :
                        category === 'water' ? 'bg-cyan-50 border-cyan-100' :
                        category === 'metabolic' ? 'bg-green-50 border-green-100' :
                        'bg-gray-50 border-gray-100'
                      }`}>
                        <div className={`text-sm font-semibold ${
                          category === 'muscle' ? 'text-blue-700' :
                          category === 'fat' ? 'text-red-700' :
                          category === 'water' ? 'text-cyan-700' :
                          category === 'metabolic' ? 'text-green-700' :
                          'text-gray-700'
                        }`}>
                          {typeof subValue === 'number' ? subValue.toFixed(1) : String(subValue)}
                          {subKey.toLowerCase().includes('percentage') || subKey.toLowerCase().includes('fat') ? '%' : 
                           subKey.toLowerCase().includes('water') ? ' L' :
                           subKey.toLowerCase().includes('bmr') ? ' kcal' : ' kg'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {subKey.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
