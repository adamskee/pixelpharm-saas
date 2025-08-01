"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  Microscope,
  Stethoscope,
  FlaskConical,
  Beaker,
  Mail,
  Loader2,
} from "lucide-react";

export default function PixelPharmHomepage(): JSX.Element {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: "" });

  const handleGetStarted = () => {
    router.push("/auth/signin");
  };

  const handleUploadResults = () => {
    router.push("/auth/signin");
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setSubscriptionStatus({
        type: 'error',
        message: 'Please enter your email address'
      });
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus({ type: null, message: "" });

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionStatus({
          type: 'success',
          message: data.message || 'Successfully subscribed to newsletter!'
        });
        setNewsletterEmail("");
      } else {
        setSubscriptionStatus({
          type: 'error',
          message: data.error || 'Failed to subscribe. Please try again.'
        });
      }
    } catch (error) {
      setSubscriptionStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const healthGoals = [
    "Preventive Health",
    "Chronic Disease Management",
    "Athletic Performance",
    "Metabolic Health",
    "Cardiovascular Wellness",
    "Hormone Optimization",
  ];

  const biomarkers = [
    {
      name: "Total Cholesterol",
      value: "185",
      unit: "mg/dL",
      status: "optimal",
      color: "text-emerald-600",
    },
    {
      name: "HbA1c",
      value: "5.2",
      unit: "%",
      status: "excellent",
      color: "text-emerald-600",
    },
    {
      name: "LDL Cholesterol",
      value: "110",
      unit: "mg/dL",
      status: "borderline",
      color: "text-amber-600",
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
      color: "text-emerald-600",
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
      color: "text-emerald-600",
    },
    {
      name: "C-Reactive Protein",
      value: "1.8",
      unit: "mg/L",
      status: "low risk",
      color: "text-emerald-600",
    },
  ];

  const features = [
    {
      icon: <Upload className="h-7 w-7 text-blue-600" />,
      title: "Smart Document Analysis",
      description:
        "Upload any blood test image (JPG, PNG, GIF, WebP, TIFF). Our AI instantly extracts and processes 206+ biomarkers with clinical-grade accuracy.",
    },
    {
      icon: <Brain className="h-7 w-7 text-purple-600" />,
      title: "Multi Medical Model AI",
      description:
        "Advanced Multi-MLM analysis using our proprietary medical models trained on millions of clinical data points for personalized insights.",
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-emerald-600" />,
      title: "Professional Dashboard",
      description:
        "Track trends, monitor progress, and receive actionable recommendations through our comprehensive health analytics interface.",
    },
    {
      icon: <Shield className="h-7 w-7 text-rose-600" />,
      title: "Clinical-Grade Security",
      description:
        "HIPAA-compliant platform with bank-level encryption. Your health data is protected with the highest security standards.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Preventive Medicine Specialist",
      content:
        "PixelPharm's AI analysis rivals our clinical assessments. The depth and accuracy of insights is truly remarkable for a consumer platform.",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Michael Torres",
      role: "Wellness Coach",
      content:
        "My clients love seeing their biomarker trends visualized. The recommendations are evidence-based and incredibly actionable.",
      rating: 5,
      avatar: "MT",
    },
    {
      name: "Lisa Wang",
      role: "Health Enthusiast",
      content:
        "Finally, a platform that makes my lab results meaningful. The AI insights helped me optimize my nutrition and supplement routine.",
      rating: 5,
      avatar: "LW",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                PixelPharm Health
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/about"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/support"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Support
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Sign In
                </Button>
              </Link>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Full-Width Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Medical Icons Floating Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 text-white/10 animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            <Microscope className="h-12 w-12" />
          </div>
          <div
            className="absolute top-40 right-20 text-white/10 animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          >
            <Stethoscope className="h-16 w-16" />
          </div>
          <div
            className="absolute bottom-40 left-20 text-white/10 animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "3.5s" }}
          >
            <FlaskConical className="h-10 w-10" />
          </div>
          <div
            className="absolute bottom-20 right-10 text-white/10 animate-bounce"
            style={{ animationDelay: "0.5s", animationDuration: "4.5s" }}
          >
            <Beaker className="h-14 w-14" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Badge className="mb-6 bg-blue-500/20 text-blue-200 border-blue-400/30 backdrop-blur-sm">
              <Zap className="h-4 w-4 mr-2" />
              Multi-MLM AI • Clinical-Grade Analytics
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight mt-16">
            <span className="text-white block mb-2">Transform Your</span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block mb-2">
              Health Data
            </span>
            <span className="text-white block">Into Insights</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Upload any blood test and receive instant analysis with personalized
            recommendations. Professional-grade health insights made accessible
            to everyone.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              size="lg"
              onClick={handleUploadResults}
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-4 shadow-2xl font-semibold"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Lab Results
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/demo")}
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 backdrop-blur-sm"
            >
              <Play className="h-5 w-5 mr-2" />
              View Demo Dashboard
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-300">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="font-medium">1000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              <span className="font-medium">Clinical Grade</span>
            </div>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mt-16 max-w-5xl mx-auto mb-16">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Image
                src="/screenshots/hero1.jpg"
                alt="PixelPharm Health Dashboard Preview"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/60" />
        </div>
      </section>

      {/* Biomarker Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Understanding Your Health Starts Here
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              PixelPharm's Multi-MLM analyzes 206+ biomarkers to provide
              comprehensive insights into your cardiovascular, metabolic, and
              overall wellness status.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {biomarkers.map((marker, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-slate-200/50 bg-slate-50/50"
              >
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-slate-500 mb-2">
                    {marker.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`text-3xl font-bold ${marker.color}`}>
                      {marker.value}
                    </span>
                    <span className="text-sm text-slate-400">
                      {marker.unit}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${marker.color} border-current`}
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
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Professional Health Analytics, Simplified
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Using the latest Multi-MLM technology meets clinical expertise to
              deliver insights that were previously only available to healthcare
              professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-slate-200 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              How PixelPharm Works
            </h2>
            <p className="text-xl text-slate-600">
              Get professional health insights in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 shadow-2xl">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                Upload Your Results
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Simply upload any blood test image. Our Multi Medical Model AI
                processes and extracts your biomarker data with clinical-grade
                accuracy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 shadow-2xl">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                AI Analysis
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Our Multi Medical Model AI analyzes your data using clinical
                frameworks and evidence-based medical guidelines for
                comprehensive insights.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 shadow-2xl">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                Get Insights
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Receive personalized recommendations, risk assessments, and
                actionable insights through our comprehensive health dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Purchase Incentive CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        ></div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm text-lg px-4 py-2">
              <Clock className="h-5 w-5 mr-2" />
              Limited Time • Start Your Health Journey Today
            </Badge>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Don't Wait for a Health Crisis
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
              Take control of your health now. Get instant Lab based Multi
              Medical Language Model AI-powered analysis of your blood work and
              discover potential issues before they become serious problems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Instant Results
              </h3>
              <p className="text-white/80 text-lg">
                Get comprehensive health insights in under 2 minutes, not weeks
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Early Detection
              </h3>
              <p className="text-white/80 text-lg">
                Catch potential health issues before symptoms appear
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Peace of Mind
              </h3>
              <p className="text-white/80 text-lg">
                Know exactly where you stand with your health metrics
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full font-bold text-lg mb-4">
                <Star className="h-5 w-5 fill-current" />
                Special Launch Pricing
              </div>
              <div className="text-6xl md:text-7xl font-bold text-white mb-2">
                50% OFF
              </div>
              <p className="text-2xl text-white/90 mb-6">
                First 1000 customers only •{" "}
                <span className="line-through opacity-60">$49</span> Now just
                $24.99
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push("/checkout?plan=pro")}
                className="bg-white text-slate-900 hover:bg-gray-100 text-xl px-10 py-6 shadow-2xl font-bold transform hover:scale-105 transition-all duration-200"
              >
                <ArrowRight className="h-6 w-6 mr-3" />
                Claim Your 50% Now - Use Code "LAUNCH50"
              </Button>

              <div className="text-white/80 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>No subscription required</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Instant access to results</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>HIPAA compliant & secure</span>
                </div>
              </div>
            </div>

            <p className="text-white/60 text-sm mt-6">
              ⏰ Limited time offer expires in 7 days • Join 1000+ satisfied
              customers
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Your Health, Visualized
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Professional-grade dashboard with comprehensive health analytics,
              trend tracking, and personalized recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/90 backdrop-blur border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Health Score
                  </h3>
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-3">
                  87/100
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Excellent health profile with minor optimization opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Risk Assessment
                  </h3>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-3">
                  LOW RISK
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Cardiovascular and metabolic markers within optimal ranges
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Next Actions
                  </h3>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-3">
                  3 Items
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Personalized recommendations for continued health optimization
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push("/demo")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 shadow-xl"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Explore Full Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Trusted by Health Professionals
            </h2>
            <p className="text-xl text-slate-600">
              See what healthcare experts and users say about PixelPharm
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-slate-50 border-slate-200/50 hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-8 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {testimonial.name}
                      </div>
                      <div className="text-slate-600 text-sm">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200/50">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Stay Updated with Health Insights
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Get the latest health optimization tips, biomarker insights, and exclusive content 
              delivered straight to your inbox. Join our community of health-conscious individuals.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubscribing}
                  className="flex-1 h-12 px-4 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  disabled={isSubscribing}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              </div>
              
              {subscriptionStatus.message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  subscriptionStatus.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {subscriptionStatus.message}
                </div>
              )}
            </form>

            <p className="text-sm text-slate-500 mt-6">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        ></div>
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join thousands of users taking control of their health with
            AI-powered insights. Upload your first lab report and discover what
            your biomarkers reveal.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              onClick={handleUploadResults}
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-4 shadow-2xl font-semibold"
            >
              <Upload className="h-5 w-5 mr-2" />
              Start Your Analysis
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/pricing")}
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 backdrop-blur-sm"
            >
              View Pricing
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <span className="text-2xl font-bold">PixelPharm Health</span>
              </div>
              <p className="text-slate-300 max-w-md leading-relaxed">
                Empowering individuals with professional-grade health analytics
                through advanced Multi Medical Model technology. Transform your
                lab results into actionable health insights.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signin"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="hover:text-white transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 PixelPharm Health. All rights reserved. • HIPAA Compliant •
              Clinical-Grade Analytics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
