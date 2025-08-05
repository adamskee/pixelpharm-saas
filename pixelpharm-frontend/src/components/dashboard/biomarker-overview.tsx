// File: src/components/dashboard/biomarker-overview.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Loader2,
  RefreshCw,
  Upload,
  BarChart3,
  Target,
  Info,
  Heart,
  Brain,
  Zap,
  Shield,
  Droplets,
} from "lucide-react";
import Link from "next/link";

interface BiomarkerData {
  valueId: string;
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  testDate: string;
}

interface BiomarkerInfo {
  scientificInsight: string;
  normalRange: string;
  highImplications: string;
  lowImplications: string;
  nearHighAdvice: string;
  nearLowAdvice: string;
  category: string;
}

interface BiomarkerOverviewProps {
  medicalReview: any;
  user: any;
}

const biomarkerDatabase: Record<string, BiomarkerInfo> = {
  "Glucose": {
    scientificInsight: "Glucose levels exhibit circadian rhythm and can increase with age due to declining insulin sensitivity. Post-meal spikes >180 mg/dL indicate early metabolic dysfunction.",
    normalRange: "70-100 mg/dL (fasting)",
    highImplications: "May indicate diabetes, prediabetes, or insulin resistance",
    lowImplications: "May indicate hypoglycemia, liver disease, or medication effects",
    nearHighAdvice: "Consider reducing refined carbohydrates, increasing fiber intake, and adding post-meal walks to improve glucose metabolism.",
    nearLowAdvice: "Ensure regular meal timing and consider protein-rich snacks to maintain stable blood sugar levels.",
    category: "Metabolic"
  },
  "Hemoglobin A1c": {
    scientificInsight: "A1c reflects glycation of hemoglobin over RBC lifespan (~120 days). Each 1% increase correlates with ~30 mg/dL average glucose increase. Values naturally increase 0.1% per decade after age 30.",
    normalRange: "<5.7%",
    highImplications: "Indicates poor blood sugar control, increased diabetes complications risk",
    lowImplications: "Generally not concerning, may indicate excellent glucose control",
    nearHighAdvice: "Focus on consistent carbohydrate counting, regular exercise, and consider continuous glucose monitoring to prevent progression to diabetes.",
    nearLowAdvice: "Maintain current lifestyle habits that support excellent glucose control - you're doing great!",
    category: "Metabolic"
  },
  "Total Cholesterol": {
    scientificInsight: "Cholesterol increases ~2 mg/dL per year with age. 80% is endogenously produced by the liver, making dietary cholesterol less impactful than previously thought. Genetic variants affect synthesis rates significantly.",
    normalRange: "<200 mg/dL",
    highImplications: "Increased risk of heart disease and stroke",
    lowImplications: "Generally favorable, but extremely low levels may indicate malnutrition",
    nearHighAdvice: "Focus on soluble fiber (oats, beans), plant sterols, and regular aerobic exercise to naturally lower cholesterol production.",
    nearLowAdvice: "Continue heart-healthy habits while ensuring adequate protein intake for optimal hormone production.",
    category: "Lipid Panel"
  },
  "HDL Cholesterol": {
    scientificInsight: "HDL functionality matters more than quantity - particle size and efflux capacity are key. Exercise increases HDL by 5-15%, while smoking reduces it by 10-15%. Genetic variants strongly influence baseline levels.",
    normalRange: ">40 mg/dL (men), >50 mg/dL (women)",
    highImplications: "Protective against heart disease - this is good!",
    lowImplications: "Increased risk of heart disease and metabolic syndrome",
    nearHighAdvice: "Maintain current exercise routine and consider omega-3 supplements to optimize HDL particle function.",
    nearLowAdvice: "Increase moderate-intensity exercise, reduce refined sugars, and consider niacin-rich foods to boost HDL levels.",
    category: "Lipid Panel"
  },
  "LDL Cholesterol": {
    scientificInsight: "Small, dense LDL particles are more atherogenic than large, buoyant ones. Pattern B (small dense) correlates with insulin resistance. LDL particle number (apoB) is more predictive than LDL-C levels.",
    normalRange: "<100 mg/dL",
    highImplications: "Increased risk of atherosclerosis, heart attack, and stroke",
    lowImplications: "Generally favorable for cardiovascular health",
    nearHighAdvice: "Reduce saturated fat intake, increase soluble fiber, and consider advanced lipid testing to assess particle size and number.",
    nearLowAdvice: "Excellent LDL control - maintain current diet and exercise patterns to preserve cardiovascular health.",
    category: "Lipid Panel"
  },
  "Triglycerides": {
    scientificInsight: "Triglycerides are highly responsive to dietary carbohydrates and correlate strongly with insulin resistance. They increase rapidly with fructose intake and decrease with omega-3 fatty acids.",
    normalRange: "<150 mg/dL",
    highImplications: "Increased risk of heart disease and pancreatitis",
    lowImplications: "Generally not concerning, may indicate good metabolic health",
    nearHighAdvice: "Limit refined carbohydrates and added sugars, increase omega-3 rich fish, and consider intermittent fasting to improve triglyceride clearance.",
    nearLowAdvice: "Great metabolic health indicator - continue current dietary patterns that support low triglyceride levels.",
    category: "Lipid Panel"
  },
  "TSH": {
    scientificInsight: "TSH exhibits circadian rhythm with peak at 2-4 AM. Levels increase with age and stress. Subclinical hypothyroidism (4.5-10 mIU/L) affects 4-20% of adults and may impact cognition and metabolism.",
    normalRange: "0.4-4.0 mIU/L",
    highImplications: "May indicate hypothyroidism (underactive thyroid)",
    lowImplications: "May indicate hyperthyroidism (overactive thyroid)",
    nearHighAdvice: "Monitor energy levels and weight changes. Consider selenium, zinc, and tyrosine-rich foods to support thyroid function. Avoid excessive soy intake.",
    nearLowAdvice: "Watch for hyperthyroid symptoms like rapid heartbeat or weight loss. Ensure adequate iodine but avoid excess supplementation.",
    category: "Thyroid"
  },
  "Creatinine": {
    scientificInsight: "Creatinine correlates directly with muscle mass and increases ~0.01 mg/dL per decade due to age-related muscle loss. Athletic individuals typically have higher baseline levels due to increased muscle mass.",
    normalRange: "0.6-1.2 mg/dL",
    highImplications: "May indicate kidney disease or dehydration",
    lowImplications: "May indicate low muscle mass or liver disease",
    nearHighAdvice: "Ensure adequate hydration, limit NSAIDs use, and monitor blood pressure. Consider reducing protein intake temporarily if levels continue rising.",
    nearLowAdvice: "May indicate low muscle mass - consider resistance training and adequate protein intake to maintain muscle health.",
    category: "Kidney Function"
  },
  "BUN": {
    scientificInsight: "BUN/Creatinine ratio >20:1 suggests dehydration or high protein catabolism, while <10:1 may indicate liver dysfunction. BUN is more variable than creatinine due to dietary protein influence.",
    normalRange: "7-20 mg/dL",
    highImplications: "May indicate kidney disease, dehydration, or high protein diet",
    lowImplications: "May indicate liver disease or low protein diet",
    nearHighAdvice: "Increase water intake and consider moderating protein intake if very high. Monitor alongside creatinine for kidney function assessment.",
    nearLowAdvice: "Ensure adequate protein intake for muscle maintenance and metabolic function - aim for 0.8-1.2g per kg body weight.",
    category: "Kidney Function"
  },
  "ALT": {
    scientificInsight: "ALT is more liver-specific than AST and correlates with non-alcoholic fatty liver disease (NAFLD). Even mild elevations (30-40 U/L) may indicate early metabolic dysfunction in the absence of other causes.",
    normalRange: "7-56 U/L",
    highImplications: "May indicate liver damage, hepatitis, or medication toxicity",
    lowImplications: "Generally not concerning, may indicate healthy liver function",
    nearHighAdvice: "Reduce alcohol intake, limit processed foods, and increase antioxidant-rich vegetables. Consider milk thistle and omega-3 supplements for liver support.",
    nearLowAdvice: "Excellent liver function - maintain current healthy lifestyle to preserve optimal hepatic metabolism.",
    category: "Liver Function"
  },
  "AST": {
    scientificInsight: "AST/ALT ratio >2.0 suggests alcoholic liver disease, while <1.0 indicates NAFLD. AST is also found in cardiac and skeletal muscle, making it less liver-specific than ALT.",
    normalRange: "10-40 U/L",
    highImplications: "May indicate liver damage, heart attack, or muscle injury",
    lowImplications: "Generally not concerning, indicates healthy tissue function",
    nearHighAdvice: "Assess recent exercise intensity and alcohol consumption. Consider liver-protective foods like cruciferous vegetables and green tea.",
    nearLowAdvice: "Good tissue health marker - continue current activities that support cellular integrity and metabolic function.",
    category: "Liver Function"
  },
  "WBC": {
    scientificInsight: "WBC count varies with circadian rhythm (lowest at night) and decreases ~2% per decade after age 20. Chronic stress and poor sleep can elevate baseline levels through cortisol effects.",
    normalRange: "4.5-11.0 K/uL",
    highImplications: "May indicate infection, inflammation, or blood disorders",
    lowImplications: "May indicate immune suppression or bone marrow problems",
    nearHighAdvice: "Ensure adequate sleep, manage stress levels, and consider anti-inflammatory foods like turmeric and omega-3s to support immune balance.",
    nearLowAdvice: "Monitor for signs of infection. Support immune function with vitamin D, zinc, and adequate protein intake.",
    category: "Complete Blood Count"
  },
  "RBC": {
    scientificInsight: "RBC production requires 120 days and is stimulated by erythropoietin from kidneys. High altitude living increases RBC count by 10-15%. Dehydration can artificially elevate counts.",
    normalRange: "4.7-6.1 M/uL (men), 4.2-5.4 M/uL (women)",
    highImplications: "May indicate dehydration, lung disease, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or nutritional deficiencies",
    nearHighAdvice: "Ensure proper hydration and assess for sleep apnea or lung function issues that might stimulate RBC production.",
    nearLowAdvice: "Check iron, B12, and folate levels. Increase iron-rich foods and vitamin C to enhance absorption.",
    category: "Complete Blood Count"
  },
  "Hemoglobin": {
    scientificInsight: "Hemoglobin A1c glycation occurs at 0.1% per 1 mg/dL glucose increase. Iron deficiency affects hemoglobin synthesis before RBC count drops. Athletes often have slightly lower levels due to plasma volume expansion.",
    normalRange: "14-18 g/dL (men), 12-16 g/dL (women)",
    highImplications: "May indicate dehydration, smoking, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or chronic disease",
    nearHighAdvice: "Assess hydration status and smoking history. Consider blood donation if levels remain elevated without underlying cause.",
    nearLowAdvice: "Increase iron-rich foods (heme iron from meat, non-heme from plants), pair with vitamin C, and check for hidden blood loss sources.",
    category: "Complete Blood Count"
  },
  "Hematocrit": {
    scientificInsight: "Hematocrit typically equals hemoglobin × 3 in healthy individuals. Values >50% increase blood viscosity and thrombosis risk. Endurance athletes may have lower values due to plasma volume expansion.",
    normalRange: "42-52% (men), 37-47% (women)",
    highImplications: "May indicate dehydration, lung disease, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or overhydration",
    nearHighAdvice: "Monitor hydration status and blood pressure. Consider cardiovascular assessment if persistently elevated without dehydration.",
    nearLowAdvice: "Address potential iron deficiency and assess for chronic blood loss. Increase iron bioavailability with vitamin C.",
    category: "Complete Blood Count"
  },
  "Platelets": {
    scientificInsight: "Platelet lifespan is 8-10 days with 30% residing in the spleen. Reactive thrombocytosis often occurs with inflammation or iron deficiency. Exercise can transiently increase platelet count by 25%.",
    normalRange: "150-450 K/uL",
    highImplications: "May indicate blood disorders or increased clotting risk",
    lowImplications: "May indicate bleeding risk, bone marrow problems, or medication effects",
    nearHighAdvice: "Assess for inflammatory conditions or iron deficiency. Consider low-dose aspirin if cardiovascular risk factors present (consult physician).",
    nearLowAdvice: "Monitor for easy bruising or bleeding. Avoid NSAIDs and ensure adequate B12 and folate for platelet production.",
    category: "Complete Blood Count"
  },
  "Vitamin D": {
    scientificInsight: "Vitamin D levels drop 1-2 ng/mL per decade after age 40. 90% comes from UVB skin synthesis, requiring 20-30 minutes daily sun exposure. Dark skin requires 3-5x longer UV exposure for equivalent synthesis.",
    normalRange: "30-100 ng/mL",
    highImplications: "Rarely toxic, but extremely high levels may cause hypercalcemia",
    lowImplications: "May indicate deficiency leading to bone problems and immune dysfunction",
    nearHighAdvice: "Reduce supplementation if taking high doses. Monitor calcium levels and ensure adequate K2 for proper calcium utilization.",
    nearLowAdvice: "Increase sun exposure, consider 2000-4000 IU daily supplementation, and include fatty fish in diet for natural vitamin D sources.",
    category: "Vitamins"
  },
  "25-hydroxy Vitamin D": {
    scientificInsight: "25(OH)D is the storage form and best indicator of vitamin D status. Levels <50 nmol/L (20 ng/mL) indicate deficiency, while 75-125 nmol/L (30-50 ng/mL) is optimal. Winter levels drop 10-25% due to reduced UV exposure.",
    normalRange: "75-125 nmol/L",
    highImplications: "Levels >375 nmol/L may cause hypercalcemia and kidney stones",
    lowImplications: "Deficiency increases fracture risk, immune dysfunction, and may affect mood and muscle strength",
    nearHighAdvice: "Excellent vitamin D status - maintain current sun exposure and supplementation routine while monitoring calcium levels.",
    nearLowAdvice: "Consider increasing vitamin D3 supplementation to 2000-4000 IU daily, especially during winter months, and increase sun exposure when possible.",
    category: "Vitamins"
  },
  "Vitamin B12": {
    scientificInsight: "B12 absorption requires intrinsic factor and decreases with age due to reduced stomach acid. Metformin reduces B12 by 19% through ileal absorption interference. Vegans require supplementation as B12 is only found in animal products.",
    normalRange: "200-900 pg/mL",
    highImplications: "Generally not concerning, may indicate supplementation",
    lowImplications: "May cause anemia, neurological problems, and cognitive issues",
    nearHighAdvice: "Excellent B12 status - maintain current intake from food sources or appropriate supplementation levels.",
    nearLowAdvice: "Increase B12-rich foods (meat, fish, dairy) or consider sublingual supplements. If vegetarian/vegan, supplementation is essential.",
    category: "Vitamins"
  }
};

