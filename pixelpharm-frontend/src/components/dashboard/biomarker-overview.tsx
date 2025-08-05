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
  description: string;
  clinicalSignificance: string;
  normalRange: string;
  highImplications: string;
  lowImplications: string;
  category: string;
}

interface BiomarkerOverviewProps {
  medicalReview: any;
  user: any;
}

const biomarkerDatabase: Record<string, BiomarkerInfo> = {
  "Glucose": {
    description: "Blood sugar level - primary source of energy for cells",
    clinicalSignificance: "Essential for diagnosing diabetes and monitoring blood sugar control",
    normalRange: "70-100 mg/dL (fasting)",
    highImplications: "May indicate diabetes, prediabetes, or insulin resistance",
    lowImplications: "May indicate hypoglycemia, liver disease, or medication effects",
    category: "Metabolic"
  },
  "Hemoglobin A1c": {
    description: "Average blood sugar levels over the past 2-3 months",
    clinicalSignificance: "Gold standard for long-term diabetes management and diagnosis",
    normalRange: "<5.7%",
    highImplications: "Indicates poor blood sugar control, increased diabetes complications risk",
    lowImplications: "Generally not concerning, may indicate excellent glucose control",
    category: "Metabolic"
  },
  "Total Cholesterol": {
    description: "Total amount of cholesterol in blood - includes HDL, LDL, and VLDL",
    clinicalSignificance: "Key marker for cardiovascular disease risk assessment",
    normalRange: "<200 mg/dL",
    highImplications: "Increased risk of heart disease and stroke",
    lowImplications: "Generally favorable, but extremely low levels may indicate malnutrition",
    category: "Lipid Panel"
  },
  "HDL Cholesterol": {
    description: "High-density lipoprotein - 'good' cholesterol that removes bad cholesterol",
    clinicalSignificance: "Protective against heart disease - higher levels are better",
    normalRange: ">40 mg/dL (men), >50 mg/dL (women)",
    highImplications: "Protective against heart disease - this is good!",
    lowImplications: "Increased risk of heart disease and metabolic syndrome",
    category: "Lipid Panel"
  },
  "LDL Cholesterol": {
    description: "Low-density lipoprotein - 'bad' cholesterol that can clog arteries",
    clinicalSignificance: "Primary target for cholesterol-lowering therapy",
    normalRange: "<100 mg/dL",
    highImplications: "Increased risk of atherosclerosis, heart attack, and stroke",
    lowImplications: "Generally favorable for cardiovascular health",
    category: "Lipid Panel"
  },
  "Triglycerides": {
    description: "Type of fat in blood - energy storage form of dietary fats",
    clinicalSignificance: "Elevated levels increase cardiovascular disease risk",
    normalRange: "<150 mg/dL",
    highImplications: "Increased risk of heart disease and pancreatitis",
    lowImplications: "Generally not concerning, may indicate good metabolic health",
    category: "Lipid Panel"
  },
  "TSH": {
    description: "Thyroid Stimulating Hormone - regulates thyroid function",
    clinicalSignificance: "Primary screening test for thyroid disorders",
    normalRange: "0.4-4.0 mIU/L",
    highImplications: "May indicate hypothyroidism (underactive thyroid)",
    lowImplications: "May indicate hyperthyroidism (overactive thyroid)",
    category: "Thyroid"
  },
  "Creatinine": {
    description: "Waste product filtered by kidneys - marker of kidney function",
    clinicalSignificance: "Essential for assessing kidney health and drug dosing",
    normalRange: "0.6-1.2 mg/dL",
    highImplications: "May indicate kidney disease or dehydration",
    lowImplications: "May indicate low muscle mass or liver disease",
    category: "Kidney Function"
  },
  "BUN": {
    description: "Blood Urea Nitrogen - waste product filtered by kidneys",
    clinicalSignificance: "Assesses kidney function and protein metabolism",
    normalRange: "7-20 mg/dL",
    highImplications: "May indicate kidney disease, dehydration, or high protein diet",
    lowImplications: "May indicate liver disease or low protein diet",
    category: "Kidney Function"
  },
  "ALT": {
    description: "Alanine Aminotransferase - liver enzyme indicating liver cell damage",
    clinicalSignificance: "Primary marker for liver health and hepatocyte injury",
    normalRange: "7-56 U/L",
    highImplications: "May indicate liver damage, hepatitis, or medication toxicity",
    lowImplications: "Generally not concerning, may indicate healthy liver function",
    category: "Liver Function"
  },
  "AST": {
    description: "Aspartate Aminotransferase - enzyme found in liver, heart, and muscles",
    clinicalSignificance: "Indicates tissue damage, particularly liver and heart",
    normalRange: "10-40 U/L",
    highImplications: "May indicate liver damage, heart attack, or muscle injury",
    lowImplications: "Generally not concerning, indicates healthy tissue function",
    category: "Liver Function"
  },
  "WBC": {
    description: "White Blood Cell count - immune system cells that fight infection",
    clinicalSignificance: "Assesses immune system function and infection status",
    normalRange: "4.5-11.0 K/uL",
    highImplications: "May indicate infection, inflammation, or blood disorders",
    lowImplications: "May indicate immune suppression or bone marrow problems",
    category: "Complete Blood Count"
  },
  "RBC": {
    description: "Red Blood Cell count - cells that carry oxygen throughout the body",
    clinicalSignificance: "Assesses oxygen-carrying capacity and overall blood health",
    normalRange: "4.7-6.1 M/uL (men), 4.2-5.4 M/uL (women)",
    highImplications: "May indicate dehydration, lung disease, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or nutritional deficiencies",
    category: "Complete Blood Count"
  },
  "Hemoglobin": {
    description: "Protein in red blood cells that carries oxygen from lungs to tissues",
    clinicalSignificance: "Essential for diagnosing anemia and assessing oxygen transport",
    normalRange: "14-18 g/dL (men), 12-16 g/dL (women)",
    highImplications: "May indicate dehydration, smoking, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or chronic disease",
    category: "Complete Blood Count"
  },
  "Hematocrit": {
    description: "Percentage of blood volume made up of red blood cells",
    clinicalSignificance: "Assesses blood thickness and oxygen-carrying capacity",
    normalRange: "42-52% (men), 37-47% (women)",
    highImplications: "May indicate dehydration, lung disease, or blood disorders",
    lowImplications: "May indicate anemia, blood loss, or overhydration",
    category: "Complete Blood Count"
  },
  "Platelets": {
    description: "Blood cells responsible for clotting and preventing bleeding",
    clinicalSignificance: "Essential for assessing bleeding risk and clotting ability",
    normalRange: "150-450 K/uL",
    highImplications: "May indicate blood disorders or increased clotting risk",
    lowImplications: "May indicate bleeding risk, bone marrow problems, or medication effects",
    category: "Complete Blood Count"
  },
  "Vitamin D": {
    description: "Fat-soluble vitamin essential for bone health and immune function",
    clinicalSignificance: "Critical for calcium absorption and overall health",
    normalRange: "30-100 ng/mL",
    highImplications: "Rarely toxic, but extremely high levels may cause hypercalcemia",
    lowImplications: "May indicate deficiency leading to bone problems and immune dysfunction",
    category: "Vitamins"
  },
  "Vitamin B12": {
    description: "Essential vitamin for nerve function, DNA synthesis, and red blood cell formation",
    clinicalSignificance: "Critical for neurological health and preventing megaloblastic anemia",
    normalRange: "200-900 pg/mL",
    highImplications: "Generally not concerning, may indicate supplementation",
    lowImplications: "May cause anemia, neurological problems, and cognitive issues",
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
    return biomarkerDatabase[biomarkerName] || {
      description: "Important health marker measured in your blood test",
      clinicalSignificance: "This biomarker provides valuable insights into your health status",
      normalRange: "Reference range varies by lab",
      highImplications: "Elevated levels may require medical attention",
      lowImplications: "Low levels may require medical attention",
      category: "General"
    };
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

                    {/* What This Biomarker Is */}
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-800 mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-500" />
                        What This Measures
                      </h6>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {info.description}
                      </p>
                    </div>

                    {/* Clinical Significance */}
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-800 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-purple-500" />
                        Clinical Significance
                      </h6>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {info.clinicalSignificance}
                      </p>
                    </div>

                    {/* Interpretation */}
                    <div className={`p-3 rounded-lg ${
                      biomarker.isAbnormal ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'
                    }`}>
                      <h6 className={`font-medium mb-2 flex items-center ${
                        biomarker.isAbnormal ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {biomarker.isAbnormal ? (
                          <AlertTriangle className="h-4 w-4 mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Interpretation
                      </h6>
                      <p className={`text-sm leading-relaxed ${
                        biomarker.isAbnormal ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {biomarker.isAbnormal ? info.highImplications : "Your results are within the normal range, indicating healthy levels for this biomarker."}
                      </p>
                    </div>

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