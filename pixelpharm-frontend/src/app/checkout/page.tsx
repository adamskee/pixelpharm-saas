"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowLeft,
  Loader2,
  Check,
  Tag,
  CreditCard,
  Shield,
  AlertCircle,
} from "lucide-react";
import { PRICING_PLANS, PlanType } from "@/lib/stripe/config";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const planType = searchParams.get("plan") as PlanType;
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    discount: number;
    message: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const plan = planType ? PRICING_PLANS[planType] : null;

  useEffect(() => {
    if (status === "loading") return;
    
    if (!planType || !plan) {
      router.push("/pricing");
      return;
    }

    // Skip auth check for now to test the flow
    // if (!session) {
    //   router.push("/auth/signin?redirect=/checkout");
    //   return;
    // }
  }, [session, status, planType, plan, router]);

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
          message: data.message,
        });
      } else {
        setCouponValidation({
          isValid: false,
          discount: 0,
          message: data.error || "Invalid coupon code",
        });
      }
    } catch (error) {
      setCouponValidation({
        isValid: false,
        discount: 0,
        message: "Error validating coupon code",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCouponChange = (value: string) => {
    setCouponCode(value);
    // Reset validation when user types
    if (couponValidation) {
      setCouponValidation(null);
    }
  };

  const handleCouponBlur = () => {
    validateCoupon(couponCode);
  };

  const handleProceedToPayment = async () => {
    if (!plan) return;
    
    // For testing, use dummy session data if no real session
    if (!session) {
      router.push("/auth/signin?redirect=" + encodeURIComponent(`/checkout?plan=${planType}`));
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType,
          couponCode: couponValidation?.isValid ? couponCode.trim() : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const originalPrice = plan.price;
  const discountAmount = couponValidation?.isValid ? (originalPrice * couponValidation.discount / 100) : 0;
  const finalPrice = originalPrice - discountAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PixelPharm
              </span>
            </Link>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
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
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>
                  Add a coupon code or proceed to payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Coupon Code Section */}
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

                {/* Proceed Button */}
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
                  By clicking "Proceed to Payment", you agree to our Terms of Service
                  and Privacy Policy. Your payment is processed securely by Stripe.
                </p>
              </CardContent>
            </Card>

            {/* Features Reminder */}
            <Card className="mt-6">
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