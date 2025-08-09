// File: src/app/dashboard/health-analytics/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BodyCompositionSummary } from "@/components/dashboard/body-composition-summary";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiomarkerOverviewSection } from "@/components/dashboard/biomarker-overview";
import { DetailedRecommendations } from "@/components/dashboard/detailed-recommendations";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Heart,
  Activity,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  UserX,
  Database,
  Upload,
  Download,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface AbnormalBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  testDate: string;
  isAbnormal: boolean;
  isCritical: boolean;
  severity: 'ABNORMAL' | 'CRITICAL';
  category: string;
  recommendations: string[];
}

interface AbnormalBiomarkersData {
  abnormalBiomarkers: AbnormalBiomarker[];
  criticalBiomarkers: AbnormalBiomarker[];
  summary: {
    totalAbnormal: number;
    totalCritical: number;
    lastTestDate: string | null;
  };
  userId: string;
}

interface MedicalReview {
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  healthMetrics: {
    totalReports: number;
    latestHealthScore: number;
    riskLevel: string;
    lastAnalysisDate: string | null;
  };
  biomarkers: {
    totalBiomarkers: number;
    abnormalCount: number;
    criticalCount: number;
    normalCount: number;
    lastTestDate: string | null;
  };
  bodyComposition?: {
    totalScans: number;
    latestBMI: number | null;
    bodyFatPercentage: number | null;
    muscleMass: number | null;
    lastScanDate: string | null;
  };
  trends?: {
    healthScoreTrend: string;
    weightTrend: string;
    cholesterolTrend: string;
    overallTrend: string;
  };
  recentActivity: Array<{
    type: string;
    date: string;
    description: string;
    status: string;
  }>;
  recommendations: {
    activeCount: number;
    highPriorityCount: number;
    completedCount: number;
    categories: string[];
  };
  dataQuality: {
    completeness: number;
    reliability: string;
    lastUpdated: string;
  };
  performance: {
    processingTime: number;
    cacheHit: boolean;
    dataSource: string;
    generatedAt: string;
  };
  _debug?: {
    fileUploadsFound: number;
    biomarkerValuesFound: number;
    userId: string;
    mostRecentUpload: string;
    mostRecentUploadDate: string;
  };
}

// Safe string helper to prevent .replace() errors
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

// Safe date helper
const safeDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  try {
    return new Date(value);
  } catch {
    return new Date();
  }
};

export default function EnhancedHealthAnalyticsDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [medicalReview, setMedicalReview] = useState<MedicalReview | null>(
    null
  );
  const [abnormalBiomarkers, setAbnormalBiomarkers] = useState<AbnormalBiomarkersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detailedBiomarkers, setDetailedBiomarkers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch detailed biomarker data for clinical review
  const fetchDetailedBiomarkers = async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`/api/user/biomarkers?userId=${user.userId}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setDetailedBiomarkers(data.biomarkers || []);
      }
    } catch (error) {
      console.error('Error fetching detailed biomarkers:', error);
    }
  };

  // Export biomarkers function
  const exportBiomarkers = async (format: 'pdf' | 'txt' | 'csv') => {
    if (!user?.userId || !medicalReview) return;

    try {
      console.log('📥 Exporting biomarkers in format:', format);
      
      // Fetch detailed biomarker data
      const response = await fetch(`/api/user/biomarkers?userId=${user.userId}&limit=1000`);
      if (!response.ok) {
        throw new Error('Failed to fetch biomarker data');
      }
      
      const data = await response.json();
      const biomarkers = data.biomarkers || [];
      
      if (format === 'pdf') {
        await exportBiomarkersPDF(biomarkers);
      } else if (format === 'txt') {
        exportBiomarkersTXT(biomarkers);
      } else if (format === 'csv') {
        exportBiomarkersCSV(biomarkers);
      }
    } catch (error) {
      console.error('Error exporting biomarkers:', error);
      alert('Failed to export biomarkers. Please try again.');
    }
  };

  const exportBiomarkersTXT = (biomarkers: any[]) => {
    const currentDate = new Date().toLocaleDateString();
    const patientName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Patient';
    
    let content = `BIOMARKER TRACKING LIST
Generated: ${currentDate}
Patient: ${patientName}
Total Biomarkers: ${biomarkers.length}

=== BIOMARKERS TO TEST ===

`;

    // Group biomarkers by category for better organization
    const groupedBiomarkers = biomarkers.reduce((acc: any, biomarker: any) => {
      const category = getCategoryForBiomarker(biomarker.biomarkerName);
      if (!acc[category]) acc[category] = [];
      acc[category].push(biomarker);
      return acc;
    }, {});

    Object.keys(groupedBiomarkers).sort().forEach(category => {
      content += `\n${category.toUpperCase()}:\n`;
      content += '-'.repeat(category.length + 1) + '\n';
      
      groupedBiomarkers[category].forEach((biomarker: any) => {
        content += `• ${biomarker.biomarkerName}\n`;
        if (biomarker.referenceRange) {
          content += `  Reference Range: ${biomarker.referenceRange}\n`;
        }
        if (biomarker.testDate) {
          content += `  Last Tested: ${new Date(biomarker.testDate).toLocaleDateString()}\n`;
        }
        content += '\n';
      });
    });

    content += `\n=== INSTRUCTIONS FOR LAB ===

