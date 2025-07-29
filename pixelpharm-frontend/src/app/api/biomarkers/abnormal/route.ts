import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/database/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    
    // Try to get session first
    const session = await getServerSession(authOptions);
    
    // Use session user ID if available, otherwise fall back to URL parameter
    let userId = session?.user?.id || userIdParam;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log("🔬 Fetching abnormal biomarkers for userId:", userId);

    // Get abnormal biomarkers
    const abnormalBiomarkers = await prisma.biomarkerValue.findMany({
      where: { 
        userId,
        isAbnormal: true 
      },
      orderBy: [
        { testDate: "desc" },
        { biomarkerName: "asc" }
      ],
      take: 50,
    });

    // Determine critical status based on biomarker name and value ranges
    // Since we don't have isCritical field, we'll classify based on severity
    const determineIfCritical = (name: string, value: number): boolean => {
      const biomarkerName = name.toLowerCase();
      
      // Basic critical thresholds (these would ideally come from a reference table)
      if (biomarkerName.includes('glucose') && (value > 300 || value < 40)) return true;
      if (biomarkerName.includes('cholesterol') && value > 300) return true;
      if (biomarkerName.includes('ldl') && value > 250) return true;
      if (biomarkerName.includes('triglyceride') && value > 500) return true;
      if (biomarkerName.includes('creatinine') && value > 3.0) return true;
      if (biomarkerName.includes('hemoglobin') && (value < 7.0 || value > 20.0)) return true;
      
      return false; // Default to non-critical
    };

    // Transform to expected format with additional metadata
    const abnormalResults = abnormalBiomarkers.map((bv) => {
      const value = parseFloat(bv.value.toString());
      const isCritical = determineIfCritical(bv.biomarkerName, value);
      
      return {
        name: bv.biomarkerName,
        value: value,
        unit: bv.unit || "",
        referenceRange: bv.referenceRange || "N/A",
        testDate: bv.testDate.toISOString(),
        isAbnormal: bv.isAbnormal,
        isCritical: isCritical,
        severity: isCritical ? "CRITICAL" : "ABNORMAL",
        category: getCategoryFromBiomarkerName(bv.biomarkerName),
        recommendations: getRecommendationsForBiomarker(bv.biomarkerName, isCritical)
      };
    });

    // Separate critical and non-critical results
    const criticalResults = abnormalResults.filter(r => r.isCritical);
    const nonCriticalResults = abnormalResults.filter(r => !r.isCritical);

    return NextResponse.json({
      abnormalBiomarkers: nonCriticalResults,
      criticalBiomarkers: criticalResults,
      summary: {
        totalAbnormal: nonCriticalResults.length,
        totalCritical: criticalResults.length,
        lastTestDate: abnormalBiomarkers.length > 0 ? abnormalBiomarkers[0].testDate : null
      },
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching abnormal biomarkers:", error);
    return NextResponse.json(
      { error: "Failed to fetch abnormal biomarkers" },
      { status: 500 }
    );
  }
}

// Helper function to categorize biomarkers
function getCategoryFromBiomarkerName(name: string): string {
  const biomarkerName = name.toLowerCase();
  
  if (biomarkerName.includes('cholesterol') || biomarkerName.includes('ldl') || biomarkerName.includes('hdl') || biomarkerName.includes('triglyceride')) {
    return 'Lipid Panel';
  }
  if (biomarkerName.includes('glucose') || biomarkerName.includes('hba1c') || biomarkerName.includes('insulin')) {
    return 'Metabolic';
  }
  if (biomarkerName.includes('tsh') || biomarkerName.includes('t3') || biomarkerName.includes('t4')) {
    return 'Thyroid';
  }
  if (biomarkerName.includes('vitamin') || biomarkerName.includes('b12') || biomarkerName.includes('folate')) {
    return 'Vitamins';
  }
  if (biomarkerName.includes('hemoglobin') || biomarkerName.includes('hematocrit') || biomarkerName.includes('wbc') || biomarkerName.includes('rbc')) {
    return 'Complete Blood Count';
  }
  if (biomarkerName.includes('alt') || biomarkerName.includes('ast') || biomarkerName.includes('bilirubin')) {
    return 'Liver Function';
  }
  if (biomarkerName.includes('creatinine') || biomarkerName.includes('bun') || biomarkerName.includes('egfr')) {
    return 'Kidney Function';
  }
  if (biomarkerName.includes('crp') || biomarkerName.includes('esr')) {
    return 'Inflammation';
  }
  
  return 'Other';
}

// Helper function to provide basic recommendations
function getRecommendationsForBiomarker(name: string, isCritical: boolean): string[] {
  const biomarkerName = name.toLowerCase();
  const urgency = isCritical ? "urgent" : "routine";
  
  if (biomarkerName.includes('cholesterol') || biomarkerName.includes('ldl')) {
    return [
      `${isCritical ? 'Immediately' : 'Soon'} consult with your doctor about cardiovascular risk`,
      'Consider dietary changes - reduce saturated fats',
      'Discuss statin therapy if appropriate'
    ];
  }
  if (biomarkerName.includes('glucose') || biomarkerName.includes('hba1c')) {
    return [
      `${isCritical ? 'Urgent' : 'Prompt'} follow-up with physician for diabetes screening`,
      'Monitor blood sugar levels more frequently',
      'Consider dietary consultation'
    ];
  }
  if (biomarkerName.includes('tsh')) {
    return [
      `${isCritical ? 'Urgent' : 'Timely'} endocrinology consultation recommended`,
      'Monitor thyroid function closely',
      'Discuss thyroid hormone replacement if needed'
    ];
  }
  
  return [
    `Follow up with your healthcare provider for ${urgency} evaluation`,
    'Discuss this result in context of your overall health',
    'Consider retesting to confirm results'
  ];
}