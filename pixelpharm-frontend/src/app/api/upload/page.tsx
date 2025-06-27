"use client";

import { useAuth } from "@/lib/auth/auth-context";
import LoginForm from "@/components/auth/login-form";
import FileUpload from "@/components/upload/file-upload";

export default function UploadPage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Health Data
        </h1>
        <p className="text-gray-600">
          Upload your health documents for AI analysis
        </p>
      </div>

      <FileUpload />
    </div>
  );
}
