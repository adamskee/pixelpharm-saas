"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Brain,
  Activity,
  TrendingUp,
  Shield,
  Zap,
  Upload,
  BarChart3,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Clock,
  Target,
  Award,
} from "lucide-react";

export default function PixelPharmHomepage() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleGetStarted = () => {
    router.push("/dashboard");
  };

  const handleUploadResults = () => {
    router.push("/upload");
  };

  const healthGoals = [
    "Preventive Health",
    "Chronic Disease Management",
    "Athletic Performance",
    "Metabolic Health",
    "Cardiovascular Wellness",
    "Hormone Optimization",
    "Nutritional Analysis",
    "Longevity Planning",
  ];

  const biomarkers = [
    {
      name: "Total Cholesterol",
      value: "185",
      unit: "mg/dL",
      status: "optimal",
      color: "text-green-600",
    },
    {
      name: "HbA1c",
      value: "5.2",
      unit: "%",
      status: "excellent",
      color: "text-green-600",
    },
    {
      name: "LDL Cholesterol",
      value: "110",
      unit: "mg/dL",
      status: "borderline",
      color: "text-yellow-600",
    },
    {
      name: "HDL Cholesterol",
      value: "58",
      unit: "mg/dL",
      status: "good",
      color: "text-blue-600",
    },
    {
      name: "Triglycerides",
      value: "95",
      unit: "mg/dL",
      status: "optimal",
      color: "text-green-600",
    },
    {
      name: "Vitamin D",
      value: "42",
      unit: "ng/mL",
      status: "adequate",
      color: "text-blue-600",
    },
    {
      name: "TSH",
      value: "2.1",
      unit: "μIU/mL",
      status: "normal",
      color: "text-green-600",
    },
    {
      name: "C-Reactive Protein",
      value: "1.8",
      unit: "mg/L",
      status: "low risk",
      color: "text-green-600",
    },
  ];

  const features = [
    {
      icon: <Upload className="h-8 w-8 text-blue-600" />,
      title: "Smart Document Analysis",
      description:
        "Upload any blood test PDF or image. Our AI extracts and analyzes 50+ biomarkers instantly.",
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "AI-Powered Insights",
      description:
        "Advanced medical analysis using Claude 3 AI provides evidence-based recommendations tailored to you.",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Comprehensive Dashboard",
      description:
        "Track trends, monitor progress, and get actionable insights through our professional health interface.",
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Clinical-Grade Analysis",
      description:
        "Professional medical framework with confidence scoring and risk stratification.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Preventive Medicine Specialist",
      content:
        "PixelPharm's AI analysis rivals our clinical assessments. The depth of insights is remarkable.",
      rating: 5,
    },
    {
      name: "Michael Torres",
      role: "Wellness Coach",
      content:
        "My clients love seeing their biomarker trends. The recommendations are spot-on and actionable.",
      rating: 5,
    },
    {
      name: "Lisa Wang",
      role: "Health Enthusiast",
      content:
        "Finally, a platform that makes sense of my lab results. The AI insights helped me optimize my health routine.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                Reviews
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                Pricing
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Dashboard
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Zap className="h-4 w-4 mr-2" />
              AI-Powered Health Analytics
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="text-gray-900">Health Data Into</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Actionable Insights
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload any blood test and get instant AI-powered analysis with
              personalized recommendations. Professional-grade health insights
              made simple and accessible.
            </p>

            {/* Health Goals Selection */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                What are your primary health goals?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {healthGoals.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedGoal === goal
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="text-sm font-medium">{goal}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                onClick={handleUploadResults}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Lab Results
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4"
                onClick={() => router.push("/dashboard/health-analytics")}
              >
                <Play className="h-5 w-5 mr-2" />
                View Demo Dashboard
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Clinical Grade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biomarker Display */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Understanding Your Health Starts With Your Biomarkers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our AI analyzes 50+ key health indicators to provide comprehensive
              insights into your cardiovascular, metabolic, and overall
              wellness.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {biomarkers.map((marker, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {marker.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-2xl font-bold ${marker.color}`}>
                      {marker.value}
                    </span>
                    <span className="text-sm text-gray-500">{marker.unit}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${marker.color}`}
                  >
                    {marker.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Health Analytics, Simplified
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced AI technology meets clinical expertise to deliver
              insights that were previously only available to healthcare
              professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-0 bg-white"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="p-3 bg-gray-50 rounded-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How PixelPharm Works
            </h2>
            <p className="text-lg text-gray-600">
              Get professional health insights in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Upload Your Results
              </h3>
              <p className="text-gray-600">
                Simply upload any blood test PDF, image, or lab report. Our AI
                instantly extracts and processes your biomarker data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-gray-600">
                Advanced AI powered by Claude 3 analyzes your data using
                clinical-grade medical frameworks and evidence-based guidelines.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Insights</h3>
              <p className="text-gray-600">
                Receive personalized recommendations, risk assessments, and
                actionable insights through our comprehensive health dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Health, Visualized
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Professional-grade dashboard with comprehensive health analytics,
              trend tracking, and personalized recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold">Health Score</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  87/100
                </div>
                <p className="text-sm text-gray-600">
                  Excellent health profile with minor optimization opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold">Risk Assessment</h3>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  LOW RISK
                </div>
                <p className="text-sm text-gray-600">
                  Cardiovascular and metabolic markers within optimal ranges
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold">Next Actions</h3>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  3 Items
                </div>
                <p className="text-sm text-gray-600">
                  Personalized recommendations for continued health optimization
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push("/dashboard/health-analytics")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Explore Full Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Healthcare Professionals and Health Enthusiasts
            </h2>
            <p className="text-lg text-gray-600">
              See what users are saying about PixelPharm's health analytics
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-50 border-0">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Health Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of users who are taking control of their health with
            AI-powered insights. Upload your first lab report and discover what
            your biomarkers reveal about your health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
              onClick={handleUploadResults}
            >
              <Upload className="h-5 w-5 mr-2" />
              Start Your Analysis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
              onClick={() => router.push("/dashboard/health-analytics")}
            >
              View Demo Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold">PixelPharm</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Empowering individuals with professional-grade health analytics
                through advanced AI technology. Transform your lab results into
                actionable health insights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => router.push("/upload")}
                    className="hover:text-white transition"
                  >
                    Upload Results
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="hover:text-white transition"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/health-analytics")}
                    className="hover:text-white transition"
                  >
                    Analytics
                  </button>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 PixelPharm. All rights reserved. | HIPAA Compliant |
              Clinical-Grade Analytics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
