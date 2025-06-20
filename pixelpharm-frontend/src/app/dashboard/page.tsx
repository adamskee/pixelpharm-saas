"use client";

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  <h1 className="text-2xl font-bold">PixelPharm</h1>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-blue-200"
                >
                  Health Analytics
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>

                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700 max-w-32 truncate">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-lg text-gray-600">
              Track your health metrics and get AI-powered insights from your
              data
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Blood Tests</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Body Scans</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Scale className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Activities</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">AI Insights</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/upload" className="group">
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Lab Work
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">
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
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Scale className="h-6 w-6 text-green-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        InBody
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-green-700 transition-colors">
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
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Garmin
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-orange-700 transition-colors">
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
                <Card className="hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        AI Powered
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-purple-700 transition-colors">
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
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Blood Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    No blood tests uploaded yet. Start by uploading your first
                    lab results.
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/upload">Upload First Test</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <Activity className="h-5 w-5 mr-2" />
                  AI Health Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    AI insights will appear here after uploading your health
                    data.
                  </p>
                  <Button
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
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
