// File: src/lib/medical/enhanced-review-system.ts

import { optimizedBedrockAnalyzer } from "../aws/bedrock-optimized";

export interface MedicalReviewConfig {
  includeVisualizations: boolean;
  detailLevel: "summary" | "detailed" | "comprehensive";
  focusAreas: (
    | "cardiovascular"
    | "metabolic"
    | "inflammatory"
    | "nutritional"
    | "hormonal"
  )[];
  riskThreshold: "low" | "moderate" | "high";
  includeRecommendations: boolean;
  includeTrends: boolean;
}

export interface EnhancedMedicalReview {
  overview: {
    overallHealth: {
      score: number;
      grade: "A" | "B" | "C" | "D" | "F";
      status: string;
      trend: "improving" | "stable" | "declining";
    };
    riskProfile: {
      level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
      primaryRisks: string[];
      timeToAction: "immediate" | "within_week" | "within_month" | "routine";
    };
    dataQuality: {
      completeness: number;
      recency: number;
      reliability: number;
    };
  };

  clinicalFindings: {
    critical: ClinicalFinding[];
    abnormal: ClinicalFinding[];
    borderline: ClinicalFinding[];
    normal: ClinicalFinding[];
  };

  systemReviews: {
    cardiovascular: SystemReview;
    metabolic: SystemReview;
    inflammatory: SystemReview;
    nutritional: SystemReview;
    hormonal: SystemReview;
    hepatic: SystemReview;
    renal: SystemReview;
  };

  recommendations: {
    immediate: ActionableRecommendation[];
    shortTerm: ActionableRecommendation[];
    longTerm: ActionableRecommendation[];
    lifestyle: ActionableRecommendation[];
    monitoring: ActionableRecommendation[];
  };

  trends: {
    improving: TrendAnalysis[];
    stable: TrendAnalysis[];
    concerning: TrendAnalysis[];
  };

  visualizations: {
    healthScoreHistory: ChartData;
    biomarkerTrends: ChartData[];
    riskFactorRadar: ChartData;
    comparativeAnalysis: ChartData;
  };

  metadata: {
    generatedAt: Date;
    analysisVersion: string;
    dataPoints: number;
    confidenceScore: number;
    nextReviewDate: Date;
  };
}

interface ClinicalFinding {
  biomarker: string;
  value: number;
  unit: string;
  referenceRange: string;
  deviation: number; // How far from normal range
  clinicalSignificance: "high" | "moderate" | "low";
  urgency: "immediate" | "soon" | "routine";
  interpretation: string;
  possibleCauses: string[];
  followUpRequired: boolean;
}

interface SystemReview {
  overallStatus: "optimal" | "good" | "concerning" | "critical";
  keyMarkers: string[];
  findings: string[];
  risks: string[];
  recommendations: string[];
  trendDirection: "improving" | "stable" | "declining";
}

interface ActionableRecommendation {
  category:
    | "diet"
    | "exercise"
    | "lifestyle"
    | "supplements"
    | "medical"
    | "monitoring";
  priority: "urgent" | "high" | "moderate" | "low";
  action: string;
  reasoning: string;
  expectedOutcome: string;
  timeframe: string;
  evidenceLevel: "strong" | "moderate" | "limited";
  cost: "free" | "low" | "moderate" | "high";
  difficulty: "easy" | "moderate" | "challenging";
}

interface TrendAnalysis {
  biomarker: string;
  direction: "improving" | "stable" | "declining";
  magnitude: "significant" | "moderate" | "minimal";
  timeframe: string;
  confidence: number;
  clinicalRelevance: string;
  projectedOutcome: string;
}

interface ChartData {
  type: "line" | "bar" | "radar" | "scatter";
  title: string;
  data: any[];
  config: any;
}

