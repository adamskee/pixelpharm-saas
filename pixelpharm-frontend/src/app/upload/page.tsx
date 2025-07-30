"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/upload/file-upload";
import { UploadLimitBanner } from "@/components/dashboard/UploadLimitBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploadComplete, setUploadComplete] = useState(false);

  const loading = status === "loading";
  const isAuthenticated = !!session;

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    router.push("/auth/signin");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleUploadComplete = (fileKey: string) => {
    console.log("File uploaded:", fileKey);
    setUploadComplete(true);
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
        {/* Upload Limit Banner */}
        <UploadLimitBanner />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Upload Blood Test Results
            </CardTitle>
            <CardDescription>
              Upload your blood test reports for AI-powered analysis and
              personalized health insights. Supported formats: JPEG, PNG,
              TIFF, WebP (max 25MB each).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onUploadComplete={handleUploadComplete} />
            
            {/* Success Message with Health Analytics Link */}
            {uploadComplete && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Upload Successful!</h3>
                    <p className="text-sm text-green-700">
                      Your blood test has been uploaded and is being processed by our AI.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard/health-analytics">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Health Analytics
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadComplete(false)}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Upload Another Test
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
