// File: src/app/api/health/recovery-protocol/route.ts
// Recovery Protocol API using HRV & Inflammatory Markers

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";
import { callBedrockClaude } from "@/lib/aws/bedrock";

interface RecoveryProtocol {
  overallRecoveryScore: number; // 0-100
  stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sleepRecommendation: string;
  exerciseRecommendation: string;
  nutritionProtocol: string[];
  supplementProtocol: string[];
  hrv_analysis: {
    estimated_hrv_status: string;
    recovery_indicators: string[];
  };
  inflammatory_analysis: {
    inflammation_level: string;
    recovery_timeline: string;
    risk_factors: string[];
  };
  actionable_steps: string[];
  monitoring_frequency: string;
  red_flags: string[];
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

    console.log(`🔄 Generating recovery protocol for user: ${userId}`);

    // Get latest biomarker data
    const biomarkerValues = await prisma.biomarkerValue.findMany({
      where: { userId },
      orderBy: { testDate: "desc" },
      take: 50, // Get recent values
    });

    // Get latest body composition for metabolic status
    const bodyComposition = await prisma.bodyCompositionResult.findFirst({
      where: { userId },
      orderBy: { testDate: "desc" },
    });

    // Get user profile for personalization
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        dateOfBirth: true,
        gender: true,
        height: true,
        weight: true,
      }
    });

    if (biomarkerValues.length === 0) {
      return NextResponse.json({
        error: "No biomarker data available",
        message: "Upload blood test results to generate personalized recovery protocols"
      }, { status: 404 });
    }

    // Extract relevant biomarkers for recovery analysis
    const relevantBiomarkers = biomarkerValues.filter(b => {
      const name = b.biomarkerName.toLowerCase();
      return (
        // Inflammatory markers
        name.includes('crp') || 
        name.includes('c-reactive') ||
        name.includes('esr') ||
        name.includes('il-6') ||
        name.includes('tnf') ||
        name.includes('wbc') ||
        name.includes('neutrophil') ||
        name.includes('lymphocyte') ||
        
        // Stress/HRV related markers
        name.includes('cortisol') ||
        name.includes('dhea') ||
        name.includes('testosterone') ||
        name.includes('estrogen') ||
        name.includes('progesterone') ||
        
        // Recovery-related markers
        name.includes('magnesium') ||
        name.includes('vitamin d') ||
        name.includes('b12') ||
        name.includes('iron') ||
        name.includes('ferritin') ||
        name.includes('glucose') ||
        name.includes('lactate') ||
        name.includes('cpk') ||
        name.includes('creatinine') ||
        name.includes('urea') ||
        
        // Antioxidant markers
        name.includes('glutathione') ||
        name.includes('vitamin c') ||
        name.includes('vitamin e')
      );
    });

    console.log(`🔄 Found ${relevantBiomarkers.length} relevant biomarkers for recovery analysis`);

    // Calculate basic user stats
    const age = user?.dateOfBirth 
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const bmi = user?.height && bodyComposition?.totalWeight
      ? parseFloat((parseFloat(bodyComposition.totalWeight.toString()) / 
          Math.pow(parseFloat(user.height.toString()) / 100, 2)).toFixed(1))
      : null;

    // Create comprehensive prompt for Claude analysis
    const recoveryPrompt = `You are an elite sports recovery specialist with expertise in HRV analysis, inflammatory markers, and performance optimization. Analyze this athlete's biomarker profile and generate a comprehensive recovery protocol.

ATHLETE PROFILE:
- Age: ${age || 'Unknown'}
- Gender: ${user?.gender || 'Unknown'}
- BMI: ${bmi || 'Unknown'}
- Body Fat: ${bodyComposition?.bodyFatPercentage || 'Unknown'}%
- Muscle Mass: ${bodyComposition?.skeletalMuscleMass || 'Unknown'} kg

BIOMARKER DATA (${relevantBiomarkers.length} markers analyzed):
${relevantBiomarkers.map(b => 
  `- ${b.biomarkerName}: ${b.value}${b.unit} (${b.isAbnormal ? 'ABNORMAL' : 'NORMAL'}) [Ref: ${b.referenceRange || 'N/A'}]`
).join('\n')}

ANALYSIS REQUIREMENTS:
1. **HRV ESTIMATION**: Based on stress markers (cortisol, inflammatory markers), estimate HRV status and autonomic nervous system balance
2. **INFLAMMATORY LOAD**: Assess systemic inflammation using available markers (CRP, WBC, ESR, etc.)
3. **RECOVERY CAPACITY**: Evaluate muscle recovery markers (CPK, lactate, creatinine)
4. **HORMONAL STATUS**: Assess stress hormones and recovery hormones
5. **NUTRITIONAL STATUS**: Check recovery-supporting nutrients (Mg, Vit D, B12, iron)

Generate a comprehensive recovery protocol addressing:
- Sleep optimization strategies
- Training load recommendations
- Anti-inflammatory nutrition protocols
- Targeted supplementation
- Stress management techniques
- Recovery monitoring frequency

FORMAT AS JSON:
{
  "overallRecoveryScore": 85,
  "stressLevel": "MODERATE",
  "sleepRecommendation": "Detailed sleep protocol...",
  "exerciseRecommendation": "Training modifications...", 
  "nutritionProtocol": ["Anti-inflammatory foods", "Timing recommendations"],
  "supplementProtocol": ["Specific supplements with dosages"],
  "hrv_analysis": {
    "estimated_hrv_status": "Based on biomarkers...",
    "recovery_indicators": ["Positive indicators", "Areas of concern"]
  },
  "inflammatory_analysis": {
    "inflammation_level": "LOW/MODERATE/HIGH",
    "recovery_timeline": "Expected recovery timeframe",
    "risk_factors": ["Inflammatory risk factors identified"]
  },
  "actionable_steps": ["Immediate actions", "Week 1-2 focus", "Long-term goals"],
  "monitoring_frequency": "How often to reassess",
  "red_flags": ["Warning signs to watch for"]
}`;

    // Call Claude AI for recovery protocol generation
    const claudeResponse = await callBedrockClaude(recoveryPrompt, {
      maxTokens: 4000,
      temperature: 0.3,
      modelId: "anthropic.claude-3-haiku-20240307-v1:0"
    });

    let recoveryProtocol: RecoveryProtocol;
    
    try {
      // Parse Claude's JSON response
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }
      recoveryProtocol = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", parseError);
      
      // Fallback: create basic recovery protocol based on biomarker analysis
      recoveryProtocol = generateBasicRecoveryProtocol(relevantBiomarkers, age, bmi);
    }

    console.log(`✅ Recovery protocol generated for user: ${userId}`);

    return NextResponse.json({
      success: true,
      userId,
      generatedAt: new Date().toISOString(),
      dataPoints: relevantBiomarkers.length,
      recoveryProtocol,
      userProfile: {
        age,
        gender: user?.gender,
        bmi,
        bodyFatPercentage: bodyComposition?.bodyFatPercentage,
        muscleMass: bodyComposition?.skeletalMuscleMass,
      }
    });

  } catch (error: any) {
    console.error("❌ Error generating recovery protocol:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate recovery protocol",
      details: error.message,
    }, { status: 500 });
  }
}

