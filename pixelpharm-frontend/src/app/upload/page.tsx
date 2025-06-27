"use client";
import { useAuth } from "@/lib/auth/auth-context";
import LoginForm from "@/components/auth/login-form";
import FileUpload from "@/components/upload/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
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
    return <LoginForm />;
  }

  const handleUploadComplete = (fileKey: string) => {
    console.log("File uploaded:", fileKey);
    // TODO: Store file reference in database
    // TODO: Trigger AI analysis pipeline
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
              Blood Test Upload
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Upload Blood Test Results
            </CardTitle>
            <CardDescription>
              Upload your blood test reports for AI-powered analysis and
              personalized health insights. Supported formats: PDF, JPEG, PNG,
              TIFF, WebP (max 25MB each).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {/* Information Section */}
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
                  <h4 className="font-semibold">OCR Processing</h4>
                  <p className="text-sm text-gray-600">
                    Our AI extracts biomarker values from your test documents
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Multi-LLM Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Multiple AI models analyze your results for comprehensive
                    insights
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">
                    Personalized Recommendations
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get tailored supplement, lifestyle, and follow-up
                    recommendations
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
