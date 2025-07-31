"use client";

import { useAuth } from "@/lib/auth/auth-context";
import BodyCompositionUpload from "@/components/upload/body-composition-upload";
import { UploadLimitBanner } from "@/components/dashboard/UploadLimitBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";

export default function BodyCompositionPage() {
  const handleUploadComplete = (fileKey: string) => {
    console.log("Body composition scan uploaded:", fileKey);
    // TODO: Store file reference in database
    // TODO: Trigger AI analysis pipeline for body composition data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Body Composition Upload
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Limit Banner */}
        <UploadLimitBanner />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-6 w-6 mr-2" />
              Upload Body Composition Scans
            </CardTitle>
            <CardDescription>
              Upload your InBody 570, DEXA scan, or other body composition
              reports for AI-powered analysis and trend tracking. Supported
              formats: JPEG, PNG, TIFF, WebP (max 25MB each).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BodyCompositionUpload onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {/* Information Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What body composition data can you upload?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">
                    1
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">InBody 570 Scans</h4>
                  <p className="text-sm text-gray-600">
                    Professional bioelectrical impedance analysis with detailed
                    body composition metrics
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">
                    2
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">DEXA Scans</h4>
                  <p className="text-sm text-gray-600">
                    Dual-energy X-ray absorptiometry for precise body fat,
                    muscle mass, and bone density
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">
                    3
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">
                    Other Body Composition Reports
                  </h4>
                  <p className="text-sm text-gray-600">
                    Bod Pod, hydrostatic weighing, or other professional body
                    composition analyses
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What happens after upload?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">OCR Data Extraction</h4>
                  <p className="text-sm text-gray-600">
                    AI extracts key metrics like body fat %, muscle mass, BMR,
                    and segmental analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Trend Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Track changes in body composition over time with automated
                    progress charts
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Health Correlations</h4>
                  <p className="text-sm text-gray-600">
                    Correlate body composition changes with blood biomarkers and
                    fitness activities
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
