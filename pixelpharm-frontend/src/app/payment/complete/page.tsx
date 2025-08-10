"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  Loader2,
  Check,
  Tag,
  CreditCard,
  Shield,
  AlertCircle,
  User,
} from "lucide-react";
import { PRICING_PLANS, PlanType } from "@/lib/stripe/config";
import Link from "next/link";

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const planType = searchParams.get("plan") as PlanType;
  const initialCouponCode = searchParams.get("coupon") || "";
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    discount: number;
    discountType: 'percent' | 'amount';
    message: string;
  } | null>(null);

  const plan = planType ? PRICING_PLANS[planType] : null;

  useEffect(() => {
    if (!planType || !plan) {
      router.push("/pricing");
      return;
    }
    
    if (planType === "free") {
      router.push("/dashboard");
      return;
    }

    // Validate initial coupon if provided
    if (initialCouponCode && !couponValidation && couponCode === initialCouponCode) {
      validateCoupon(initialCouponCode);
    }
  }, [planType, plan, router, initialCouponCode, couponValidation, couponCode]);

  useEffect(() => {
    // If user is not authenticated after a reasonable time, redirect back
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        router.push(`/payment?plan=${planType}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, planType, router]);

  const handleCouponChange = (value: string) => {
    setCouponCode(value);
    if (couponValidation) {
      setCouponValidation(null);
    }
  };

  const handleCouponBlur = () => {
    validateCoupon(couponCode);
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponValidation(null);
      return;
    }

    setIsValidatingCoupon(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/validate-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setCouponValidation({
          isValid: true,
          discount: data.discount,
          discountType: data.discountType || 'percent',
          message: data.message,
        });
      } else {
        setCouponValidation({
          isValid: false,
          discount: 0,
          discountType: 'percent',
          message: data.error || "Invalid coupon code",
        });
      }
    } catch (error) {
      console.warn("Coupon validation failed:", error);
      setCouponValidation({
        isValid: false,
        discount: 0,
        discountType: 'percent',
        message: "Error validating coupon code",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!session?.user || !plan) return;

    setIsProcessing(true);
    setError("");

    try {
      // Validate coupon if provided and not yet validated
      let currentCouponValidation = couponValidation;
      if (couponCode.trim() && !couponValidation) {
        try {
          const response = await fetch("/api/stripe/validate-coupon", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: couponCode.trim() }),
          });
          const data = await response.json();
          if (response.ok) {
            currentCouponValidation = {
              isValid: true,
              discount: data.discount,
              discountType: data.discountType || 'percent',
              message: data.message,
            };
            setCouponValidation(currentCouponValidation);
          }
        } catch (error) {
          console.warn("Coupon validation failed, proceeding without coupon");
        }
      }

      // Create checkout session for Google OAuth user
      const finalCouponCode = currentCouponValidation?.isValid ? couponCode.trim() : undefined;
      
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType,
          couponCode: finalCouponCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Payment setup error:", error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid plan selected</p>
          <Link href="/pricing">
            <Button>Go to Pricing</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Completing your sign up...</p>
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
            <CardDescription>
              You need to be signed in to complete your purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push(`/payment?plan=${planType}`)}
              className="w-full"
            >
              Return to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const originalPrice = plan.price;
  const discountAmount = couponValidation?.isValid 
    ? couponValidation.discountType === 'percent'
      ? (originalPrice * couponValidation.discount / 100)
      : Math.min(couponValidation.discount, originalPrice)
    : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm Health
              </span>
            </Link>
            <Button
              variant="ghost"
              onClick={() => router.push("/pricing")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">Welcome, {session?.user?.name || session?.user?.email}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                You're signed in and ready to proceed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session?.user?.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Authenticated with Google</span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="coupon"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => handleCouponChange(e.target.value)}
                      onBlur={handleCouponBlur}
                      className={`pr-10 ${
                        couponValidation?.isValid
                          ? "border-green-500 focus:ring-green-500"
                          : couponValidation?.isValid === false
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {isValidatingCoupon && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {couponValidation?.isValid && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {couponValidation?.isValid === false && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {couponValidation && (
                    <p
                      className={`text-sm ${
                        couponValidation.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {couponValidation.message}
                    </p>
                  )}
                </div>


                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  Review your purchase details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{plan.name} Plan</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      ${originalPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">{plan.period}</div>
                  </div>
                </div>

                {couponValidation?.isValid && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Coupon: {couponCode.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-green-800 font-bold">
                      -${discountAmount.toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                  {couponValidation?.isValid && (
                    <div className="text-sm text-green-600 text-right">
                      You save ${discountAmount.toFixed(2)}!
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 pt-4">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>

            {/* Features Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-gray-500">
                      +{plan.features.length - 5} more features...
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function PaymentCompleteLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<PaymentCompleteLoadingFallback />}>
      <PaymentCompleteContent />
    </Suspense>
  );
}