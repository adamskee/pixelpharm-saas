"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    hasActiveSubscription: false,
    subscriptionPlan: null,
    subscriptionStatus: null,
    subscriptionExpiresAt: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    checkSubscriptionStatus();
  }, [session, status, router]);

  const checkSubscriptionStatus = async () => {
    try {
      setSubscriptionData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch("/api/user/subscription-status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check subscription status");
      }

      setSubscriptionData({
        hasActiveSubscription: data.hasActiveSubscription,
        subscriptionPlan: data.plan,
        subscriptionStatus: data.status,
        subscriptionExpiresAt: data.expiresAt,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      setSubscriptionData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  };

  // Show loading state while session is loading or subscription is being checked
  if (status === "loading" || subscriptionData.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking your subscription...</p>
        </div>
      </div>
    );
  }

  // If user has active subscription or free plan, allow access
  if (subscriptionData.hasActiveSubscription || subscriptionData.subscriptionPlan === "free") {
    return <>{children}</>;
  }

  // Show subscription required page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Subscription Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              You need an active subscription to access the dashboard. Please choose a plan to continue.
            </p>
            
            {subscriptionData.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <p className="text-red-800 text-sm">{subscriptionData.error}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/pricing")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Pricing Plans
            </Button>
            
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Back to Home
            </Button>
            
            <Button
              onClick={checkSubscriptionStatus}
              variant="ghost"
              className="w-full text-sm"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {subscriptionData.subscriptionStatus && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Current Status: <span className="font-medium">{subscriptionData.subscriptionStatus}</span>
              </p>
              {subscriptionData.subscriptionExpiresAt && (
                <p className="text-sm text-gray-500">
                  Expires: {new Date(subscriptionData.subscriptionExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}