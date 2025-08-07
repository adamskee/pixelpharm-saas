// File: src/app/api/health/sports-nutrition/route.ts
// Sports Nutritionist-grade Supplement Timing & Dosage Recommendations

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";
import { callBedrockClaude } from "@/lib/aws/bedrock";

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

interface NutritionProtocol {
  overall_nutrition_score: number; // 0-100
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
    }
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || 
      session.user.id || 
      `user-${session.user.email.replace(/[^a-z0-9]/g, "")}`;

    console.log(`🥗 Generating sports nutrition protocol for user: ${userId}`);

    // Get latest biomarker data
    let biomarkerValues;
    try {
      biomarkerValues = await prisma.biomarkerValue.findMany({
        where: { userId },
        orderBy: { testDate: "desc" },
        take: 50,
      });
      console.log(`📊 Found ${biomarkerValues.length} biomarker records for user: ${userId}`);
    } catch (dbError: any) {
      console.error("❌ Database error fetching biomarkers:", dbError);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: dbError.message,
      }, { status: 500 });
    }

    // Get body composition for metabolic calculations
    let bodyComposition = null;
    try {
      bodyComposition = await prisma.bodyCompositionResult.findFirst({
        where: { userId },
        orderBy: { testDate: "desc" },
      });
      console.log(`🏋️ Body composition data found: ${bodyComposition ? 'Yes' : 'No'}`);
    } catch (dbError) {
      console.warn("⚠️ Could not fetch body composition data:", dbError);
      bodyComposition = null;
    }

    // Get user profile
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { userId },
        select: {
          dateOfBirth: true,
          gender: true,
          height: true,
          weight: true,
        }
      });
      console.log(`👤 User profile found: ${user ? 'Yes' : 'No'}`);
    } catch (dbError) {
      console.warn("⚠️ Could not fetch user profile:", dbError);
      user = null;
    }

    if (biomarkerValues.length === 0) {
      return NextResponse.json({
        error: "No biomarker data available",
        message: "Upload blood test results to generate personalized sports nutrition recommendations"
      }, { status: 404 });
    }

    // Extract nutrition-relevant biomarkers
    const nutritionBiomarkers = biomarkerValues.filter(b => {
      const name = b.biomarkerName.toLowerCase();
      return (
        // Vitamin & Mineral Status
        name.includes('vitamin d') ||
        name.includes('vitamin b12') ||
        name.includes('folate') ||
        name.includes('b9') ||
        name.includes('iron') ||
        name.includes('ferritin') ||
        name.includes('transferrin') ||
        name.includes('magnesium') ||
        name.includes('zinc') ||
        name.includes('calcium') ||
        name.includes('phosphorus') ||
        
        // Metabolic Markers
        name.includes('glucose') ||
        name.includes('insulin') ||
        name.includes('hba1c') ||
        name.includes('lactate') ||
        name.includes('cpk') ||
        name.includes('ldh') ||
        
        // Protein Metabolism
        name.includes('albumin') ||
        name.includes('total protein') ||
        name.includes('urea') ||
        name.includes('creatinine') ||
        name.includes('bun') ||
        
        // Lipid Profile for Fat Metabolism
        name.includes('cholesterol') ||
        name.includes('hdl') ||
        name.includes('ldl') ||
        name.includes('triglycerides') ||
        
        // Hormone Optimization
        name.includes('testosterone') ||
        name.includes('growth hormone') ||
        name.includes('igf-1') ||
        name.includes('cortisol') ||
        name.includes('thyroid') ||
        name.includes('tsh') ||
        name.includes('t3') ||
        name.includes('t4') ||
        
        // Inflammatory & Recovery Markers
        name.includes('crp') ||
        name.includes('esr') ||
        name.includes('wbc') ||
        
        // Antioxidant Status
        name.includes('glutathione') ||
        name.includes('vitamin c') ||
        name.includes('vitamin e')
      );
    });

    console.log(`🥗 Found ${nutritionBiomarkers.length} nutrition-relevant biomarkers`);

    // Calculate user metrics
    const age = user?.dateOfBirth 
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const weight = bodyComposition?.totalWeight 
      ? parseFloat(bodyComposition.totalWeight.toString())
      : user?.weight 
        ? parseFloat(user.weight.toString())
        : null;

    const height = user?.height ? parseFloat(user.height.toString()) : null;
    const bmi = weight && height ? weight / Math.pow(height / 100, 2) : null;
    const bodyFat = bodyComposition?.bodyFatPercentage 
      ? parseFloat(bodyComposition.bodyFatPercentage.toString())
      : null;
    const leanMass = weight && bodyFat 
      ? weight * (1 - bodyFat / 100)
      : bodyComposition?.skeletalMuscleMass 
        ? parseFloat(bodyComposition.skeletalMuscleMass.toString()) * 1.4 // Estimate total lean mass
        : null;

    // Create comprehensive nutrition analysis prompt
    const nutritionPrompt = `You are an elite sports nutritionist and registered dietitian with expertise in performance optimization, supplement timing, and biomarker-based nutrition protocols. Analyze this athlete's profile and generate precise sports nutrition recommendations.

ATHLETE PROFILE:
- Age: ${age || 'Unknown'}
- Gender: ${user?.gender || 'Unknown'}
- Weight: ${weight || 'Unknown'} kg
- Height: ${height || 'Unknown'} cm
- BMI: ${bmi?.toFixed(1) || 'Unknown'}
- Body Fat: ${bodyFat || 'Unknown'}%
- Estimated Lean Mass: ${leanMass?.toFixed(1) || 'Unknown'} kg
- BMR: ${bodyComposition?.bmr || 'Unknown'} kcal/day

BIOMARKER ANALYSIS (${nutritionBiomarkers.length} markers):
${nutritionBiomarkers.map(b => 
  `- ${b.biomarkerName}: ${b.value}${b.unit} (${b.isAbnormal ? 'ABNORMAL' : 'NORMAL'}) [Ref: ${b.referenceRange || 'N/A'}]`
).join('\n')}

ANALYSIS REQUIREMENTS:
1. **MACRONUTRIENT OPTIMIZATION**: Calculate precise protein, carb, fat needs based on lean mass and performance goals
2. **MICRONUTRIENT ASSESSMENT**: Identify deficiencies and optimal ranges for performance
3. **SUPPLEMENT TIMING**: Provide specific timing, dosages, and synergistic combinations
4. **MEAL TIMING**: Optimize nutrient timing around training and recovery
5. **BIOMARKER MONITORING**: Recommend key markers to track progress
6. **PERFORMANCE ENHANCEMENT**: Focus on evidence-based sports nutrition strategies

Consider:
- Protein synthesis optimization (leucine threshold, timing)
- Glycogen replenishment strategies
- Anti-inflammatory nutrition protocols  
- Hormone optimization through nutrition
- Hydration and electrolyte balance
- Supplement quality and third-party testing
- Individual biomarker responses

FORMAT AS JSON:
{
  "overall_nutrition_score": 75,
  "deficiency_risk": "MODERATE",
  "performance_nutrition": {
    "pre_workout": ["Specific foods/supplements with timing"],
    "during_workout": ["Intra-workout nutrition recommendations"],
    "post_workout": ["Post-workout window optimization"],
    "daily_requirements": {
      "protein": "X.X g/kg body weight (XX-XX g daily)",
      "carbohydrates": "X.X g/kg body weight for training days",
      "fats": "X.X g/kg body weight (XX% of calories)",
      "calories": "XXXX-XXXX kcal/day based on training load"
    }
  },
  "supplement_recommendations": [
    {
      "name": "Supplement Name",
      "dosage": "Specific dosage with units",
      "timing": "When to take relative to meals/training",
      "purpose": "Why this supplement based on biomarkers",
      "priority": "ESSENTIAL/BENEFICIAL/OPTIONAL",
      "contraindications": ["Any warnings or conflicts"],
      "food_interactions": ["Foods to take with/avoid"],
      "biomarker_rationale": "Which biomarker indicated this need"
    }
  ],
  "meal_timing": {
    "breakfast": "Timing and composition recommendations",
    "pre_workout": "1-3 hours before training",
    "post_workout": "0-2 hours after training",  
    "lunch": "Midday meal optimization",
    "dinner": "Evening meal for recovery",
    "bedtime": "Pre-sleep nutrition for recovery"
  },
  "hydration_protocol": {
    "daily_intake": "XX-XX ml/kg body weight",
    "electrolyte_needs": "Sodium, potassium, magnesium requirements",
    "timing_recommendations": ["When to prioritize hydration"]
  },
  "biomarker_based_adjustments": ["Specific recommendations based on abnormal values"],
  "monitoring_biomarkers": ["Key markers to retest in 6-12 weeks"],
  "reassessment_timeline": "When to reassess and adjust protocol"
}`;

    // Call Claude AI for sports nutrition protocol
    let claudeResponse;
    try {
      console.log("🧠 Calling Claude AI for sports nutrition protocol generation...");
      claudeResponse = await callBedrockClaude(nutritionPrompt, {
        maxTokens: 4000,
        temperature: 0.3,
        modelId: "anthropic.claude-3-sonnet-20241022-v2:0"
      });
      console.log("✅ Claude AI response received");
    } catch (aiError: any) {
      console.error("❌ Claude AI call failed:", aiError);
      // Fall back to generating a basic nutrition protocol
      const nutritionProtocol = generateBasicNutritionProtocol(
        nutritionBiomarkers, 
        weight, 
        leanMass, 
        bodyComposition?.bmr || null,
        user?.gender || null
      );
      return NextResponse.json({
        success: true,
        userId,
        generatedAt: new Date().toISOString(),
        biomarkersAnalyzed: nutritionBiomarkers.length,
        nutritionProtocol,
        fallback: true,
        message: "Generated using fallback algorithm due to AI service unavailability",
        userProfile: {
          age,
          gender: user?.gender,
          weight,
          height,
          bmi: bmi?.toFixed(1),
          bodyFatPercentage: bodyFat,
          leanMass: leanMass?.toFixed(1),
          bmr: bodyComposition?.bmr,
        }
      });
    }

    let nutritionProtocol: NutritionProtocol;
    
    try {
      // Parse Claude's JSON response
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }
      nutritionProtocol = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", parseError);
      
      // Fallback: create basic nutrition protocol
      nutritionProtocol = generateBasicNutritionProtocol(
        nutritionBiomarkers, 
        weight, 
        leanMass, 
        bodyComposition?.bmr || null,
        user?.gender || null
      );
    }

    console.log(`✅ Sports nutrition protocol generated for user: ${userId}`);

    return NextResponse.json({
      success: true,
      userId,
      generatedAt: new Date().toISOString(),
      biomarkersAnalyzed: nutritionBiomarkers.length,
      nutritionProtocol,
      userProfile: {
        age,
        gender: user?.gender,
        weight,
        height,
        bmi: bmi?.toFixed(1),
        bodyFatPercentage: bodyFat,
        leanMass: leanMass?.toFixed(1),
        bmr: bodyComposition?.bmr,
      }
    });

  } catch (error: any) {
    console.error("❌ Error generating sports nutrition protocol:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate sports nutrition protocol",
      details: error.message,
    }, { status: 500 });
  }
}

