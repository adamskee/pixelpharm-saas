// File: src/app/dashboard/page.tsx

"use client";

import { useAuth } from "@/lib/auth/auth-context";
import AuthForms from "@/components/auth/auth-forms";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show auth forms if not authenticated
  if (!isAuthenticated) {
    return <AuthForms />;
  }

  // Show dashboard for authenticated users
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || "User"}!
        </h1>
        <p className="text-gray-600">
          Your personalized health analytics dashboard
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/upload" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Upload Health Data
              </h3>
            </div>
            <p className="text-gray-600">
              Upload blood tests, body composition data, or fitness activities
            </p>
          </div>
        </Link>

        <Link href="/dashboard/health-analytics" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                Health Analytics
              </h3>
            </div>
            <p className="text-gray-600">
              View AI-powered insights and personalized recommendations
            </p>
          </div>
        </Link>

        <Link href="/body-composition" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                Body Composition
              </h3>
            </div>
            <p className="text-gray-600">
              Track your body composition and fitness metrics
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Getting Started
        </h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Upload Your Health Data
              </h3>
              <p className="text-gray-600 text-sm">
                Start by uploading a blood test or health report
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Get AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our AI will analyze your biomarkers and generate insights
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                View Health Analytics
              </h3>
              <p className="text-gray-600 text-sm">
                Access personalized recommendations and track trends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
