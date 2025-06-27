"use client";

import { useAuth } from "@/lib/auth/auth-context";
import GarminCsvUpload from "@/components/upload/garmin-csv-upload";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FitnessActivitiesPage() {
  const handleUploadComplete = (activities: any[]) => {
    console.log("Fitness activities saved:", activities.length);
    // TODO: Show success message
    // TODO: Redirect to analytics dashboard
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
              Fitness Activities
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GarminCsvUpload onUploadComplete={handleUploadComplete} />
      </main>
    </div>
  );
}
