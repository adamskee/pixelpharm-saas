"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { PRICING_PLANS, PlanType } from "@/lib/stripe/config";
import Link from "next/link";
import Image from "next/image";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planType = searchParams.get("plan") as PlanType;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // User details form state
  const [userDetails, setUserDetails] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    isAnonymous: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    discount: number;
    discountType: 'percent' | 'amount';
    message: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

  const plan = planType ? PRICING_PLANS[planType] : null;

  useEffect(() => {
    if (!planType || !plan) {
      router.push("/pricing");
      return;
    }
    
    // For free plan, redirect to auth signup
    if (planType === "free") {
      router.push("/auth/signin");
      return;
    }
  }, [planType, plan, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
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

  const handleCouponChange = (value: string) => {
    setCouponCode(value);
    if (couponValidation) {
      setCouponValidation(null);
    }
  };

  const handleCouponBlur = () => {
    validateCoupon(couponCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) return;

    // Basic validation
    if (!userDetails.email || !userDetails.password) {
      setError("Email and password are required");
      return;
    }

    if (!userDetails.isAnonymous && (!userDetails.firstName || !userDetails.lastName)) {
      setError("First name and last name are required for non-anonymous accounts");
      return;
    }

    if (userDetails.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Validate coupon if provided
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

      // Create checkout session with user details
      const finalCouponCode = currentCouponValidation?.isValid ? couponCode.trim() : undefined;
      
      const response = await fetch("/api/stripe/create-checkout-session-with-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType,
          couponCode: finalCouponCode,
          userDetails: {
            email: userDetails.email,
            password: userDetails.password,
            firstName: userDetails.isAnonymous ? "" : userDetails.firstName,
            lastName: userDetails.isAnonymous ? "" : userDetails.lastName,
            isAnonymous: userDetails.isAnonymous,
          }
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

  const handleGoogleSignUp = async () => {
    setIsGoogleProcessing(true);
    setError("");
    
    try {
      // Store plan selection and coupon in sessionStorage for after OAuth
      if (planType) {
        sessionStorage.setItem('pendingPlanSelection', planType);
      }
      if (couponCode.trim()) {
        sessionStorage.setItem('pendingCouponCode', couponCode.trim());
      }
      
      // Redirect to Google OAuth with callback to a payment completion page
      const result = await signIn('google', {
        callbackUrl: `/payment/complete?plan=${planType}${couponCode ? '&coupon=' + encodeURIComponent(couponCode) : ''}`,
        redirect: true
      });
      
      // signIn redirects, so this won't execute unless there's an error
      if (result?.error) {
        throw new Error('Google sign in failed');
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleProcessing(false);
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

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">Create your account and proceed to payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                Create your account to access PixelPharm Health
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google OAuth temporarily disabled for production reliability
              <div className="space-y-4 mb-6">
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isGoogleProcessing}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  {isGoogleProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing in with Google...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
                  </div>
                </div>
              </div>
              */}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userDetails.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={userDetails.password}
                      onChange={handleInputChange}
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 py-2">
                  <Checkbox
                    id="isAnonymous"
                    checked={userDetails.isAnonymous}
                    onCheckedChange={(checked) => {
                      setUserDetails(prev => ({
                        ...prev,
                        isAnonymous: Boolean(checked),
                        firstName: checked ? "" : prev.firstName,
                        lastName: checked ? "" : prev.lastName,
                      }));
                    }}
                  />
                  <div className="text-sm">
                    <Label htmlFor="isAnonymous" className="font-medium text-gray-700 cursor-pointer">
                      Create Anonymous Account
                    </Label>
                    <p className="text-gray-500 text-xs mt-1">
                      Your name won't be displayed. Only a user ID will be shown for maximum privacy.
                    </p>
                  </div>
                </div>

                {!userDetails.isAnonymous && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First Name"
                        value={userDetails.firstName}
                        onChange={handleInputChange}
                        required={!userDetails.isAnonymous}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Last Name"
                        value={userDetails.lastName}
                        onChange={handleInputChange}
                        required={!userDetails.isAnonymous}
                      />
                    </div>
                  </div>
                )}

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

                <Button
                  type="submit"
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
              </form>
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

function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}