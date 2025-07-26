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
            <p className="text-xs text-gray-500 mb-2">
              Additional Metrics Available
            </p>
            <div className="flex gap-1 flex-wrap">
              {Object.keys(bodyData.rawData.bodyComposition)
                .slice(0, 6)
                .map((key) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Badge>
                ))}
              {Object.keys(bodyData.rawData.bodyComposition).length > 6 && (
                <Badge variant="secondary" className="text-xs">
                  +{Object.keys(bodyData.rawData.bodyComposition).length - 6}{" "}
                  more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && bodyData && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-400 mb-1">Debug Info:</p>
            <pre className="text-xs text-gray-400 bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(bodyData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
