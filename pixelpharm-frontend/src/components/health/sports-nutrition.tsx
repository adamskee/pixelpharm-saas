// File: src/components/health/sports-nutrition.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Apple,
  Clock,
  Zap,
  Droplet,
  Target,
  AlertTriangle,
  CheckCircle,
  Pill,
  Timer,
  Activity,
  Loader2,
  RefreshCw,
  Scale,
  Utensils
} from 'lucide-react';

type ActivityLevel = 'sedentary' | 'daily-walker' | 'gym-visitor' | 'elite-athlete';

interface SportsNutritionProps {
  userId: string;
  activityLevel?: ActivityLevel;
}

interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  priority: "ESSENTIAL" | "BENEFICIAL" | "OPTIONAL";
  contraindications: string[];
  food_interactions: string[];
  biomarker_rationale: string;
}

interface NutritionData {
  overall_nutrition_score: number;
  deficiency_risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  performance_nutrition: {
    pre_workout: string[];
    during_workout: string[];
    post_workout: string[];
    daily_requirements: {
      protein: string;
      carbohydrates: string;
      fats: string;
      calories: string;
    };
  };
  supplement_recommendations: SupplementRecommendation[];
  meal_timing: {
    breakfast: string;
    pre_workout: string;
    post_workout: string;
    lunch: string;
    dinner: string;
    bedtime: string;
  };
  hydration_protocol: {
    daily_intake: string;
    electrolyte_needs: string;
    timing_recommendations: string[];
  };
  biomarker_based_adjustments: string[];
  monitoring_biomarkers: string[];
  reassessment_timeline: string;
}