export class EnhancedMedicalReviewSystem {
  private readonly BIOMARKER_CATEGORIES = {
    cardiovascular: [
      "total_cholesterol",
      "ldl_cholesterol",
      "hdl_cholesterol",
      "triglycerides",
      "apolipoprotein_a1",
      "apolipoprotein_b",
      "lipoprotein_a",
      "homocysteine",
    ],
    metabolic: ["glucose", "hba1c", "insulin", "c_peptide", "fructosamine"],
    inflammatory: ["crp", "esr", "ferritin", "il6", "tnf_alpha"],
    nutritional: [
      "vitamin_d",
      "vitamin_b12",
      "folate",
      "iron",
      "calcium",
      "magnesium",
    ],
    hormonal: ["tsh", "t3", "t4", "testosterone", "estradiol", "cortisol"],
    hepatic: ["alt", "ast", "alp", "bilirubin", "albumin", "ggt"],
    renal: ["creatinine", "bun", "egfr", "uric_acid", "cystatin_c"],
  };

  private readonly RISK_THRESHOLDS = {
    cardiovascular: {
      total_cholesterol: { optimal: 200, borderline: 240, high: 280 },
      ldl_cholesterol: { optimal: 100, borderline: 130, high: 160 },
      hdl_cholesterol: { low: 40, optimal: 60 },
      triglycerides: { optimal: 150, borderline: 200, high: 500 },
    },
    metabolic: {
      glucose: { optimal: 100, borderline: 126, high: 200 },
      hba1c: { optimal: 5.7, borderline: 6.5, high: 9.0 },
    },
  };

  public async generateEnhancedReview(
    biomarkers: any[],
    bodyComposition?: any,
    userProfile?: any,
    config: MedicalReviewConfig = this.getDefaultConfig()
  ): Promise<EnhancedMedicalReview> {
    console.log("Generating enhanced medical review...");

    // Get AI analysis first
    const aiAnalysis = await optimizedBedrockAnalyzer.getHealthInsights(
      "review-user",
      biomarkers,
      bodyComposition,
      userProfile
    );

    // Process biomarkers by category
    const categorizedBiomarkers = this.categorizeBiomarkers(biomarkers);

    // Generate clinical findings
    const clinicalFindings = this.generateClinicalFindings(
      biomarkers,
      aiAnalysis
    );

    // Create system reviews
    const systemReviews = this.generateSystemReviews(
      categorizedBiomarkers,
      aiAnalysis
    );

    // Generate actionable recommendations
    const recommendations = this.generateActionableRecommendations(
      aiAnalysis,
      userProfile
    );

    // Analyze trends
    const trends = this.analyzeTrends(biomarkers);

    // Create visualizations
    const visualizations = config.includeVisualizations
      ? this.generateVisualizations(biomarkers, aiAnalysis)
      : ({} as any);

    // Calculate overview metrics
    const overview = this.generateOverview(
      aiAnalysis,
      biomarkers,
      clinicalFindings
    );

    return {
      overview,
      clinicalFindings,
      systemReviews,
      recommendations,
      trends,
      visualizations,
      metadata: {
        generatedAt: new Date(),
        analysisVersion: "2.0.0",
        dataPoints: biomarkers.length,
        confidenceScore: aiAnalysis.confidence,
        nextReviewDate: this.calculateNextReviewDate(clinicalFindings),
      },
    };
  }

  private getDefaultConfig(): MedicalReviewConfig {
    return {
      includeVisualizations: true,
      detailLevel: "comprehensive",
      focusAreas: ["cardiovascular", "metabolic", "inflammatory"],
      riskThreshold: "moderate",
      includeRecommendations: true,
      includeTrends: true,
    };
  }

  private categorizeBiomarkers(biomarkers: any[]): Record<string, any[]> {
    const categorized: Record<string, any[]> = {};

    Object.entries(this.BIOMARKER_CATEGORIES).forEach(([category, markers]) => {
      categorized[category] = biomarkers.filter((b) =>
        markers.some((marker) =>
          b.biomarkerName?.toLowerCase().includes(marker.toLowerCase())
        )
      );
    });

    return categorized;
  }

