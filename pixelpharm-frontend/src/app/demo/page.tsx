"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Heart,
  ExternalLink,
  Play,
  Maximize2,
  X,
} from "lucide-react";
import Image from "next/image";

export default function DemoPage() {
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const screenshots = [
    {
      id: 1,
      title: "Dashboard Overview",
      description:
        "Complete health analytics dashboard with health score, biomarkers, and risk assessment",
      filename: "jpeg_screen1.png",
    },
    {
      id: 2,
      title: "Biomarker Analysis",
      description:
        "Detailed biomarker tracking with trend analysis and normal ranges",
      filename: "biomarker_2.jpg",
    },
    {
      id: 3,
      title: "Health Insights",
      description:
        "AI-powered health insights and personalized recommendations",
      filename: "enhanced_screen_grab.jpg",
    },
    {
      id: 4,
      title: "Body Composition",
      description:
        "Body composition analysis with BMI, body fat, and muscle mass tracking",
      filename: "sqwef.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">PixelPharm Health</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signin">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Play className="h-4 w-4 mr-2" />
              Demo Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Experience Your Health Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how PixelPharm Health transforms your blood test results into
              actionable health insights with our comprehensive analytics
              dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Screenshots Grid */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {screenshots.map((screenshot) => (
              <Card
                key={screenshot.id}
                className="hover:shadow-xl transition-all duration-300 bg-white"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {screenshot.title}
                    </span>
                    <Maximize2 className="h-4 w-4 text-gray-400" />
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {screenshot.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage({
                      src: `/screenshots/${screenshot.filename}`,
                      title: screenshot.title
                    })}
                  >
                    <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={`/screenshots/${screenshot.filename}`}
                        alt={screenshot.title}
                        fill
                        className="object-cover object-top hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="p-3 bg-white rounded-full shadow-lg">
                            <Maximize2 className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Your Own Health Dashboard?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Upload your blood test results and get instant AI-powered health
            insights with personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Start Your Analysis
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                View Pricing
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You Get With PixelPharm Health
            </h2>
            <p className="text-lg text-gray-600">
              Professional-grade health analytics made accessible
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Comprehensive Analytics
              </h3>
              <p className="text-gray-600">
                Track 200+ biomarkers with trend analysis and risk assessment
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Health Score
              </h3>
              <p className="text-gray-600">
                Get an overall health score based on your biomarker profile
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personalized Insights
              </h3>
              <p className="text-gray-600">
                Receive tailored recommendations for optimal health
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">PixelPharm Health</span>
              </div>
              <p className="text-gray-300 max-w-md">
                Empowering individuals with professional-grade health analytics
                through advanced Multi Medical Model technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-300 hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-white"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-white"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-300 hover:text-white"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-300 hover:text-white"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-gray-300 hover:text-white"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 PixelPharm Health. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
            <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedImage.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