export function SportsNutrition({ userId, activityLevel = 'daily-walker' }: SportsNutritionProps) {
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNutritionProtocol = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/health/sports-nutrition?userId=${userId}&activityLevel=${activityLevel}&_timestamp=${Date.now()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No biomarker data available. Upload blood test results to generate nutrition recommendations.");
        }
        throw new Error("Failed to generate nutrition protocol");
      }
      
      const data = await response.json();
      setNutritionData(data.nutritionProtocol);
      setLastUpdated(data.generatedAt);
    } catch (err: any) {
      console.error("Nutrition protocol error:", err);
      setError(err.message || "Failed to load nutrition protocol");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNutritionProtocol();
    }
  }, [userId, activityLevel]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "LOW": return "bg-green-100 text-green-800";
      case "MODERATE": return "bg-yellow-100 text-yellow-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "CRITICAL": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "ESSENTIAL": return "bg-red-100 text-red-800";
      case "BENEFICIAL": return "bg-blue-100 text-blue-800";
      case "OPTIONAL": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Apple className="h-5 w-5 text-green-600" />
            <span>Sports Nutrition Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-600">Analyzing your biomarkers for personalized nutrition recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Apple className="h-5 w-5 text-green-600" />
            <span>Sports Nutrition Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={fetchNutritionProtocol} 
            variant="outline" 
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!nutritionData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Nutrition Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2">
                <Apple className="h-5 w-5 text-green-600" />
                <span>Sports Nutrition Analysis</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Activity Level:</span>
                <Badge variant="outline" className="capitalize">
                  {activityLevel.replace('-', ' ')}
                </Badge>
              </div>
            </div>
            <Button 
              onClick={fetchNutritionProtocol} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Generated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nutrition Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(nutritionData.overall_nutrition_score)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Nutrition Score</span>
                <Target className="h-4 w-4" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {nutritionData.overall_nutrition_score}/100
              </div>
              <Progress value={nutritionData.overall_nutrition_score} className="mb-2" />
              <p className="text-xs">
                Based on biomarker analysis and nutritional status
              </p>
            </div>

            {/* Deficiency Risk */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Deficiency Risk</span>
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </div>
              <Badge className={`text-sm ${getRiskLevelColor(nutritionData.deficiency_risk)}`}>
                {nutritionData.deficiency_risk}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Risk assessment based on biomarker deficiencies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="macros" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="supplements">Supplements</TabsTrigger>
          <TabsTrigger value="hydration">Hydration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitor</TabsTrigger>
        </TabsList>

        {/* Macronutrient Requirements */}
        <TabsContent value="macros">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="h-5 w-5 text-blue-500" />
                  <span>Daily Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-red-700">Protein</span>
                    <span className="text-red-800">{nutritionData.performance_nutrition.daily_requirements.protein}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-700">Carbohydrates</span>
                    <span className="text-blue-800">{nutritionData.performance_nutrition.daily_requirements.carbohydrates}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-yellow-700">Fats</span>
                    <span className="text-yellow-800">{nutritionData.performance_nutrition.daily_requirements.fats}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-purple-700">Total Calories</span>
                    <span className="text-purple-800">{nutritionData.performance_nutrition.daily_requirements.calories}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span>Performance Nutrition</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                      <Timer className="h-4 w-4 mr-1" />
                      Pre-Workout
                    </h4>
                    <ul className="space-y-1">
                      {nutritionData.performance_nutrition.pre_workout.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      During Workout
                    </h4>
                    <ul className="space-y-1">
                      {nutritionData.performance_nutrition.during_workout.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Post-Workout
                    </h4>
                    <ul className="space-y-1">
                      {nutritionData.performance_nutrition.post_workout.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Meal Timing */}
        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span>Optimal Meal Timing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(nutritionData.meal_timing).map(([meal, recommendation]) => (
                  <div key={meal} className="p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50">
                    <h4 className="font-medium text-indigo-700 mb-2 capitalize flex items-center">
                      <Utensils className="h-4 w-4 mr-2" />
                      {meal.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplements */}
        <TabsContent value="supplements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-purple-500" />
                <span>Supplement Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nutritionData.supplement_recommendations.map((supplement, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">{supplement.name}</h4>
                      <Badge className={getPriorityColor(supplement.priority)}>
                        {supplement.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Dosage: </span>
                        <span className="text-blue-600">{supplement.dosage}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timing: </span>
                        <span className="text-green-600">{supplement.timing}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Purpose: </span>
                      <span className="text-gray-600">{supplement.purpose}</span>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Biomarker Rationale: </span>
                      <span className="text-purple-600 text-sm">{supplement.biomarker_rationale}</span>
                    </div>

                    {supplement.food_interactions.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Food Interactions: </span>
                        <ul className="inline">
                          {supplement.food_interactions.map((interaction, i) => (
                            <li key={i} className="inline text-sm text-orange-600">
                              {interaction}{i < supplement.food_interactions.length - 1 ? ', ' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {supplement.contraindications.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Cautions: </span>
                        <ul className="inline">
                          {supplement.contraindications.map((caution, i) => (
                            <li key={i} className="inline text-sm text-red-600">
                              {caution}{i < supplement.contraindications.length - 1 ? ', ' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hydration */}
        <TabsContent value="hydration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplet className="h-5 w-5 text-cyan-500" />
                <span>Hydration Protocol</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                    <h4 className="font-medium text-cyan-700 mb-2">Daily Intake Target</h4>
                    <p className="text-2xl font-bold text-cyan-800">{nutritionData.hydration_protocol.daily_intake}</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-700 mb-2">Electrolyte Needs</h4>
                    <p className="text-sm text-blue-800">{nutritionData.hydration_protocol.electrolyte_needs}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Timing Recommendations</h4>
                  <div className="space-y-2">
                    {nutritionData.hydration_protocol.timing_recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                        <Droplet className="h-4 w-4 text-cyan-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>Biomarker Adjustments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nutritionData.biomarker_based_adjustments.map((adjustment, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{adjustment}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span>Progress Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Monitor These Biomarkers</h4>
                    <div className="flex flex-wrap gap-2">
                      {nutritionData.monitoring_biomarkers.map((biomarker, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {biomarker}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-700 mb-1">Reassessment Timeline</h4>
                    <p className="text-sm text-purple-800">{nutritionData.reassessment_timeline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}