  private generateClinicalFindings(
    biomarkers: any[],
    aiAnalysis: any
  ): {
    critical: ClinicalFinding[];
    abnormal: ClinicalFinding[];
    borderline: ClinicalFinding[];
    normal: ClinicalFinding[];
  } {
    const findings = {
      critical: [] as ClinicalFinding[],
      abnormal: [] as ClinicalFinding[],
      borderline: [] as ClinicalFinding[],
      normal: [] as ClinicalFinding[],
    };

    biomarkers.forEach((biomarker) => {
      const finding: ClinicalFinding = {
        biomarker: biomarker.biomarkerName,
        value: parseFloat(biomarker.value),
        unit: biomarker.unit || "",
        referenceRange: biomarker.referenceRange || "Unknown",
        deviation: this.calculateDeviation(biomarker),
        clinicalSignificance: this.assessClinicalSignificance(biomarker),
        urgency: this.determineUrgency(biomarker),
        interpretation: this.generateInterpretation(biomarker),
        possibleCauses: this.identifyPossibleCauses(biomarker),
        followUpRequired: biomarker.isAbnormal || false,
      };

      // Categorize finding
      if (finding.urgency === "immediate") {
        findings.critical.push(finding);
      } else if (biomarker.isAbnormal) {
        findings.abnormal.push(finding);
      } else if (finding.deviation > 0.7) {
        findings.borderline.push(finding);
      } else {
        findings.normal.push(finding);
      }
    });

    return findings;
  }

  private generateSystemReviews(
    categorizedBiomarkers: Record<string, any[]>,
    aiAnalysis: any
  ): any {
    const systemReviews: any = {};

    Object.entries(categorizedBiomarkers).forEach(([system, markers]) => {
      if (markers.length === 0) {
        systemReviews[system] = this.getEmptySystemReview();
        return;
      }

      const abnormalCount = markers.filter((m) => m.isAbnormal).length;
      const abnormalPercentage = abnormalCount / markers.length;

      systemReviews[system] = {
        overallStatus: this.determineSystemStatus(abnormalPercentage),
        keyMarkers: markers.map((m) => m.biomarkerName),
        findings: this.generateSystemFindings(system, markers),
        risks: this.identifySystemRisks(system, markers),
        recommendations: this.generateSystemRecommendations(system, markers),
        trendDirection: "stable", // Would calculate from historical data
      };
    });

    return systemReviews;
  }

  private generateActionableRecommendations(
    aiAnalysis: any,
    userProfile?: any
  ): any {
    const recommendations = {
      immediate: [] as ActionableRecommendation[],
      shortTerm: [] as ActionableRecommendation[],
      longTerm: [] as ActionableRecommendation[],
      lifestyle: [] as ActionableRecommendation[],
      monitoring: [] as ActionableRecommendation[],
    };

    // Process AI recommendations and enhance them
    aiAnalysis.recommendations?.forEach((rec: any) => {
      const enhanced: ActionableRecommendation = {
        category: this.mapRecommendationCategory(rec.category),
        priority: rec.priority,
        action: rec.recommendation,
        reasoning: rec.reasoning,
        expectedOutcome: this.generateExpectedOutcome(rec),
        timeframe: this.determineTimeframe(rec.priority),
        evidenceLevel: rec.evidenceLevel || "moderate",
        cost: this.estimateCost(rec),
        difficulty: this.assessDifficulty(rec),
      };

      // Categorize by timeframe and type
      if (rec.priority === "urgent") {
        recommendations.immediate.push(enhanced);
      } else if (
        enhanced.category === "lifestyle" ||
        enhanced.category === "diet"
      ) {
        recommendations.lifestyle.push(enhanced);
      } else if (enhanced.category === "monitoring") {
        recommendations.monitoring.push(enhanced);
      } else if (enhanced.timeframe.includes("week")) {
        recommendations.shortTerm.push(enhanced);
      } else {
        recommendations.longTerm.push(enhanced);
      }
    });

    return recommendations;
  }