// Fallback function for basic recovery protocol
function generateBasicRecoveryProtocol(biomarkers: any[], age: number | null, bmi: number | null): RecoveryProtocol {
  const abnormalCount = biomarkers.filter(b => b.isAbnormal).length;
  const totalMarkers = biomarkers.length;
  
  // Calculate basic recovery score
  const baseScore = Math.max(20, 100 - (abnormalCount * 10));
  const ageAdjustment = age ? Math.max(0, (50 - age) / 50 * 10) : 0;
  const bmiAdjustment = bmi && bmi >= 18.5 && bmi <= 25 ? 5 : 0;
  
  const recoveryScore = Math.min(100, baseScore + ageAdjustment + bmiAdjustment);
  
  let stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (abnormalCount > 5) stressLevel = "CRITICAL";
  else if (abnormalCount > 3) stressLevel = "HIGH";
  else if (abnormalCount > 1) stressLevel = "MODERATE";
  
  return {
    overallRecoveryScore: Math.round(recoveryScore),
    stressLevel,
    sleepRecommendation: "Aim for 7-9 hours of quality sleep with consistent bedtime routine. Consider sleep tracking to optimize recovery phases.",
    exerciseRecommendation: stressLevel === "HIGH" || stressLevel === "CRITICAL" 
      ? "Reduce training intensity by 20-30%. Focus on low-intensity recovery activities like walking, swimming, or yoga."
      : "Maintain current training load with proper periodization. Include 2-3 recovery days per week.",
    nutritionProtocol: [
      "Anti-inflammatory foods: fatty fish, leafy greens, berries, turmeric",
      "Timing: Consume protein within 30 minutes post-workout",
      "Hydration: 35-40ml per kg body weight daily",
      "Avoid processed foods and excessive caffeine"
    ],
    supplementProtocol: [
      "Magnesium: 300-400mg before bed for muscle recovery",
      "Vitamin D3: 2000-4000 IU daily if deficient",
      "Omega-3: 1-2g EPA/DHA daily for inflammation",
      "Zinc: 15-30mg daily for immune function"
    ],
    hrv_analysis: {
      estimated_hrv_status: totalMarkers > 0 
        ? "Estimated moderate HRV based on available stress and inflammatory markers"
        : "Insufficient data for HRV estimation",
      recovery_indicators: [
        abnormalCount < 2 ? "Good biomarker profile supports recovery" : "Multiple abnormal markers suggest compromised recovery",
        "Consider HRV monitoring device for real-time feedback"
      ]
    },
    inflammatory_analysis: {
      inflammation_level: abnormalCount > 3 ? "MODERATE" : "LOW",
      recovery_timeline: stressLevel === "HIGH" ? "2-4 weeks with protocol adherence" : "1-2 weeks",
      risk_factors: biomarkers
        .filter(b => b.isAbnormal)
        .slice(0, 3)
        .map(b => `Elevated ${b.biomarkerName}`)
    },
    actionable_steps: [
      "Implement stress management techniques (meditation, breathing exercises)",
      "Optimize sleep environment and routine",
      "Focus on anti-inflammatory nutrition for 2 weeks",
      "Monitor energy levels and adjust training accordingly"
    ],
    monitoring_frequency: stressLevel === "HIGH" || stressLevel === "CRITICAL" 
      ? "Weekly assessment for 4 weeks, then bi-weekly" 
      : "Bi-weekly for 6 weeks",
    red_flags: [
      "Persistent fatigue despite adequate rest",
      "Declining performance with normal training load",
      "Frequent minor injuries or illnesses",
      "Disrupted sleep patterns for >1 week"
    ]
  };
}