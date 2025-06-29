// src/app/dashboard/layout.tsx
"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import LoginForm from "@/components/auth/login-form";
import Link from "next/link";
import {
  Activity,
  User,
  Settings,
  Bell,
  LogOut,
  Shield,
  Brain,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://elizapiro.com.au/wp-content/uploads/2025/06/ada.jpg')`,
        }}
      />

      {/* Navigation Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">PixelPharm</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#features"
              className="text-white/90 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-white/90 hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-white/90 hover:text-white transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Side - Site Information */}
            <div className="flex-1 text-white space-y-8 lg:max-w-2xl flex flex-col justify-center">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Your Health,
                  <br />
                  <span className="text-blue-400">AI-Powered</span>
                </h1>

                <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
                  Transform your health data into actionable insights with our
                  advanced Multi Model Medical System (MMMS)
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-6 w-6 text-blue-400" />
                    <span className="text-lg">
                      AI-powered blood test analysis
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                    <span className="text-lg">
                      Real-time health scoring & trends
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="h-6 w-6 text-orange-400" />
                    <span className="text-lg">
                      Fitness data integration (Garmin supported)
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-purple-400" />
                    <span className="text-lg">HIPAA-compliant & secure</span>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">200+</div>
                  <div className="text-sm text-white/80">
                    Biomarkers Tracked
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">95%</div>
                  <div className="text-sm text-white/80">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">24/7</div>
                  <div className="text-sm text-white/80">Health Monitoring</div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  onClick={() =>
                    document
                      .getElementById("login-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div
              id="login-section"
              className="w-full lg:w-auto lg:flex-shrink-0 flex border-none"
            >
              <Card className="w-full max-w-md mx-auto lg:mx-0 bg-white/0 shadow-2xl flex flex-col justify-center border-none">
                <CardContent className="p-8 flex flex-col justify-center flex-1">
                  <div className="text-center mb-6"></div>
                  <LoginForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="relative z-10 bg-white/95 backdrop-blur-md py-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Health Analytics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Multi Model Medical System (MMMS) analyzes your health data
              using advanced AI to provide personalized insights and
              recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  AI Health Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced algorithms analyze your blood work, identifying
                  patterns and providing evidence-based recommendations
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Trend Tracking
                </h3>
                <p className="text-gray-600">
                  Monitor your biomarkers over time, track improvements, and
                  receive alerts for concerning changes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Fitness Integration
                </h3>
                <p className="text-gray-600">
                  Connect your Garmin data to see how exercise impacts your
                  health metrics and overall wellness
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="relative z-10 bg-gray-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                Professional-Grade Health Intelligence
              </h2>
              <p className="text-xl text-gray-300">
                PixelPharm combines cutting-edge AI technology with medical
                expertise to deliver insights traditionally available only to
                healthcare professionals.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h4 className="font-semibold">HIPAA Compliant</h4>
                    <p className="text-gray-400">
                      Your health data is encrypted and secure
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Brain className="h-6 w-6 text-green-400 mt-1" />
                  <div>
                    <h4 className="font-semibold">Evidence-Based AI</h4>
                    <p className="text-gray-400">
                      Recommendations based on peer-reviewed research
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-6 w-6 text-purple-400 mt-1" />
                  <div>
                    <h4 className="font-semibold">
                      Healthcare Provider Integration
                    </h4>
                    <p className="text-gray-400">
                      Share insights with your doctor seamlessly
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6">What You Get</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Comprehensive blood test analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Personalized health recommendations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Fitness data correlation analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Real-time health scoring</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>Trend analysis and alerts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-6 w-6" />
                <span className="text-xl font-bold">PixelPharm</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering individuals with AI-powered health insights to make
                informed decisions about their wellness journey.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Blood Test Analysis</li>
                <li>Fitness Integration</li>
                <li>Health Scoring</li>
                <li>Trend Analysis</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 PixelPharm. All rights reserved. Health insights for
              educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  console.log("🔧 DashboardContent rendering with user:", user);

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">PixelPharm</span>
            </Link>
          </div>
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-blue-600"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/health-analytics"
              className="text-sm font-medium hover:text-blue-600"
            >
              Health Analytics
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium hover:text-blue-600"
            >
              Upload Data
            </Link>
          </nav>
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              {/* User Avatar */}
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {userInitials}
              </div>
              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              {/* Sign Out */}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