  private analyzeTrends(biomarkers: any[]): any {
    // This would analyze historical data - for now, mock implementation
    return {
      improving: [
        {
          biomarker: "HDL Cholesterol",
          direction: "improving" as const,
          magnitude: "moderate" as const,
          timeframe: "Last 3 months",
          confidence: 0.8,
          clinicalRelevance: "Positive cardiovascular risk reduction",
          projectedOutcome:
            "Continued improvement expected with current lifestyle",
        },
      ],
      stable: biomarkers
        .filter((b) => !b.isAbnormal)
        .map((b) => ({
          biomarker: b.biomarkerName,
          direction: "stable" as const,
          magnitude: "minimal" as const,
          timeframe: "Last 6 months",
          confidence: 0.9,
          clinicalRelevance: "Maintaining healthy levels",
          projectedOutcome: "Expected to remain stable",
        })),
      concerning: biomarkers
        .filter((b) => b.isAbnormal)
        .map((b) => ({
          biomarker: b.biomarkerName,
          direction: "declining" as const,
          magnitude: "significant" as const,
          timeframe: "Recent",
          confidence: 0.7,
          clinicalRelevance: "Requires attention and intervention",
          projectedOutcome: "May worsen without intervention",
        })),
    };
  }

  private generateVisualizations(biomarkers: any[], aiAnalysis: any): any {
    return {
      healthScoreHistory: {
        type: "line",
        title: "Health Score Trend",
        data: [
          { date: "2024-01", score: 72 },
          { date: "2024-02", score: 75 },
          { date: "2024-03", score: aiAnalysis.healthScore },
        ],
        config: {
          xAxis: "date",
          yAxis: "score",
          color: "#10b981",
        },
      },
      biomarkerTrends: biomarkers.slice(0, 6).map((b) => ({
        type: "line",
        title: `${b.biomarkerName} Trend`,
        data: [
          { date: "2024-01", value: b.value * 0.9 },
          { date: "2024-02", value: b.value * 0.95 },
          { date: "2024-03", value: b.value },
        ],
        config: {
          xAxis: "date",
          yAxis: "value",
          color: b.isAbnormal ? "#ef4444" : "#10b981",
        },
      })),
      riskFactorRadar: {
        type: "radar",
        title: "Risk Factor Assessment",
        data: [
          { category: "Cardiovascular", value: 65 },
          { category: "Metabolic", value: 70 },
          { category: "Inflammatory", value: 80 },
          { category: "Nutritional", value: 85 },
          { category: "Hormonal", value: 75 },
        ],
        config: {
          scale: [0, 100],
          color: "#3b82f6",
        },
      },
      comparativeAnalysis: {
        type: "bar",
        title: "Biomarkers vs. Optimal Range",
        data: biomarkers.slice(0, 8).map((b) => ({
          biomarker: b.biomarkerName,
          current: b.value,
          optimal: this.getOptimalValue(b),
          status: b.isAbnormal ? "abnormal" : "normal",
        })),
        config: {
          xAxis: "biomarker",
          yAxis: "value",
          colorScheme: ["#10b981", "#ef4444"],
        },
      },
    };
  }

  private generateOverview(
    aiAnalysis: any,
    biomarkers: any[],
    clinicalFindings: any
  ): any {
    const abnormalCount = biomarkers.filter((b) => b.isAbnormal).length;
    const totalCount = biomarkers.length;
    const normalPercentage = ((totalCount - abnormalCount) / totalCount) * 100;

    return {
      overallHealth: {
        score: aiAnalysis.healthScore,
        grade: this.calculateHealthGrade(aiAnalysis.healthScore),
        status: this.generateHealthStatus(
          aiAnalysis.healthScore,
          abnormalCount
        ),
        trend: this.determineOverallTrend(biomarkers),
      },
      riskProfile: {
        level: aiAnalysis.riskLevel,
        primaryRisks: this.identifyPrimaryRisks(clinicalFindings),
        timeToAction: this.determineTimeToAction(clinicalFindings),
      },
      dataQuality: {
        completeness: Math.min((totalCount / 20) * 100, 100), // Assume 20 is comprehensive
        recency: this.calculateRecency(biomarkers),
        reliability: this.assessReliability(biomarkers),
      },
    };
  }

  // Helper methods
  private calculateDeviation(biomarker: any): number {
    // Simple implementation - would be more sophisticated in production
    return biomarker.isAbnormal ? 1.2 : 0.3;
  }

