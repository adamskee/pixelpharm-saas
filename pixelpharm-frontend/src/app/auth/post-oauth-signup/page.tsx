"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  CheckCircle,
  Loader2,
  User,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function PostOAuthSignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handlePostOAuthSignup = async () => {
      // Wait for session to load
      if (status === "loading") return;

      // If not authenticated, redirect to signin
      if (status === "unauthenticated") {
        console.log("❌ No session found, redirecting to signin");
        router.push("/auth/signin");
        return;
      }

      // If authenticated, check if user has subscription
      if (session?.user) {
        console.log("✅ User authenticated:", session.user.email);
        
        try {
          // Check if user already has an active subscription
          const response = await fetch("/api/user/subscription-status");
          const data = await response.json();

          if (response.ok && data.hasActiveSubscription) {
            console.log("✅ User has active subscription, redirecting to dashboard");
            router.push("/dashboard");
            return;
          }

          console.log("💳 New user needs subscription, showing pricing options");
          setChecking(false);
        } catch (error) {
          console.error("❌ Error checking subscription status:", error);
          setChecking(false);
        }
      }
    };

    handlePostOAuthSignup();
  }, [session, status, router]);

  if (checking || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-4">
              Please sign in to continue
            </p>
            <Button 
              onClick={() => router.push("/auth/signin")}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PixelPharm Health
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to PixelPharm!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your Google account has been connected successfully. Now choose a plan to unlock the full power of AI-driven health analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-shrink-0">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-900">
                    {session?.user?.name || 'Google User'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {session?.user?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Connected with Google</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Choose Your Plan</h4>
                  <p className="text-sm text-gray-600">Select a subscription that fits your health tracking needs</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Upload Health Data</h4>
                  <p className="text-sm text-gray-600">Start with blood tests, body composition, or fitness data</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Get AI Insights</h4>
                  <p className="text-sm text-gray-600">Receive personalized health recommendations and analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 min-w-48">
                <CreditCard className="h-5 w-5 mr-2" />
                Choose Your Plan
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing#free">
              <Button size="lg" variant="outline" className="min-w-48">
                Start with Free Plan
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            You can always upgrade or downgrade your plan later in your account settings.
          </p>
        </div>

        {/* Feature Preview */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              What You'll Get Access To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium">AI Health Analysis</h4>
                <p className="text-sm text-gray-600">Advanced biomarker analysis and health insights</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium">Comprehensive Tracking</h4>
                <p className="text-sm text-gray-600">Blood tests, body composition, and fitness data</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium">Personalized Reports</h4>
                <p className="text-sm text-gray-600">Custom health recommendations and trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}