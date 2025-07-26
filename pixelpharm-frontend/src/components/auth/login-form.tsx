// File: src/components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const handleDemoCredentials = () => {
    setEmail("demo@pixelpharm.com");
    setPassword("demo123");
    setFirstName("Demo");
    setLastName("User");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password, firstName, lastName);
      console.log("✅ Login successful, redirecting...");
      // The auth context will handle the redirect
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl backdrop-blur border-white/20">
        <CardHeader className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Homepage
          </Link>

          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PixelPharm Health Analytics
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Create your account to get started"
              : "Sign in to access your health dashboard"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Demo Credentials Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Demo Credentials
            </div>
            <div className="text-xs text-blue-600 mb-2">
              Email: demo@pixelpharm.com
              <br />
              Password: demo123
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoCredentials}
              className="w-full bg-white hover:bg-blue-50"
            >
              Use Demo Credentials
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Features Preview */}
          <div className="border-t pt-4 text-center">
            <div className="text-sm text-gray-600 mb-2">
              Access your enhanced dashboard:
            </div>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>• AI Health Analysis</span>
              <span>• 6-Tab Dashboard</span>
              <span>• Medical Reviews</span>
            </div>
          </div>

          {/* Beta Notice */}
          <div className="text-center text-xs text-gray-500">
            PixelPharm is in BETA mode
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