  private assessClinicalSignificance(
    biomarker: any
  ): "high" | "moderate" | "low" {
    if (biomarker.isAbnormal) {
      const criticalMarkers = ["glucose", "creatinine", "troponin"];
      return criticalMarkers.some((m) =>
        biomarker.biomarkerName?.toLowerCase().includes(m)
      )
        ? "high"
        : "moderate";
    }
    return "low";
  }

  private determineUrgency(biomarker: any): "immediate" | "soon" | "routine" {
    if (biomarker.isAbnormal) {
      const immediateMarkers = [
        "glucose",
        "creatinine",
        "troponin",
        "potassium",
      ];
      return immediateMarkers.some((m) =>
        biomarker.biomarkerName?.toLowerCase().includes(m)
      )
        ? "immediate"
        : "soon";
    }
    return "routine";
  }

  private generateInterpretation(biomarker: any): string {
    if (biomarker.isAbnormal) {
      return `${biomarker.biomarkerName} is outside the normal range and requires attention.`;
    }
    return `${biomarker.biomarkerName} is within the normal range.`;
  }

  private identifyPossibleCauses(biomarker: any): string[] {
    // This would be a comprehensive database lookup in production
    const causeMap: Record<string, string[]> = {
      glucose: ["diabetes", "diet", "stress", "medication"],
      cholesterol: ["diet", "genetics", "lifestyle", "medication"],
      creatinine: [
        "kidney function",
        "dehydration",
        "muscle mass",
        "medication",
      ],
    };

    const markerName = biomarker.biomarkerName?.toLowerCase() || "";
    const matchedKey = Object.keys(causeMap).find((key) =>
      markerName.includes(key)
    );
    return matchedKey ? causeMap[matchedKey] : ["Multiple factors possible"];
  }

  private getEmptySystemReview(): SystemReview {
    return {
      overallStatus: "good",
      keyMarkers: [],
      findings: ["No data available for this system"],
      risks: [],
      recommendations: [
        "Consider comprehensive testing for complete assessment",
      ],
      trendDirection: "stable",
    };
  }

  private determineSystemStatus(
    abnormalPercentage: number
  ): "optimal" | "good" | "concerning" | "critical" {
    if (abnormalPercentage === 0) return "optimal";
    if (abnormalPercentage < 0.25) return "good";
    if (abnormalPercentage < 0.5) return "concerning";
    return "critical";
  }

  private generateSystemFindings(system: string, markers: any[]): string[] {
    const abnormalMarkers = markers.filter((m) => m.isAbnormal);
    if (abnormalMarkers.length === 0) {
      return [`All ${system} markers are within normal ranges`];
    }
    return abnormalMarkers.map(
      (m) =>
        `${m.biomarkerName} is elevated and may indicate ${system} dysfunction`
    );
  }

  private identifySystemRisks(system: string, markers: any[]): string[] {
    const riskMap: Record<string, string[]> = {
      cardiovascular: ["Heart disease", "Stroke", "Atherosclerosis"],
      metabolic: ["Diabetes", "Metabolic syndrome", "Insulin resistance"],
      inflammatory: ["Chronic inflammation", "Autoimmune conditions"],
      nutritional: ["Nutrient deficiencies", "Malabsorption"],
      hormonal: ["Endocrine dysfunction", "Reproductive issues"],
      hepatic: ["Liver disease", "Hepatotoxicity"],
      renal: ["Kidney disease", "Electrolyte imbalance"],
    };

    return riskMap[system] || [];
  }

  private generateSystemRecommendations(
    system: string,
    markers: any[]
  ): string[] {
    const recMap: Record<string, string[]> = {
      cardiovascular: [
        "Heart-healthy diet",
        "Regular cardio exercise",
        "Stress management",
      ],
      metabolic: [
        "Low glycemic diet",
        "Weight management",
        "Regular monitoring",
      ],
      inflammatory: [
        "Anti-inflammatory diet",
        "Omega-3 supplementation",
        "Stress reduction",
      ],
      nutritional: [
        "Balanced nutrition",
        "Targeted supplementation",
        "Digestive health",
      ],
      hormonal: [
        "Lifestyle optimization",
        "Sleep hygiene",
        "Stress management",
      ],
      hepatic: ["Liver-supportive diet", "Limit alcohol", "Regular monitoring"],
      renal: [
        "Adequate hydration",
        "Protein moderation",
        "Blood pressure control",
      ],
    };

    return recMap[system] || ["Consult healthcare provider"];
  }

