"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Check,
  ArrowRight,
  Star,
  Users,
  Building,
  Zap,
  Shield,
  BarChart3,
  Brain,
  Clock,
  FileText,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PRICING_PLANS, PlanType } from "@/lib/stripe/config";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const handlePurchase = async (planType: PlanType) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setLoading(planType);

    try {
      // Handle free plan - redirect directly to dashboard
      if (planType === "free") {
        router.push("/dashboard");
        return;
      }
      
      // Redirect to checkout page with plan parameter for paid plans
      router.push(`/checkout?plan=${planType}`);
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Navigation failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };
  const plans = [
    {
      name: "Free",
      price: "Free",
      period: "forever",
      description:
        "Get started with basic health insights from your blood tests. Perfect for trying out our AI-powered health analytics",
      features: [
        "1 blood test upload (lifetime)",
        "Analysis of 3 biomarkers only", 
        "Basic health insights",
        "Simple health report",
        "Recovery protocol suggestions using HRV & inflammatory markers",
        "Sports nutritionist-grade supplement timing & dosage recommendations",
        "Community support",
        "Upgrade anytime for full access"
      ],
      popular: false,
      cta: "Get Started Free",
      planType: "free" as PlanType,
    },
    {
      name: "Elite Athlete",
      price: "$24.95",
      period: "per month",
      description:
        "Created for elite athletes, coaches, and dedicated health optimizers who demand clinical-grade insights",
      features: [
        "Up to 20 blood test uploads per month", // Updated from 5 to 20
        "Analysis of ALL biomarkers (unlimited)",
        "Advanced AI health analysis",
        "Health score tracking",
        "Comprehensive health reports",
        "Trend analysis & predictions",
        "Risk assessment reports",
        "Email support",
        "Performance optimization recommendations based on hormonal profiles",
        "Recovery protocol suggestions using HRV & inflammatory markers",
        "Sports nutritionist-grade supplement timing & dosage recommendations",
      ],
      popular: true,
      cta: "Start Elite Plan",
      planType: "basic" as PlanType,
    },
    {
      name: "Pro",
      price: "$49.95",
      period: "30 days access",
      description:
        "One-time purchase for comprehensive health insights with full access to all features and unlimited biomarker analysis",
      features: [
        "20 blood test uploads",
        "Analysis of ALL biomarkers (unlimited)",
        "Advanced AI health analysis",
        "Comprehensive health reports",
        "Trend analysis & predictions",
        "Priority email support",
        "Custom health recommendations",
        "Body composition tracking",
        "Risk assessment reports", 
        "Recovery protocol suggestions using HRV & inflammatory markers",
        "Sports nutritionist-grade supplement timing & dosage recommendations",
        "30 days full dashboard access",
        "Complete insights & analytics",
      ],
      popular: false,
      cta: "Get Pro Access",
      planType: "pro" as PlanType,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm Health
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                About
              </Link>
              <Link href="/pricing" className="text-blue-600 font-medium">
                Pricing
              </Link>
              <Link
                href="/support"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Support
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Join the World Class Health Platform Now!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Health Journey
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Transform your lab results into actionable insights with our Multi
              Medical Model AI-powered health analytics platform.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "border-blue-500 shadow-2xl scale-105"
                      : "border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-4 text-base">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.popular ? "bg-blue-600 hover:bg-blue-700" : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() =>
                        plan.planType ? handlePurchase(plan.planType) : null
                      }
                      disabled={
                        loading === plan.planType ||
                        (!plan.planType && plan.name !== "Enterprise")
                      }
                    >
                      {loading === plan.planType ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose PixelPharm Health?
              </h2>
              <p className="text-xl text-gray-600">
                Advanced health analytics powered by cutting-edge Multi Medical
                Model Technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-600">
                  Our advanced Multi Medical Model technology analyzes your
                  results with clinical-grade precision
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Bank-Level Security
                </h3>
                <p className="text-gray-600">
                  Your health data is encrypted and protected with
                  enterprise-grade security measures
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Actionable Insights
                </h3>
                <p className="text-gray-600">
                  Get personalized recommendations and track your progress with
                  easy-to-understand reports
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  No. Rather than a limited trial, we provide full transparency
                  about our testing processes, sample reports, and detailed
                  service information upfront. This way, you can make an
                  informed decision knowing exactly what comprehensive testing
                  and analysis you'll receive. Medical testing services
                  typically don't offer free trials due to the real costs of
                  laboratory work and regulatory requirements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600">
                  Absolutely. You can cancel your subscription at any time with
                  no cancellation fees. Your access will continue until the end
                  of your billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Is my health data secure?
                </h3>
                <p className="text-gray-600">
                  Yes, we use bank-level encryption and are HIPAA compliant.
                  Your data is stored securely and never shared without your
                  explicit consent.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What file formats do you support?
                </h3>
                <p className="text-gray-600">
                  We support png, jpg, webp and gif. Our Multi Medical Model
                  technology can process most standard lab report formats.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Health Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who are already making data-driven health
              decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Start Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/support">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PixelPharm Health
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
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
                    href="/auth/signup"
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
            <p className="text-gray-400 text-sm">
              © 2024 PixelPharm Health. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
