// File: src/app/dashboard/health-optimization/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RecoveryProtocol } from '@/components/health/recovery-protocol';
import { SportsNutrition } from '@/components/health/sports-nutrition';
import {
  Activity,
  Apple,
  Heart,
  Zap,
  Target,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Award,
  Clock,
  User,
  Footprints,
  Dumbbell,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

type ActivityLevel = 'sedentary' | 'daily-walker' | 'gym-visitor' | 'elite-athlete';

export default function HealthOptimizationPage() {
  const { user } = useAuth();
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<ActivityLevel>('daily-walker');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access your health optimization protocols.</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Health Optimization
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
                <Award className="h-3 w-3 mr-1" />
                Elite Features
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Target className="h-4 w-4" />
              <span>Personalized Performance Optimization</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Elite Athlete
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {" "}Recovery & Nutrition
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced biomarker-based protocols for optimal recovery, performance nutrition, 
              and supplement timing. Previously exclusive to elite athletes, now available to all users.
            </p>
          </div>

          {/* Feature Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>Recovery Protocol</span>
                </CardTitle>
                <CardDescription>
                  HRV-based recovery recommendations using inflammatory markers and stress indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>HRV analysis & autonomic nervous system assessment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Inflammatory load evaluation (CRP, ESR, WBC)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Sleep optimization & training load recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Apple className="h-5 w-5 text-green-600" />
                  <span>Sports Nutrition</span>
                </CardTitle>
                <CardDescription>
                  Sports nutritionist-grade supplement timing & dosage recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Personalized macro & micronutrient requirements</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>Performance-timed supplement protocols</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>Pre/during/post-workout nutrition timing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content */}
        <Tabs defaultValue="recovery" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="recovery" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Recovery Protocol</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center space-x-2">
                <Apple className="h-4 w-4" />
                <span>Sports Nutrition</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recovery">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Recovery Protocol Analysis
                </h3>
                <p className="text-gray-600">
                  Personalized recovery recommendations based on your HRV patterns and inflammatory markers
                </p>
              </div>
              <RecoveryProtocol userId={user.userId} />
            </div>
          </TabsContent>

          <TabsContent value="nutrition">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Sports Nutrition Protocol
                </h3>
                <p className="text-gray-600">
                  Evidence-based nutrition and supplementation strategies optimized for your biomarker profile
                </p>
              </div>
              
              {/* Activity Level Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Select Your Activity Level</span>
                  </CardTitle>
                  <CardDescription>
                    Choose your typical activity level to customize nutrition and supplement recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Sedentary */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-gray-50 ${
                        selectedActivityLevel === 'sedentary'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedActivityLevel('sedentary')}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedActivityLevel === 'sedentary'}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-800">Sedentary</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Little to no regular exercise, desk job, mostly sitting throughout the day
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Daily Walker */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-gray-50 ${
                        selectedActivityLevel === 'daily-walker'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedActivityLevel('daily-walker')}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedActivityLevel === 'daily-walker'}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Footprints className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-800">Daily Walker</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Regular walking, light activities, occasional longer walks or hikes
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Gym Visitor */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-gray-50 ${
                        selectedActivityLevel === 'gym-visitor'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedActivityLevel('gym-visitor')}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedActivityLevel === 'gym-visitor'}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Dumbbell className="h-5 w-5 text-orange-600" />
                            <span className="font-medium text-gray-800">Gym Visitor</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Regular gym sessions 3-5x/week, strength training, cardio workouts
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Elite Athlete */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-gray-50 ${
                        selectedActivityLevel === 'elite-athlete'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedActivityLevel('elite-athlete')}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedActivityLevel === 'elite-athlete'}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Trophy className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-800">Elite Athlete</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Training 6+ times/week, competitive sports, high-intensity workouts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SportsNutrition userId={user.userId} activityLevel={selectedActivityLevel} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Information Banner */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  Elite Features Now Available to All Users
                </h3>
                <p className="text-indigo-700 mb-3">
                  These advanced optimization protocols were previously exclusive to our $24.95/month Elite Athlete plan. 
                  We've now made them available to all account types to help everyone achieve their health and performance goals.
                </p>
                <ul className="text-sm text-indigo-600 space-y-1">
                  <li>• Biomarker-driven recovery protocols using HRV and inflammatory marker analysis</li>
                  <li>• Sports nutritionist-grade supplement timing and dosage recommendations</li>
                  <li>• Personalized training load adjustments based on stress markers</li>
                  <li>• Professional-grade hydration and electrolyte protocols</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}