  private mapRecommendationCategory(
    category: string
  ): ActionableRecommendation["category"] {
    const categoryMap: Record<string, ActionableRecommendation["category"]> = {
      nutrition: "diet",
      physical: "exercise",
      supplement: "supplements",
      medical: "medical",
      tracking: "monitoring",
    };
    return categoryMap[category] || "lifestyle";
  }

  private generateExpectedOutcome(rec: any): string {
    return `Expected improvement in ${rec.category} markers within appropriate timeframe`;
  }

  private determineTimeframe(priority: string): string {
    const timeframeMap: Record<string, string> = {
      urgent: "1-3 days",
      high: "1-2 weeks",
      moderate: "1-3 months",
      low: "3-6 months",
    };
    return timeframeMap[priority] || "1-3 months";
  }

  private estimateCost(rec: any): ActionableRecommendation["cost"] {
    if (rec.category?.includes("supplement")) return "moderate";
    if (rec.category?.includes("medical")) return "high";
    if (rec.category?.includes("lifestyle")) return "free";
    return "low";
  }

  private assessDifficulty(rec: any): ActionableRecommendation["difficulty"] {
    if (rec.category?.includes("lifestyle")) return "moderate";
    if (rec.category?.includes("diet")) return "moderate";
    return "easy";
  }

  private calculateHealthGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  private generateHealthStatus(score: number, abnormalCount: number): string {
    if (score >= 85 && abnormalCount === 0) return "Excellent health profile";
    if (score >= 75) return "Good health with minor areas for improvement";
    if (score >= 65) return "Moderate health concerns requiring attention";
    return "Significant health issues requiring immediate action";
  }

  private determineOverallTrend(
    biomarkers: any[]
  ): "improving" | "stable" | "declining" {
    // Mock implementation - would analyze historical data
    return "stable";
  }

  private identifyPrimaryRisks(clinicalFindings: any): string[] {
    const risks = [];
    if (clinicalFindings.critical.length > 0) {
      risks.push("Immediate medical attention required");
    }
    if (clinicalFindings.abnormal.length > 2) {
      risks.push("Multiple abnormal markers");
    }
    return risks.length > 0 ? risks : ["Low risk profile"];
  }

  private determineTimeToAction(
    clinicalFindings: any
  ): "immediate" | "within_week" | "within_month" | "routine" {
    if (clinicalFindings.critical.length > 0) return "immediate";
    if (clinicalFindings.abnormal.length > 0) return "within_week";
    if (clinicalFindings.borderline.length > 0) return "within_month";
    return "routine";
  }

  private calculateRecency(biomarkers: any[]): number {
    // Calculate based on test dates - mock implementation
    return 95; // Assume recent data
  }

  private assessReliability(biomarkers: any[]): number {
    // Assess based on lab quality, test types - mock implementation
    return 90;
  }

  private getOptimalValue(biomarker: any): number {
    // Return optimal value for visualization - mock implementation
    return biomarker.value * 0.85; // Assume current is slightly above optimal
  }

  private calculateNextReviewDate(clinicalFindings: any): Date {
    const nextReview = new Date();

    if (clinicalFindings.critical.length > 0) {
      nextReview.setDate(nextReview.getDate() + 7); // 1 week
    } else if (clinicalFindings.abnormal.length > 0) {
      nextReview.setMonth(nextReview.getMonth() + 1); // 1 month
    } else {
      nextReview.setMonth(nextReview.getMonth() + 3); // 3 months
    }

    return nextReview;
  }
}

export const enhancedMedicalReview = new EnhancedMedicalReviewSystem();
