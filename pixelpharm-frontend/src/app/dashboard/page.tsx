"use client";

import { useRouter } from "next/navigation"; // Add this line
import { useState, useCallback } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
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
  Upload,
  Activity,
  Scale,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  User,
  Bell,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                  <h1 className="text-2xl font-bold">PixelPharm</h1>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 border-slate-200"
                >
                  Health Analytics
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>

                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-700 max-w-32 truncate">
                    {user?.attributes?.email || "User"}
                  </span>
                </div>

                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-lg text-slate-600">
              Track your health metrics and get AI-powered insights from your
              data
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/health-analytics")}
            >
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">
                  Health Analytics
                </h3>
                <p className="text-sm text-slate-600">
                  View biomarker trends and health insights
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-100 text-sm">Blood Tests</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <FileText className="h-8 w-8 text-slate-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-600 to-slate-700 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-100 text-sm">Body Scans</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Scale className="h-8 w-8 text-slate-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-100 text-sm">Activities</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Activity className="h-8 w-8 text-slate-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-100 text-sm">AI Insights</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-slate-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/upload" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <Upload className="h-6 w-6 text-slate-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200"
                      >
                        Lab Work
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-slate-700 transition-colors">
                      Blood Tests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Upload lab results for AI analysis and health insights
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/body-composition" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <Scale className="h-6 w-6 text-slate-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200"
                      >
                        InBody
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-slate-700 transition-colors">
                      Body Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Upload InBody 570 scans and track body composition trends
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/fitness-activities" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <Activity className="h-6 w-6 text-slate-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200"
                      >
                        Garmin
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-slate-700 transition-colors">
                      Fitness Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Import Garmin Connect activities and analyze performance
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/analytics" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <BarChart3 className="h-6 w-6 text-slate-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200"
                      >
                        AI Powered
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-slate-700 transition-colors">
                      Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      View trends, correlations, and AI-generated insights
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Blood Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    No blood tests uploaded yet. Start by uploading your first
                    lab results.
                  </p>
                  <Button asChild className="bg-slate-600 hover:bg-slate-700">
                    <Link href="/upload">Upload First Test</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <Activity className="h-5 w-5 mr-2" />
                  AI Health Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    AI insights will appear here after uploading your health
                    data.
                  </p>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-600 hover:bg-slate-50"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