// Fallback function for basic nutrition protocol
function generateBasicNutritionProtocol(
  biomarkers: any[], 
  weight: number | null, 
  leanMass: number | null,
  bmr: number | null,
  gender: string | null
): NutritionProtocol {
  const deficientMarkers = biomarkers.filter(b => b.isAbnormal).length;
  const nutritionScore = Math.max(30, 100 - (deficientMarkers * 8));
  
  let deficiencyRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (deficientMarkers > 4) deficiencyRisk = "CRITICAL";
  else if (deficientMarkers > 2) deficiencyRisk = "HIGH";
  else if (deficientMarkers > 0) deficiencyRisk = "MODERATE";

  // Basic macronutrient calculations
  const proteinPerKg = weight ? (2.0) : 1.8; // g/kg for athletes
  const dailyProtein = weight ? Math.round(weight * proteinPerKg) : 140;
  const dailyCarbs = weight ? Math.round(weight * 6) : 400; // 6g/kg for training days
  const dailyFat = weight ? Math.round(weight * 1.2) : 80; // 1.2g/kg
  const estimatedCalories = bmr ? Math.round(bmr * 1.6) : 2500; // Activity factor

  // Generate basic supplement recommendations based on common deficiencies
  const basicSupplements: SupplementRecommendation[] = [
    {
      name: "Whey Protein Isolate",
      dosage: "25-30g",
      timing: "Within 30 minutes post-workout",
      purpose: "Muscle protein synthesis optimization",
      priority: "ESSENTIAL",
      contraindications: ["Lactose intolerance"],
      food_interactions: ["Take with simple carbs post-workout"],
      biomarker_rationale: "Support lean mass maintenance and recovery"
    },
    {
      name: "Creatine Monohydrate", 
      dosage: "5g daily",
      timing: "Any time, preferably post-workout",
      purpose: "Power output and muscle volume",
      priority: "BENEFICIAL",
      contraindications: ["Kidney disease"],
      food_interactions: ["Take with carbohydrates for better uptake"],
      biomarker_rationale: "Enhanced ATP regeneration for performance"
    },
    {
      name: "Vitamin D3",
      dosage: "2000-4000 IU",
      timing: "With fat-containing meal",
      purpose: "Bone health, immune function, hormone production",
      priority: "ESSENTIAL",
      contraindications: ["Hypercalcemia"],
      food_interactions: ["Take with dietary fats for absorption"],
      biomarker_rationale: "Most athletes are deficient, critical for performance"
    }
  ];

  // Add deficiency-specific supplements
  biomarkers.forEach(b => {
    const name = b.biomarkerName.toLowerCase();
    if (b.isAbnormal) {
      if (name.includes('iron') || name.includes('ferritin')) {
        basicSupplements.push({
          name: "Iron Bisglycinate",
          dosage: "18-25mg",
          timing: "Empty stomach, 1 hour before meals",
          purpose: "Correct iron deficiency for oxygen transport",
          priority: "ESSENTIAL",
          contraindications: ["Hemochromatosis"],
          food_interactions: ["Avoid with calcium, coffee, tea"],
          biomarker_rationale: `Low ${b.biomarkerName}: ${b.value}${b.unit}`
        });
      }
      
      if (name.includes('magnesium')) {
        basicSupplements.push({
          name: "Magnesium Glycinate",
          dosage: "300-400mg",
          timing: "30 minutes before bed",
          purpose: "Muscle recovery, sleep quality, enzyme function",
          priority: "BENEFICIAL",
          contraindications: ["Kidney disease"],
          food_interactions: ["Better absorbed away from fiber"],
          biomarker_rationale: `Suboptimal ${b.biomarkerName}: ${b.value}${b.unit}`
        });
      }
    }
  });

  return {
    overall_nutrition_score: Math.round(nutritionScore),
    deficiency_risk: deficiencyRisk,
    performance_nutrition: {
      pre_workout: [
        "30-60g carbohydrates 1-2 hours before training",
        "Caffeine: 3-6mg/kg body weight 30-45 minutes before",
        "Optional: 5-10g BCAA if training fasted"
      ],
      during_workout: [
        "Water for sessions <60 minutes",
        "Sports drink with 30-60g carbs/hour for sessions >90 minutes", 
        "Electrolytes if sweating heavily (200-300mg sodium/hour)"
      ],
      post_workout: [
        "25-30g high-quality protein within 30 minutes",
        "1-1.5g carbohydrates per kg body weight within 2 hours",
        "Rehydrate with 1.5L fluid per kg body weight lost"
      ],
      daily_requirements: {
        protein: `${proteinPerKg}g/kg body weight (${dailyProtein}g daily)`,
        carbohydrates: `5-7g/kg body weight for training days (${dailyCarbs}g)`,
        fats: `1.2g/kg body weight (${dailyFat}g, ~25-30% calories)`,
        calories: `${estimatedCalories - 200}-${estimatedCalories + 200} kcal/day`
      }
    },
    supplement_recommendations: basicSupplements,
    meal_timing: {
      breakfast: "High protein (25-30g), moderate carbs within 2 hours of waking",
      pre_workout: "Carb-focused meal 2-3 hours before, light snack 30-60 min before",
      post_workout: "Protein + carbs within 30-60 minutes (anabolic window)",
      lunch: "Balanced macros, include vegetables and quality protein source",
      dinner: "Moderate portions, emphasize protein and vegetables for recovery",
      bedtime: "20-30g casein protein or Greek yogurt if needed for recovery"
    },
    hydration_protocol: {
      daily_intake: weight ? `${Math.round(weight * 35)}-${Math.round(weight * 40)}ml/day` : "2.5-3.5L/day",
      electrolyte_needs: "Sodium 200-300mg/hour during exercise, potassium 150-300mg, magnesium 50-100mg",
      timing_recommendations: [
        "500-600ml 2-3 hours before exercise",
        "200-300ml 10-20 minutes before exercise", 
        "150-250ml every 15-20 minutes during exercise",
        "1.5L per kg body weight lost post-exercise"
      ]
    },
    biomarker_based_adjustments: biomarkers
      .filter(b => b.isAbnormal)
      .slice(0, 5)
      .map(b => `Address ${b.biomarkerName} deficiency through targeted nutrition and supplementation`),
    monitoring_biomarkers: [
      "Vitamin D", "Iron/Ferritin", "Vitamin B12", "Magnesium", "Inflammatory markers (CRP)",
      "Testosterone (if male)", "Thyroid panel", "Complete metabolic panel"
    ],
    reassessment_timeline: deficiencyRisk === "HIGH" || deficiencyRisk === "CRITICAL" 
      ? "6-8 weeks for deficiency correction, then quarterly"
      : "12 weeks initially, then every 6 months"
  };
}