Dear Healthcare Provider,

Please include the biomarkers listed above in the patient's next blood work panel. These markers are currently being tracked through PixelPharm Health Analytics for comprehensive health monitoring.

If any of these tests are not routinely available, please provide alternatives or let us know which tests can be included.

Thank you for your assistance in supporting the patient's proactive health management.

Generated by PixelPharm Health Analytics
Date: ${currentDate}
`;

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biomarker-list-${patientName.replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportBiomarkersCSV = (biomarkers: any[]) => {
    const currentDate = new Date().toLocaleDateString();
    const patientName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Patient';
    
    let csvContent = 'Biomarker Name,Category,Reference Range,Last Value,Last Test Date,Status\n';
    
    biomarkers.forEach(biomarker => {
      const category = getCategoryForBiomarker(biomarker.biomarkerName);
      const status = biomarker.isAbnormal ? 'Abnormal' : 'Normal';
      const lastValue = biomarker.value ? `${biomarker.value} ${biomarker.unit || ''}` : 'N/A';
      const testDate = biomarker.testDate ? new Date(biomarker.testDate).toLocaleDateString() : 'N/A';
      
      csvContent += `"${biomarker.biomarkerName}","${category}","${biomarker.referenceRange || 'N/A'}","${lastValue}","${testDate}","${status}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biomarker-data-${patientName.replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportBiomarkersPDF = async (biomarkers: any[]) => {
    // For PDF export, we'll create a detailed HTML document and use browser print
    const currentDate = new Date().toLocaleDateString();
    const patientName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Patient';
    
    const groupedBiomarkers = biomarkers.reduce((acc: any, biomarker: any) => {
      const category = getCategoryForBiomarker(biomarker.biomarkerName);
      if (!acc[category]) acc[category] = [];
      acc[category].push(biomarker);
      return acc;
    }, {});

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Biomarker Tracking List - ${patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .category { margin-bottom: 25px; }
        .category h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .biomarker { margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-left: 4px solid #3b82f6; }
        .biomarker-name { font-weight: bold; color: #1f2937; }
        .biomarker-details { color: #6b7280; font-size: 0.9em; margin-top: 5px; }
        .instructions { margin-top: 40px; padding: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>BIOMARKER TRACKING LIST</h1>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Generated:</strong> ${currentDate}</p>
        <p><strong>Total Biomarkers:</strong> ${biomarkers.length}</p>
    </div>
`;

    Object.keys(groupedBiomarkers).sort().forEach(category => {
      htmlContent += `
    <div class="category">
        <h3>${category}</h3>
`;
      groupedBiomarkers[category].forEach((biomarker: any) => {
        const testDate = biomarker.testDate ? new Date(biomarker.testDate).toLocaleDateString() : 'Never tested';
        const status = biomarker.isAbnormal ? 'Abnormal' : 'Normal';
        const lastValue = biomarker.value ? `${biomarker.value} ${biomarker.unit || ''}` : 'No data';
        
        htmlContent += `
        <div class="biomarker">
            <div class="biomarker-name">${biomarker.biomarkerName}</div>
            <div class="biomarker-details">
                Reference Range: ${biomarker.referenceRange || 'Standard lab range'}
                ${biomarker.testDate ? `<br>Last Tested: ${testDate} (${lastValue}, ${status})` : ''}
            </div>
        </div>`;
      });
      htmlContent += `    </div>`;
    });

    htmlContent += `
    <div class="instructions">
        <h3>Instructions for Healthcare Provider</h3>
        <p>Dear Healthcare Provider,</p>
        <p>Please include the biomarkers listed above in the patient's next blood work panel. These markers are currently being tracked through PixelPharm Health Analytics for comprehensive health monitoring.</p>
        <p>If any of these tests are not routinely available, please provide alternatives or let us know which tests can be included.</p>
        <p>Thank you for your assistance in supporting the patient's proactive health management.</p>
        <p><em>Generated by PixelPharm Health Analytics on ${currentDate}</em></p>
    </div>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const getCategoryForBiomarker = (biomarkerName: string): string => {
    const name = biomarkerName.toLowerCase();
    if (name.includes('glucose') || name.includes('a1c') || name.includes('insulin')) return 'Metabolic Panel';
    if (name.includes('cholesterol') || name.includes('triglyceride') || name.includes('hdl') || name.includes('ldl')) return 'Lipid Panel';
    if (name.includes('tsh') || name.includes('thyroid') || name.includes('t3') || name.includes('t4')) return 'Thyroid Function';
    if (name.includes('creatinine') || name.includes('bun') || name.includes('kidney')) return 'Kidney Function';
    if (name.includes('alt') || name.includes('ast') || name.includes('liver') || name.includes('bilirubin')) return 'Liver Function';
    if (name.includes('wbc') || name.includes('rbc') || name.includes('hemoglobin') || name.includes('hematocrit') || name.includes('platelet')) return 'Complete Blood Count';
    if (name.includes('vitamin') || name.includes('b12') || name.includes('d3') || name.includes('folate')) return 'Vitamins & Nutrients';
    if (name.includes('testosterone') || name.includes('estrogen') || name.includes('cortisol') || name.includes('hormone')) return 'Hormone Panel';
    return 'General Biomarkers';
  };

  // Check authentication first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Authentication...
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Checking your login status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserX className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please sign in to access your health analytics dashboard.
            </p>
            <Button
              onClick={() => (window.location.href = "/auth/login")}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchAbnormalBiomarkers = async () => {
    if (!user?.userId) return;

    try {
      console.log("🔬 Loading abnormal biomarkers for user:", user.userId);

      const response = await fetch(
        `/api/biomarkers/abnormal?userId=${user.userId}&_timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`Abnormal biomarkers API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Received abnormal biomarkers:", data);
      setAbnormalBiomarkers(data);
    } catch (err) {
      console.error("❌ Error fetching abnormal biomarkers:", err);
      // Don't set error state here as this is supplementary data
    }
  };

  const fetchMedicalReview = async (forceRefresh = false) => {
    if (!user?.userId) {
      setError("No user ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🏥 Loading comprehensive stats for user:", user.userId);

      // Fetch both comprehensive stats and abnormal biomarkers in parallel
      const [statsResponse] = await Promise.all([
        fetch(`/api/dashboard/comprehensive-stats?userId=${user.userId}&_timestamp=${Date.now()}`),
        fetchAbnormalBiomarkers()
      ]);

      if (!statsResponse.ok) {
        throw new Error(`API request failed: ${statsResponse.status}`);
      }

      const data = await statsResponse.json();
      console.log("📊 Received comprehensive stats:", data);

      // Transform the comprehensive stats into medical review format
      const transformedReview: MedicalReview = {
        user: data.user || {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        healthMetrics: data.healthMetrics || {
          totalReports: 0,
          latestHealthScore: 0,
          riskLevel: "UNKNOWN",
          lastAnalysisDate: null,
        },
        biomarkers: data.biomarkers || {
          totalBiomarkers: 0,
          abnormalCount: 0,
          criticalCount: 0,
          normalCount: 0,
          lastTestDate: null,
        },
        bodyComposition: data.bodyComposition,
        trends: data.trends,
        recentActivity: data.recentActivity || [],
        recommendations: data.recommendations || {
          activeCount: 0,
          highPriorityCount: 0,
          completedCount: 0,
          categories: [],
        },
        dataQuality: data.dataQuality || {
          completeness: 0,
          reliability: "LOW",
          lastUpdated: new Date().toISOString(),
        },
        performance: data.performance || {
          processingTime: 0,
          cacheHit: false,
          dataSource: "unknown",
          generatedAt: new Date().toISOString(),
        },
        _debug: data._debug,
      };

      setMedicalReview(transformedReview);
      console.log("✅ Medical review loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching medical review:", err);
      setError(safeString(err));
    } finally {
      setLoading(false);
    }
  };

  const triggerNewAnalysis = async () => {
    setIsAnalyzing(true);
    await fetchMedicalReview(true);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (user?.userId) {
      fetchMedicalReview();
      fetchDetailedBiomarkers();
    }
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Your Health Data
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Hello {user?.firstName || user?.email}! Fetching your health
              analytics...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !medicalReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analysis Error
              </h3>
              <p className="text-sm text-gray-600 mb-4">{safeString(error)}</p>
              <Button onClick={() => fetchMedicalReview()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!medicalReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Health Data Available
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Welcome {user?.firstName || user?.email}! Upload your biomarker
                data to get started.
              </p>
              <Link href="/upload">
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Health Data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskBadgeColor = (risk: string) => {
    const riskLevel = safeString(risk).toUpperCase();
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "CRITICAL":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    const sev = safeString(severity).toUpperCase();
    switch (sev) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "HIGH":
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case "MODERATE":
        return <Activity className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = safeString(priority).toUpperCase();
    switch (p) {
      case "HIGH":
        return "border-l-red-500 bg-red-50";
      case "MEDIUM":
        return "border-l-yellow-500 bg-yellow-50";
      case "LOW":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  // Helper function to determine if biomarker is in monitoring zone
  const isInMonitoringZone = (biomarker: any): boolean => {
    if (!biomarker.referenceRange || biomarker.isAbnormal) return false;
    
    const parseReferenceRange = (referenceRange: string) => {
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

    const range = parseReferenceRange(biomarker.referenceRange);
    if (!range) return false;

    const { min, max, type } = range;
    const value = biomarker.value;
    
    if (type === 'range') {
      const rangeWidth = max - min;
      const tenPercentRange = rangeWidth * 0.1;
      const nearHigh = value >= (max - tenPercentRange) && value <= max;
      const nearLow = value >= min && value <= (min + tenPercentRange);
      return nearHigh || nearLow;
    } else if (type === 'greaterThan') {
      const tenPercentRange = min * 0.1;
      return value >= min && value <= (min + tenPercentRange);
    } else if (type === 'lessThan') {
      const tenPercentRange = max * 0.1;
      return value >= (max - tenPercentRange) && value <= max;
    }
    
    return false;
  };

  // Generate clinical review paragraph with specific biomarker details
  const generateClinicalReview = (medicalReview: MedicalReview): string => {
    const userName = medicalReview.user?.firstName || user?.firstName || user?.name || "there";
    const totalBiomarkers = medicalReview.biomarkers.totalBiomarkers;
    const criticalCount = medicalReview.biomarkers.criticalCount;
    const abnormalCount = medicalReview.biomarkers.abnormalCount;
    const normalCount = medicalReview.biomarkers.normalCount;
    const healthScore = medicalReview.healthMetrics.latestHealthScore;
    const riskLevel = safeString(
      medicalReview.healthMetrics.riskLevel
    ).toUpperCase();
    const lastTestDate = medicalReview.biomarkers.lastTestDate
      ? safeDate(medicalReview.biomarkers.lastTestDate).toLocaleDateString()
      : "recently";

    // Body composition data
    const bodyComposition = medicalReview.bodyComposition;
    const hasBodyData =
      bodyComposition &&
      (bodyComposition.totalScans > 0 ||
        bodyComposition.bodyFatPercentage ||
        bodyComposition.muscleMass);

    // Analyze detailed biomarkers if available
    const abnormalBiomarkers = detailedBiomarkers.filter(b => b.isAbnormal);
    const monitoringBiomarkers = detailedBiomarkers.filter(b => !b.isAbnormal && isInMonitoringZone(b));
    const criticalBiomarkers = abnormalBiomarkers.filter(b => {
      // Define critical biomarkers based on common medical criteria
      const name = b.biomarkerName.toLowerCase();
      const value = b.value;
      
      if (name.includes('glucose') && value > 180) return true;
      if (name.includes('a1c') && value > 8.0) return true;
      if (name.includes('total cholesterol') && value > 280) return true;
      if (name.includes('ldl') && value > 190) return true;
      if (name.includes('triglycerides') && value > 500) return true;
      if (name.includes('creatinine') && value > 2.0) return true;
      if (name.includes('alt') && value > 120) return true;
      if (name.includes('ast') && value > 120) return true;
      
      return false;
    });

    if (totalBiomarkers === 0) {
      let reviewText = `Hello ${userName}, let's discuss your current health status. Currently, there are no recent laboratory results available for analysis. To provide you with the most comprehensive health assessment and personalized recommendations, regular blood testing is essential. `;

      if (hasBodyData) {
        reviewText += `\n\nFrom your body composition analysis, `;
        if (bodyComposition?.bodyFatPercentage) {
          reviewText += `your body fat percentage is ${bodyComposition.bodyFatPercentage}%, `;
        }
        if (bodyComposition?.muscleMass) {
          reviewText += `muscle mass is ${bodyComposition.muscleMass}kg, `;
        }
        if (bodyComposition?.latestBMI) {
          reviewText += `and your BMI is ${bodyComposition.latestBMI}. `;
        } else {
          reviewText += `which provides valuable insights into your physical composition. `;
        }
        reviewText += `This body composition data is an excellent complement to blood work, as it helps paint a complete picture of your metabolic health. `;
      }

      reviewText += `\n\nI recommend establishing a baseline with a comprehensive metabolic panel and lipid profile. These tests will help identify your current metabolic status and any areas that may need attention. For the best ongoing health recommendations, blood tests should be done regularly - typically every 6-12 months for preventive screening, or more frequently if specific health concerns arise.`;

      return reviewText;
    }

    let reviewText = `Hello ${userName}, here's a comprehensive review of your recent health data from ${lastTestDate}. `;

    // Overall assessment with specific biomarker details
    if (criticalBiomarkers.length > 0) {
      reviewText += `Your test results show ${criticalBiomarkers.length} critical value${criticalBiomarkers.length > 1 ? "s" : ""} requiring immediate medical attention: `;
      reviewText += criticalBiomarkers.map(b => `${b.biomarkerName} (${b.value} ${b.unit})`).join(', ');
      reviewText += `. These values are significantly outside normal ranges and warrant urgent healthcare provider consultation. `;
    } else if (abnormalBiomarkers.length > 0) {
      reviewText += `Your results show ${abnormalBiomarkers.length} biomarker${abnormalBiomarkers.length > 1 ? "s" : ""} outside normal range: `;
      reviewText += abnormalBiomarkers.slice(0, 5).map(b => `${b.biomarkerName} (${b.value} ${b.unit})`).join(', ');
      if (abnormalBiomarkers.length > 5) reviewText += ` and ${abnormalBiomarkers.length - 5} others`;
      reviewText += `. These should be addressed with your healthcare provider. `;
    } else {
      reviewText += `Excellent news - your laboratory values are within normal ranges, indicating good overall metabolic health. `;
    }

    // Add monitoring zone markers
    if (monitoringBiomarkers.length > 0) {
      reviewText += `\n\nAdditionally, ${monitoringBiomarkers.length} biomarker${monitoringBiomarkers.length > 1 ? "s are" : " is"} in the monitoring zone (within 10% of normal range boundaries): `;
      reviewText += monitoringBiomarkers.slice(0, 5).map(b => `${b.biomarkerName} (${b.value} ${b.unit})`).join(', ');
      if (monitoringBiomarkers.length > 5) reviewText += ` and ${monitoringBiomarkers.length - 5} others`;
      reviewText += `. While technically normal, these markers warrant closer attention and proactive lifestyle optimization to prevent future progression outside normal ranges. `;
    }

    // Health score context
    if (healthScore > 75) {
      reviewText += `Your overall health score of ${healthScore} reflects excellent metabolic health. `;
    } else if (healthScore > 50) {
      reviewText += `Your health score of ${healthScore} indicates moderate health status with room for improvement. `;
    } else if (healthScore > 0) {
      reviewText += `Your health score of ${healthScore} suggests several areas where focused attention can significantly improve your health outcomes. `;
    }

    // Body composition analysis
    if (hasBodyData) {
      reviewText += `\n\nYour body composition analysis provides additional valuable insights. `;

      if (bodyComposition?.bodyFatPercentage) {
        const fatPercent = bodyComposition.bodyFatPercentage;
        if (fatPercent < 15) {
          reviewText += `Your body fat percentage of ${fatPercent}% is in the lean athletic range. `;
        } else if (fatPercent < 25) {
          reviewText += `Your body fat percentage of ${fatPercent}% is within a healthy range. `;
        } else if (fatPercent < 35) {
          reviewText += `Your body fat percentage of ${fatPercent}% indicates room for improvement through diet and exercise. `;
        } else {
          reviewText += `Your body fat percentage of ${fatPercent}% suggests that body composition optimization should be a priority. `;
        }
      }

      if (bodyComposition?.muscleMass) {
        reviewText += `Your muscle mass of ${bodyComposition.muscleMass}kg is ${
          bodyComposition.muscleMass > 30
            ? "excellent and"
            : bodyComposition.muscleMass > 25
            ? "good and"
            : ""
        } important for metabolic health, as muscle tissue helps regulate blood sugar and supports overall metabolism. `;
      }

      if (bodyComposition?.latestBMI) {
        const bmi = bodyComposition.latestBMI;
        if (bmi < 18.5) {
          reviewText += `Your BMI of ${bmi} indicates you may be underweight. `;
        } else if (bmi < 25) {
          reviewText += `Your BMI of ${bmi} is within the healthy weight range. `;
        } else if (bmi < 30) {
          reviewText += `Your BMI of ${bmi} suggests you're in the overweight category. `;
        } else {
          reviewText += `Your BMI of ${bmi} indicates obesity, which can impact many of the biomarkers we're tracking. `;
        }
      }

      reviewText += `The combination of your blood work and body composition data provides a comprehensive view of your metabolic health status. `;
    }

    // Specific recommendations based on abnormal and monitoring biomarkers
    reviewText += `\n\nBased on your specific results, here are targeted recommendations: `;

    if (criticalBiomarkers.length > 0 || abnormalBiomarkers.length > 2) {
      reviewText += `Immediate lifestyle modifications are essential, including a heart-healthy diet rich in omega-3 fatty acids, regular moderate exercise (30 minutes daily), stress management techniques, and ensuring adequate sleep (7-9 hours nightly). `;
      
      // Add specific recommendations for common abnormal biomarkers
      const hasGlucoseIssues = abnormalBiomarkers.some(b => b.biomarkerName.toLowerCase().includes('glucose') || b.biomarkerName.toLowerCase().includes('a1c'));
      const hasLipidIssues = abnormalBiomarkers.some(b => b.biomarkerName.toLowerCase().includes('cholesterol') || b.biomarkerName.toLowerCase().includes('triglyceride'));
      const hasLiverIssues = abnormalBiomarkers.some(b => b.biomarkerName.toLowerCase().includes('alt') || b.biomarkerName.toLowerCase().includes('ast'));
      
      if (hasGlucoseIssues) {
        reviewText += `Given your glucose/A1c results, focus on carbohydrate management, consider continuous glucose monitoring, and prioritize post-meal physical activity. `;
      }
      if (hasLipidIssues) {
        reviewText += `For your lipid profile concerns, emphasize soluble fiber intake, plant sterols, and consider omega-3 supplementation. `;
      }
      if (hasLiverIssues) {
        reviewText += `Your liver enzyme results suggest reducing alcohol intake, increasing antioxidant-rich foods, and considering milk thistle supplementation. `;
      }
      
      if (hasBodyData && bodyComposition?.bodyFatPercentage && bodyComposition.bodyFatPercentage > 25) {
        reviewText += `Given your body composition, incorporating both cardiovascular exercise and strength training will be particularly beneficial for improving both your biomarkers and body composition. `;
      }
    } else if (abnormalBiomarkers.length > 0 || monitoringBiomarkers.length > 0) {
      reviewText += `Targeted lifestyle adjustments and preventive measures can help optimize your results. `;
      
      if (monitoringBiomarkers.length > 0) {
        reviewText += `For your monitoring zone biomarkers, small dietary and activity modifications now can prevent future progression to abnormal ranges. `;
      }
      
      if (hasBodyData) {
        reviewText += `Your body composition data suggests maintaining or building lean muscle mass while optimizing your overall body composition. `;
      }
    } else {
      reviewText += `Maintain your current healthy lifestyle patterns while fine-tuning your nutrition and exercise routine for optimal wellness. `;
      if (hasBodyData && bodyComposition?.muscleMass && bodyComposition.muscleMass > 30) {
        reviewText += `Your excellent muscle mass indicates you're doing great with your fitness routine - keep it up! `;
      }
    }

    // Regular testing recommendations
    reviewText += `\n\nFor ongoing monitoring, `;

    if (criticalBiomarkers.length > 0) {
      reviewText += `given your critical values, consider retesting key biomarkers in 4-6 weeks, then transitioning to quarterly monitoring until values normalize. `;
    } else if (abnormalBiomarkers.length > 0) {
      reviewText += `with abnormal values present, plan for retesting in 8-12 weeks, then every 3-6 months depending on progress. `;
    } else if (monitoringBiomarkers.length > 0) {
      reviewText += `with some markers in monitoring zones, consider retesting in 3-6 months to ensure stability. `;
    } else {
      reviewText += `with your excellent current results, annual comprehensive testing is appropriate for continued health monitoring. `;
    }

    reviewText += `Regular monitoring helps track progress, catch changes early, and adjust recommendations as needed. This data-driven approach provides the most comprehensive picture of your health journey.`;

    return reviewText;
  };

  // Check if this is real data or demo data
  const isRealData = medicalReview.performance?.dataSource === "database";
  const dataSourceBadge = isRealData ? "Real Data" : "Demo Data";
  const dataSourceColor = isRealData
    ? "bg-green-100 text-green-800"
    : "bg-blue-100 text-blue-800";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-0 sm:px-2 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8 mx-2 sm:mx-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                Health Analytics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Welcome {user?.firstName || user?.email} • Last updated{" "}
                {medicalReview.healthMetrics.lastAnalysisDate
                  ? safeDate(
                      medicalReview.healthMetrics.lastAnalysisDate
                    ).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Badge variant="outline" className="text-xs">
                {dataSourceBadge}
              </Badge>
              <Button
                onClick={triggerNewAnalysis}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isAnalyzing ? "Refreshing..." : "Refresh"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-2 sm:mx-0">
            {/* Mobile Tab Selector */}
            <div className="lg:hidden p-4 border-b border-gray-200">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="clinical">Clinical Review</SelectItem>
                  <SelectItem value="systems">System Health</SelectItem>
                  <SelectItem value="actions">Actions & Export</SelectItem>
                  <SelectItem value="trends">Health Trends</SelectItem>
                  <SelectItem value="insights">Data Insights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Desktop Tab List */}
            <TabsList className="hidden lg:grid w-full grid-cols-6 bg-gray-50 border-b border-gray-200 rounded-t-lg gap-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="clinical"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Clinical
              </TabsTrigger>
              <TabsTrigger
                value="systems"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Systems
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger 
                value="trends"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Trends
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium px-4 py-3 border-b-2 border-transparent transition-all text-sm"
              >
                Data Insights
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {medicalReview.healthMetrics.latestHealthScore}
                    </div>
                    <div className="text-lg font-semibold text-gray-600 mb-4">
                      Reports: {medicalReview.healthMetrics.totalReports}
                    </div>
                    <Badge
                      className={getRiskBadgeColor(
                        medicalReview.healthMetrics.riskLevel
                      )}
                    >
                      {safeString(medicalReview.healthMetrics.riskLevel)} RISK
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Biomarkers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span>Biomarkers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {medicalReview.biomarkers.totalBiomarkers}
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {medicalReview.biomarkers.criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {medicalReview.biomarkers.criticalCount} Critical
                        </Badge>
                      )}
                      {medicalReview.biomarkers.abnormalCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {medicalReview.biomarkers.abnormalCount} Abnormal
                        </Badge>
                      )}
                      {medicalReview.biomarkers.normalCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {medicalReview.biomarkers.normalCount} Normal
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Last test:{" "}
                      {medicalReview.biomarkers.lastTestDate
                        ? safeDate(
                            medicalReview.biomarkers.lastTestDate
                          ).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Biomarker Overview Section - Moved up from bottom */}
            <BiomarkerOverviewSection
              medicalReview={medicalReview}
              user={user}
            />

            {/* Body Composition - Full width below Biomarkers */}
            <BodyCompositionSummary userId={user?.userId || ""} />

            {/* Debug Information - Hidden from frontend */}
            {false && medicalReview._debug && (
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>
                    Technical details about your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Uploads Found:</span>{" "}
                      {medicalReview._debug.fileUploadsFound}
                    </div>
                    <div>
                      <span className="font-medium">Biomarker Values:</span>{" "}
                      {medicalReview._debug.biomarkerValuesFound}
                    </div>
                    <div>
                      <span className="font-medium">Most Recent Upload:</span>{" "}
                      {medicalReview._debug.mostRecentUpload}
                    </div>
                    <div>
                      <span className="font-medium">Upload Date:</span>{" "}
                      {medicalReview._debug.mostRecentUploadDate !== "None"
                        ? safeDate(
                            medicalReview._debug.mostRecentUploadDate
                          ).toLocaleDateString()
                        : "None"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Quality - Moved to bottom */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <span>Data Quality</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completeness</span>
                      <span>{medicalReview.dataQuality.completeness}%</span>
                    </div>
                    <Progress
                      value={medicalReview.dataQuality.completeness}
                      className="h-2"
                    />
                  </div>
                  <div className="text-center">
                    <Badge
                      className={
                        medicalReview.dataQuality.reliability === "HIGH"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {safeString(medicalReview.dataQuality.reliability)}{" "}
                      Reliability
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinical Tab */}
          <TabsContent value="clinical" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Clinical Review */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Clinical Review</span>
                </CardTitle>
                <CardDescription>
                  Professional assessment of your health results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Heart className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-3">
                          Clinical Assessment
                        </h4>
                        <div className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">
                          {generateClinicalReview(medicalReview)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Abnormal Biomarkers Section */}
            {abnormalBiomarkers && (abnormalBiomarkers.abnormalBiomarkers.length > 0 || abnormalBiomarkers.criticalBiomarkers.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Abnormal Test Results - Follow Up Required</span>
                  </CardTitle>
                  <CardDescription>
                    These biomarkers are outside normal ranges and should be discussed with your healthcare provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Critical Biomarkers - Highest Priority */}
                  {abnormalBiomarkers.criticalBiomarkers.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h4 className="text-lg font-semibold text-red-900">
                          Critical Values - Urgent Follow-up Required
                        </h4>
                        <Badge variant="destructive">
                          {abnormalBiomarkers.criticalBiomarkers.length} Critical
                        </Badge>
                      </div>
                      <div className="grid gap-4">
                        {abnormalBiomarkers.criticalBiomarkers.map((biomarker, index) => (
                          <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h5 className="font-semibold text-red-900">{biomarker.name}</h5>
                                  <Badge variant="destructive" className="text-xs">
                                    {biomarker.category}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="font-medium text-gray-700">Your Result:</span>
                                    <div className="text-red-700 font-bold text-lg">
                                      {biomarker.value} {biomarker.unit}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Normal Range:</span>
                                    <div className="text-gray-600">{biomarker.referenceRange}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Test Date:</span>
                                    <div className="text-gray-600">
                                      {safeDate(biomarker.testDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <h6 className="font-medium text-gray-900 mb-2">Recommended Actions:</h6>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {biomarker.recommendations.map((rec, i) => (
                                      <li key={i} className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Abnormal Biomarkers - Standard Priority */}
                  {abnormalBiomarkers.abnormalBiomarkers.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <h4 className="text-lg font-semibold text-orange-900">
                          Abnormal Values - Should Be Addressed
                        </h4>
                        <Badge variant="secondary">
                          {abnormalBiomarkers.abnormalBiomarkers.length} Abnormal
                        </Badge>
                      </div>
                      <div className="grid gap-4">
                        {abnormalBiomarkers.abnormalBiomarkers
                          .filter(b => !b.isCritical) // Exclude critical ones already shown above
                          .map((biomarker, index) => (
                          <div key={index} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h5 className="font-semibold text-orange-900">{biomarker.name}</h5>
                                  <Badge variant="secondary" className="text-xs">
                                    {biomarker.category}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="font-medium text-gray-700">Your Result:</span>
                                    <div className="text-orange-700 font-bold text-lg">
                                      {biomarker.value} {biomarker.unit}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Normal Range:</span>
                                    <div className="text-gray-600">{biomarker.referenceRange}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Test Date:</span>
                                    <div className="text-gray-600">
                                      {safeDate(biomarker.testDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <h6 className="font-medium text-gray-900 mb-2">Recommended Actions:</h6>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {biomarker.recommendations.map((rec, i) => (
                                      <li key={i} className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Call to Action */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          {abnormalBiomarkers.criticalBiomarkers.length > 0 
                            ? "Schedule an urgent appointment with your healthcare provider to discuss these critical results."
                            : "Schedule a routine follow-up appointment with your healthcare provider to discuss these abnormal results and develop a management plan."
                          }
                        </p>
                        <div className="text-xs text-blue-700">
                          Print or screenshot this section to bring to your appointment for targeted follow-up testing.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinical Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Laboratory Results Summary</span>
                </CardTitle>
                <CardDescription>
                  Quantitative breakdown of your test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {medicalReview.biomarkers.criticalCount}
                    </div>
                    <div className="text-sm text-gray-600">Critical Values</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Require immediate attention
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {medicalReview.biomarkers.abnormalCount}
                    </div>
                    <div className="text-sm text-gray-600">Abnormal Values</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Outside normal range
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {medicalReview.biomarkers.normalCount}
                    </div>
                    <div className="text-sm text-gray-600">Normal Values</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Within healthy range
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Health Score:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">
                        {medicalReview.healthMetrics.latestHealthScore}
                      </span>
                      <Badge
                        className={getRiskBadgeColor(
                          medicalReview.healthMetrics.riskLevel
                        )}
                      >
                        {safeString(medicalReview.healthMetrics.riskLevel)} RISK
                      </Badge>
                    </div>
                  </div>
                </div>

                {medicalReview.biomarkers.totalBiomarkers === 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 mb-4">
                      No biomarker data available yet. Upload your laboratory
                      results to receive a comprehensive clinical review.
                    </p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Blood Test Results
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Systems Tab */}
          <TabsContent value="systems" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
                <CardDescription>
                  Health system analysis based on available data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalReview.trends ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">
                        Cardiovascular Health
                      </h4>
                      <Badge
                        className={getRiskBadgeColor(
                          medicalReview.trends.cholesterolTrend === "concerning"
                            ? "HIGH"
                            : "LOW"
                        )}
                      >
                        {medicalReview.trends.cholesterolTrend?.toUpperCase() ||
                          "UNKNOWN"}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        Based on cholesterol and cardiovascular markers
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Overall Trend</h4>
                      <Badge
                        className={getRiskBadgeColor(
                          medicalReview.trends.overallTrend === "positive"
                            ? "LOW"
                            : "MODERATE"
                        )}
                      >
                        {medicalReview.trends.overallTrend?.toUpperCase() ||
                          "UNKNOWN"}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        General health trajectory assessment
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      System analysis requires more biomarker data.
                    </p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload More Health Data
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Biomarker Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span>Export Biomarker List</span>
                </CardTitle>
                <CardDescription>
                  Download your tracked biomarkers list to share with your doctor or blood test facility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {medicalReview.biomarkers.totalBiomarkers}
                      </div>
                      <div className="text-sm text-gray-600">Tracked Biomarkers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {medicalReview.biomarkers.normalCount}
                      </div>
                      <div className="text-sm text-gray-600">Normal Results</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {medicalReview.biomarkers.abnormalCount}
                      </div>
                      <div className="text-sm text-gray-600">Need Attention</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => exportBiomarkers('pdf')}
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download PDF List</span>
                    </Button>
                    <Button 
                      onClick={() => exportBiomarkers('txt')}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download Text List</span>
                    </Button>
                    <Button 
                      onClick={() => exportBiomarkers('csv')}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Download CSV</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <strong>How to use:</strong> Share this list with your healthcare provider or blood test facility 
                    to ensure your next blood work includes all the biomarkers you're currently tracking in PixelPharm.
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <DetailedRecommendations userId={user?.userId || ""} />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Health Trends</span>
                </CardTitle>
                <CardDescription>
                  Analysis of health changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalReview.trends ? (
                  <div className="space-y-4">
                    {Object.entries(medicalReview.trends).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="font-medium capitalize">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace("Trend", "")}
                          </span>
                          <Badge
                            className={getRiskBadgeColor(
                              value === "improving" || value === "positive"
                                ? "LOW"
                                : value === "concerning"
                                ? "HIGH"
                                : "MODERATE"
                            )}
                          >
                            {safeString(value).toUpperCase()}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Trend analysis requires multiple data points over time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Biomarkers Tracked
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {medicalReview.biomarkers.totalBiomarkers}
                </div>
                <div className="flex gap-1 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    {medicalReview.biomarkers.abnormalCount} Abnormal
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {medicalReview.biomarkers.normalCount} Normal
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last test:{" "}
                  {medicalReview.biomarkers.lastTestDate
                    ? safeDate(
                        medicalReview.biomarkers.lastTestDate
                      ).toLocaleDateString()
                    : "Never"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Insights Tab */}
          <TabsContent value="insights" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>
                    Latest health data uploads and analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalReview.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {medicalReview.recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between border-b pb-2 last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {safeString(activity.description)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {safeDate(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                activity.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {safeString(activity.status)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">No recent activity</p>
                      <Link href="/upload">
                        <Button size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Health Data
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>System Performance</span>
                  </CardTitle>
                  <CardDescription>
                    Technical details about data processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Processing Time
                        </div>
                        <div className="font-semibold">
                          {(
                            medicalReview.performance.processingTime / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Cache Status
                        </div>
                        <Badge
                          className={
                            medicalReview.performance.cacheHit
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {medicalReview.performance.cacheHit
                            ? "Cache Hit"
                            : "Fresh Analysis"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Data Source
                      </div>
                      <Badge
                        className={
                          isRealData
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {medicalReview.performance.dataSource}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Last Updated
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {safeDate(
                            medicalReview.performance.generatedAt
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Data Quality Score
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={medicalReview.dataQuality.completeness}
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-semibold">
                          {medicalReview.dataQuality.completeness}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Data Summary</CardTitle>
                <CardDescription>
                  Complete overview of your health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {medicalReview.healthMetrics.totalReports}
                    </div>
                    <div className="text-sm text-gray-600">Total Reports</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {medicalReview.biomarkers.totalBiomarkers}
                    </div>
                    <div className="text-sm text-gray-600">Biomarkers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {medicalReview.recommendations.activeCount}
                    </div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {medicalReview.recentActivity.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Recent Activities
                    </div>
                  </div>
                </div>

                {/* Call to Action if no real data */}
                {!isRealData && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">
                          Ready to see your real health data?
                        </h4>
                        <p className="text-sm text-blue-700">
                          Upload your blood test results to get personalized
                          Multi Medical Model AI powered health insights.
                        </p>
                      </div>
                      <Link href="/upload">
                        <Button>Upload Now</Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Success message if real data */}
                {isRealData && medicalReview._debug && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900">
                          Real Health Data Loaded!
                        </h4>
                        <p className="text-sm text-green-700">
                          Found {medicalReview._debug.fileUploadsFound} upload
                          {medicalReview._debug.fileUploadsFound !== 1
                            ? "s"
                            : ""}
                          {medicalReview._debug.mostRecentUpload !== "None" &&
                            ` including "${medicalReview._debug.mostRecentUpload}"`}
                        </p>
                      </div>
                      <Link href="/upload">
                        <Button variant="outline">Upload More</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