export function BiomarkerOverviewSection({ medicalReview, user }: BiomarkerOverviewProps) {
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBiomarkerData = async () => {
    if (!user?.userId || medicalReview?.biomarkers?.totalBiomarkers === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔬 Fetching ALL biomarker data for user:", user.userId);

      // Fetch all biomarkers without limit
      const response = await fetch(`/api/user/biomarkers?userId=${user.userId}&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch biomarker data: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔬 Received all biomarker data:", data);

      if (data.biomarkers && Array.isArray(data.biomarkers)) {
        setBiomarkerData(data.biomarkers);
        console.log(`✅ Loaded ${data.biomarkers.length} biomarkers`);
      } else {
        console.log("⚠️ No biomarker array in response");
        setBiomarkerData([]);
      }
    } catch (err) {
      console.error("❌ Error fetching biomarker data:", err);
      setError(err instanceof Error ? err.message : "Failed to load biomarker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiomarkerData();
  }, [user?.userId, medicalReview?.biomarkers?.totalBiomarkers]);

  const getBiomarkerBadge = (isAbnormal: boolean) => {
    return isAbnormal ? (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Abnormal
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Normal
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Metabolic": return <Zap className="h-4 w-4 text-orange-500" />;
      case "Lipid Panel": return <Heart className="h-4 w-4 text-red-500" />;
      case "Thyroid": return <Brain className="h-4 w-4 text-purple-500" />;
      case "Kidney Function": return <Droplets className="h-4 w-4 text-blue-500" />;
      case "Liver Function": return <Shield className="h-4 w-4 text-green-500" />;
      case "Complete Blood Count": return <Activity className="h-4 w-4 text-red-600" />;
      case "Vitamins": return <Target className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBiomarkerInfo = (biomarkerName: string): BiomarkerInfo => {
    // Handle common variations in biomarker names
    const normalizedName = biomarkerName.replace(/^25-hydroxy\s+/i, '25-hydroxy ');
    return biomarkerDatabase[normalizedName] || biomarkerDatabase[biomarkerName] || {
      scientificInsight: "This biomarker provides valuable insights into your health status and may correlate with age-related physiological changes",
      normalRange: "Reference range varies by lab",
      highImplications: "Elevated levels may require medical attention",
      lowImplications: "Low levels may require medical attention",
      nearHighAdvice: "Monitor trends and consider lifestyle modifications to optimize this marker",
      nearLowAdvice: "Consider nutritional support and lifestyle changes to improve this marker",
      category: "General"
    };
  };

  const parseReferenceRange = (referenceRange: string, isNumeric: boolean = true) => {
    if (!isNumeric || !referenceRange) return null;
    
    // Handle ranges like "70-100", "<200", ">40", "≥50", "<=5.7" etc.
    const rangeMatch = referenceRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
    const lessThanMatch = referenceRange.match(/[<≤]\s*([0-9.]+)/);
    const greaterThanMatch = referenceRange.match(/[>≥]\s*([0-9.]+)/);
    
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
        type: 'range'
      };
    } else if (lessThanMatch) {
      return {
        min: 0,
        max: parseFloat(lessThanMatch[1]),
        type: 'lessThan'
      };
    } else if (greaterThanMatch) {
      return {
        min: parseFloat(greaterThanMatch[1]),
        max: Infinity,
        type: 'greaterThan'
      };
    }
    
    return null;
  };

  const getProximityAdvice = (value: number, biomarkerName: string, info: BiomarkerInfo) => {
    const range = parseReferenceRange(info.normalRange);
    if (!range) {
      return {
        advice: biomarkerName.includes('abnormal') || biomarkerName.includes('high') ? info.highImplications : info.lowImplications,
        status: 'abnormal'
      };
    }

    const { min, max, type } = range;
    
    // Handle different range types for 10% calculation
    let tenPercentRange;
    let nearHigh = false;
    let nearLow = false;
    let isAbnormalHigh = false;
    let isAbnormalLow = false;
    
    if (type === 'range') {
      const rangeWidth = max - min;
      tenPercentRange = rangeWidth * 0.1;
      nearHigh = value >= (max - tenPercentRange) && value <= max;
      nearLow = value >= min && value <= (min + tenPercentRange);
      isAbnormalHigh = value > max;
      isAbnormalLow = value < min;
    } else if (type === 'greaterThan') {
      // For "≥50" type ranges, consider 10% above the minimum as monitoring zone
      tenPercentRange = min * 0.1;
      nearLow = value >= min && value <= (min + tenPercentRange);
      isAbnormalLow = value < min;
      // No upper boundary for this type
    } else if (type === 'lessThan') {
      // For "<200" type ranges, consider 10% below the maximum as monitoring zone
      tenPercentRange = max * 0.1;
      nearHigh = value >= (max - tenPercentRange) && value <= max;
      isAbnormalHigh = value > max;
      // No lower boundary for this type
    }
    
    if (isAbnormalHigh) {
      return {
        advice: `🚨 Above Normal Range: Your ${biomarkerName.toLowerCase()} level is elevated above the reference range. ${info.highImplications} Consider consulting with your healthcare provider for evaluation and management strategies.`,
        status: 'abnormal'
      };
    } else if (isAbnormalLow) {
      return {
        advice: `🚨 Below Normal Range: Your ${biomarkerName.toLowerCase()} level is below the reference range. ${info.lowImplications} Consider consulting with your healthcare provider for evaluation and potential supplementation.`,
        status: 'abnormal'
      };
    } else if (nearHigh) {
      return {
        advice: `⚠️ Monitoring Zone - Upper Boundary: Your result is within 10% of the upper normal limit, indicating you're in a monitoring zone that warrants attention. ${info.nearHighAdvice} Regular monitoring and preventive measures can help maintain optimal levels.`,
        status: 'monitoring'
      };
    } else if (nearLow) {
      return {
        advice: `⚠️ Monitoring Zone - Lower Boundary: Your result is within 10% of the lower normal limit, suggesting early intervention may be beneficial. ${info.nearLowAdvice} Proactive steps now can help optimize this biomarker.`,
        status: 'monitoring'
      };
    } else {
      return {
        advice: `✅ Optimal Range: Your ${biomarkerName.toLowerCase()} level is within the healthy optimal range, indicating excellent metabolic function for this biomarker. Continue your current lifestyle habits that support these healthy levels.`,
        status: 'optimal'
      };
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // If no biomarker data exists in medical review, show upload prompt
  if (medicalReview?.biomarkers?.totalBiomarkers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Biomarker Overview</span>
          </CardTitle>
          <CardDescription>
            Detailed view of your biomarker data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Biomarker Data Available
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your blood test results to see detailed biomarker analysis and trends.
            </p>
            <Link href="/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Blood Test Results
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Biomarker Overview</span>
            </CardTitle>
            <CardDescription>
              Detailed view of your {medicalReview.biomarkers.totalBiomarkers} biomarker{medicalReview.biomarkers.totalBiomarkers !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchBiomarkerData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {medicalReview.biomarkers.totalBiomarkers}
            </div>
            <div className="text-sm text-gray-600">Total Biomarkers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {medicalReview.biomarkers.normalCount}
            </div>
            <div className="text-sm text-gray-600">Normal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {medicalReview.biomarkers.abnormalCount}
            </div>
            <div className="text-sm text-gray-600">Abnormal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {medicalReview.biomarkers.criticalCount}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                onClick={fetchBiomarkerData} 
                variant="outline" 
                size="sm" 
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Loading detailed biomarker data...</span>
          </div>
        ) : biomarkerData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">All Biomarker Results</h4>
              <Badge variant="outline" className="text-xs">
                Showing {biomarkerData.length} biomarkers
              </Badge>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {biomarkerData.map((biomarker) => {
                const info = getBiomarkerInfo(biomarker.biomarkerName);
                return (
                  <div
                    key={biomarker.valueId}
                    className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                      biomarker.isAbnormal 
                        ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Header with name, category icon, and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(info.category)}
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg">
                            {biomarker.biomarkerName}
                          </h5>
                          <p className="text-sm text-gray-600 font-medium">
                            {info.category}
                          </p>
                        </div>
                      </div>
                      {getBiomarkerBadge(biomarker.isAbnormal)}
                    </div>

                    {/* Patient's Results */}
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
                      <h6 className="font-medium text-gray-800 mb-2 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                        Your Results
                      </h6>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Value:</span>
                          <span className={`font-bold text-lg ${
                            biomarker.isAbnormal ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatValue(biomarker.value, biomarker.unit)}
                          </span>
                        </div>
                        {biomarker.referenceRange && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Reference Range:</span>
                            <span className="text-sm font-medium text-gray-800">
                              {biomarker.referenceRange}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Test Date:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {formatDate(biomarker.testDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Insight */}
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-800 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-purple-500" />
                        Scientific Insight
                      </h6>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {info.scientificInsight}
                      </p>
                    </div>

                    {/* Interpretation */}
                    {(() => {
                      const proximityResult = getProximityAdvice(biomarker.value, biomarker.biomarkerName, info);
                      const { advice, status } = proximityResult;
                      
                      const getStatusStyles = (status: string) => {
                        switch (status) {
                          case 'abnormal':
                            return {
                              containerClass: 'bg-red-100 border border-red-200',
                              textClass: 'text-red-800',
                              descriptionClass: 'text-red-700',
                              icon: <AlertTriangle className="h-4 w-4 mr-2" />
                            };
                          case 'monitoring':
                            return {
                              containerClass: 'bg-orange-100 border border-orange-200',
                              textClass: 'text-orange-800',
                              descriptionClass: 'text-orange-700',
                              icon: <Target className="h-4 w-4 mr-2" />
                            };
                          case 'optimal':
                          default:
                            return {
                              containerClass: 'bg-green-100 border border-green-200',
                              textClass: 'text-green-800',
                              descriptionClass: 'text-green-700',
                              icon: <CheckCircle className="h-4 w-4 mr-2" />
                            };
                        }
                      };
                      
                      const styles = getStatusStyles(status);
                      
                      return (
                        <div className={`p-4 rounded-lg ${styles.containerClass}`}>
                          <h6 className={`font-medium mb-3 flex items-center ${styles.textClass}`}>
                            {styles.icon}
                            Clinical Assessment
                          </h6>
                          <p className={`text-sm leading-relaxed ${styles.descriptionClass}`}>
                            {advice}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Normal Range Context */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Typical Normal Range:</span>
                        <span className="font-medium">{info.normalRange}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {biomarkerData.length > 0 && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total: {biomarkerData.length} biomarker records loaded
                </p>
              </div>
            )}
          </div>
        ) : medicalReview.biomarkers.totalBiomarkers > 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">
              Biomarker summary available, but detailed data couldn't be loaded.
            </p>
            <Button onClick={fetchBiomarkerData} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Loading Details
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">No detailed biomarker data available.</p>
            <Link href="/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload More Data
              </Button>
            </Link>
          </div>
        )}

        {/* Last Test Date */}
        {medicalReview.biomarkers.lastTestDate && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <strong>Last Test Date:</strong> {formatDate(medicalReview.biomarkers.lastTestDate)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}