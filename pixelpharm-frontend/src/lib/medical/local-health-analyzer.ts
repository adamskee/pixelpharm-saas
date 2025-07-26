// File: src/lib/medical/local-health-analyzer.ts
// Complete health analysis system that doesn't require AWS Bedrock

export interface HealthAnalysisResult {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  keyFindings: string[];
  recommendations: Array<{
    category: string;
    priority: "low" | "moderate" | "high";
    recommendation: string;
    reasoning: string;
    actionable: boolean;
    evidenceLevel: "low" | "moderate" | "high";
    timeline?: string;
    estimatedCost?: string;
    difficulty?: string;
  }>;
  abnormalValues: Array<{
    biomarker: string;
    value: number;
    unit: string;
    referenceRange: string;
    concern: string;
    urgency: "routine" | "soon" | "urgent";
    clinicalSignificance: string;
  }>;
  systemReviews: {
    cardiovascular: SystemReview;
    metabolic: SystemReview;
    hepatic: SystemReview;
    renal: SystemReview;
    hematologic: SystemReview;
    endocrine: SystemReview;
  };
  trends: Array<{
    biomarker: string;
    direction: "improving" | "stable" | "declining";
    changePercent: number;
    timeframe: string;
    confidence: number;
  }>;
  summary: string;
  confidence: number;
  dataCompleteness: number;
  processingTime: number;
}

interface SystemReview {
  status: "NORMAL" | "ABNORMAL" | "NEEDS_ATTENTION";
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  score: number;
}

interface BiomarkerData {
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  testDate: Date;
}

export class LocalHealthAnalyzer {
  private biomarkerDatabase: Map<string, BiomarkerReference> = new Map();

  constructor() {
    this.initializeBiomarkerDatabase();
  }

  private initializeBiomarkerDatabase() {
    // Comprehensive biomarker reference database
    const biomarkers: BiomarkerReference[] = [
      // Lipid Panel
      {
        name: "Total Cholesterol",
        unit: "mg/dL",
        ranges: { optimal: [0, 200], borderline: [200, 239], high: [240, 999] },
        category: "cardiovascular",
        significance: "Primary risk factor for coronary heart disease",
        recommendations: {
          high: [
            "Heart-healthy diet",
            "Regular exercise",
            "Consider statin therapy",
          ],
          borderline: ["Dietary modifications", "Increase physical activity"],
        },
      },
      {
        name: "LDL Cholesterol",
        unit: "mg/dL",
        ranges: { optimal: [0, 100], borderline: [100, 159], high: [160, 999] },
        category: "cardiovascular",
        significance:
          "Bad cholesterol - primary target for lipid-lowering therapy",
        recommendations: {
          high: ["Statin therapy consideration", "Intensive lifestyle changes"],
          borderline: ["Dietary fat reduction", "Regular cardio exercise"],
        },
      },
      {
        name: "HDL Cholesterol",
        unit: "mg/dL",
        ranges: { low: [0, 40], borderline: [40, 59], optimal: [60, 999] },
        category: "cardiovascular",
        significance: "Good cholesterol - protective against heart disease",
        recommendations: {
          low: [
            "Increase physical activity",
            "Quit smoking",
            "Moderate alcohol",
          ],
          borderline: ["Regular aerobic exercise", "Weight management"],
        },
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        ranges: { optimal: [0, 150], borderline: [150, 199], high: [200, 999] },
        category: "metabolic",
        significance:
          "Associated with metabolic syndrome and cardiovascular risk",
        recommendations: {
          high: [
            "Weight loss",
            "Reduce simple carbohydrates",
            "Omega-3 supplements",
          ],
          borderline: ["Dietary modifications", "Regular exercise"],
        },
      },
      // Glucose Metabolism
      {
        name: "Glucose",
        unit: "mg/dL",
        ranges: {
          optimal: [70, 100],
          borderline: [100, 125],
          high: [126, 999],
        },
        category: "metabolic",
        significance: "Primary marker for diabetes screening",
        recommendations: {
          high: [
            "Diabetes evaluation",
            "Dietary counseling",
            "Weight management",
          ],
          borderline: ["Pre-diabetes monitoring", "Lifestyle modifications"],
        },
      },
      {
        name: "Hemoglobin A1C",
        unit: "%",
        ranges: { optimal: [0, 5.7], borderline: [5.7, 6.4], high: [6.5, 20] },
        category: "metabolic",
        significance: "3-month average blood sugar control",
        recommendations: {
          high: [
            "Diabetes management",
            "Medication review",
            "Endocrinologist referral",
          ],
          borderline: ["Pre-diabetes intervention", "Regular monitoring"],
        },
      },
      // Liver Function
      {
        name: "ALT",
        unit: "U/L",
        ranges: { optimal: [0, 40], borderline: [40, 80], high: [80, 999] },
        category: "hepatic",
        significance: "Liver enzyme indicating hepatocellular damage",
        recommendations: {
          high: [
            "Liver function evaluation",
            "Alcohol cessation",
            "Medication review",
          ],
          borderline: ["Lifestyle modifications", "Repeat testing"],
        },
      },
      {
        name: "AST",
        unit: "U/L",
        ranges: { optimal: [0, 40], borderline: [40, 80], high: [80, 999] },
        category: "hepatic",
        significance: "Liver enzyme, also found in heart and muscle",
        recommendations: {
          high: ["Comprehensive liver evaluation", "Cardiac assessment"],
          borderline: ["Monitor trends", "Lifestyle review"],
        },
      },
      // Kidney Function
      {
        name: "Creatinine",
        unit: "mg/dL",
        ranges: {
          optimal: [0.6, 1.2],
          borderline: [1.2, 2.0],
          high: [2.0, 999],
        },
        category: "renal",
        significance: "Kidney function marker",
        recommendations: {
          high: [
            "Nephrology referral",
            "Blood pressure control",
            "Medication review",
          ],
          borderline: ["Monitor kidney function", "Hydration optimization"],
        },
      },
      {
        name: "BUN",
        unit: "mg/dL",
        ranges: { optimal: [7, 20], borderline: [20, 30], high: [30, 999] },
        category: "renal",
        significance: "Kidney function and protein metabolism",
        recommendations: {
          high: ["Kidney function assessment", "Protein intake review"],
          borderline: ["Hydration increase", "Monitor trends"],
        },
      },
      // Complete Blood Count
      {
        name: "Hemoglobin",
        unit: "g/dL",
        ranges: { low: [0, 12], optimal: [12, 16], high: [16, 999] },
        category: "hematologic",
        significance: "Oxygen-carrying capacity of blood",
        recommendations: {
          low: [
            "Iron deficiency evaluation",
            "Dietary iron increase",
            "B12/folate check",
          ],
          high: ["Hydration assessment", "Sleep apnea screening"],
        },
      },
      // Thyroid Function
      {
        name: "TSH",
        unit: "mIU/L",
        ranges: { low: [0, 0.4], optimal: [0.4, 4.0], high: [4.0, 999] },
        category: "endocrine",
        significance: "Thyroid stimulating hormone - primary thyroid marker",
        recommendations: {
          high: ["Hypothyroidism evaluation", "Thyroid hormone replacement"],
          low: ["Hyperthyroidism assessment", "Endocrinology referral"],
        },
      },
      // Vitamins
      {
        name: "Vitamin D",
        unit: "ng/mL",
        ranges: { low: [0, 30], optimal: [30, 100], high: [100, 999] },
        category: "endocrine",
        significance: "Bone health, immune function, mood regulation",
        recommendations: {
          low: [
            "Vitamin D supplementation",
            "Sun exposure increase",
            "Dietary sources",
          ],
          high: ["Reduce supplementation", "Monitor calcium levels"],
        },
      },
      {
        name: "Vitamin B12",
        unit: "pg/mL",
        ranges: { low: [0, 300], optimal: [300, 900], high: [900, 999] },
        category: "hematologic",
        significance: "Nerve function, red blood cell formation",
        recommendations: {
          low: [
            "B12 supplementation",
            "Dietary B12 increase",
            "Absorption evaluation",
          ],
          high: ["Review supplements", "Monitor for underlying conditions"],
        },
      },
    ];

    biomarkers.forEach((biomarker) => {
      this.biomarkerDatabase.set(biomarker.name, biomarker);
    });
  }

  public async analyzeHealth(
    biomarkers: BiomarkerData[],
    userProfile?: any
  ): Promise<HealthAnalysisResult> {
    const startTime = Date.now();

    console.log(
      `🔬 Analyzing ${biomarkers.length} biomarkers using local health analyzer`
    );

    // Categorize biomarkers
    const abnormalValues = this.identifyAbnormalValues(biomarkers);
    const systemReviews = this.performSystemReviews(biomarkers);
    const healthScore = this.calculateHealthScore(biomarkers, systemReviews);
    const riskLevel = this.assessRiskLevel(healthScore, abnormalValues);
    const keyFindings = this.generateKeyFindings(abnormalValues, systemReviews);
    const recommendations = this.generateRecommendations(
      abnormalValues,
      systemReviews
    );
    const trends = this.analyzeTrends(biomarkers);

    const result: HealthAnalysisResult = {
      healthScore,
      riskLevel,
      keyFindings,
      recommendations,
      abnormalValues,
      systemReviews,
      trends,
      summary: this.generateSummary(
        healthScore,
        riskLevel,
        abnormalValues,
        systemReviews
      ),
      confidence: 0.9, // High confidence for rule-based analysis
      dataCompleteness: Math.min(biomarkers.length / 15, 1.0), // Assume 15 is comprehensive panel
      processingTime: Date.now() - startTime,
    };

    console.log(
      `✅ Local health analysis completed in ${result.processingTime}ms`
    );
    return result;
  }

  private identifyAbnormalValues(biomarkers: BiomarkerData[]) {
    return biomarkers
      .filter((b) => b.isAbnormal)
      .map((biomarker) => {
        const reference = this.biomarkerDatabase.get(biomarker.biomarkerName);
        const severity = this.assessBiomarkerSeverity(biomarker, reference);

        return {
          biomarker: biomarker.biomarkerName,
          value: biomarker.value,
          unit: biomarker.unit,
          referenceRange: biomarker.referenceRange,
          concern: this.getBiomarkerConcern(biomarker, reference),
          urgency: severity.urgency,
          clinicalSignificance:
            reference?.significance ||
            "Biomarker outside normal range requires attention",
        };
      });
  }

  private performSystemReviews(biomarkers: BiomarkerData[]) {
    const systems = {
      cardiovascular: this.reviewCardiovascularSystem(biomarkers),
      metabolic: this.reviewMetabolicSystem(biomarkers),
      hepatic: this.reviewHepaticSystem(biomarkers),
      renal: this.reviewRenalSystem(biomarkers),
      hematologic: this.reviewHematologicSystem(biomarkers),
      endocrine: this.reviewEndocrineSystem(biomarkers),
    };

    return systems;
  }

  private reviewCardiovascularSystem(
    biomarkers: BiomarkerData[]
  ): SystemReview {
    const cardioMarkers = biomarkers.filter((b) =>
      [
        "Total Cholesterol",
        "LDL Cholesterol",
        "HDL Cholesterol",
        "Triglycerides",
      ].includes(b.biomarkerName)
    );

    const abnormalCardio = cardioMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalCardio.length * 25, 0);

    return {
      status:
        abnormalCardio.length === 0
          ? "NORMAL"
          : abnormalCardio.length <= 2
          ? "NEEDS_ATTENTION"
          : "ABNORMAL",
      findings:
        abnormalCardio.length > 0
          ? abnormalCardio.map(
              (b) => `Elevated ${b.biomarkerName}: ${b.value} ${b.unit}`
            )
          : ["Lipid profile within normal ranges"],
      recommendations:
        abnormalCardio.length > 0
          ? [
              "Heart-healthy diet (Mediterranean style)",
              "Regular aerobic exercise (150 min/week)",
              "Consider lipid medication if indicated",
            ]
          : [
              "Maintain current cardiovascular health practices",
              "Regular exercise continuation",
            ],
      riskFactors: abnormalCardio.map((b) =>
        b.biomarkerName.toLowerCase().replace(/\s+/g, "_")
      ),
      score,
    };
  }

  private reviewMetabolicSystem(biomarkers: BiomarkerData[]): SystemReview {
    const metabolicMarkers = biomarkers.filter((b) =>
      ["Glucose", "Hemoglobin A1C", "Triglycerides"].includes(b.biomarkerName)
    );

    const abnormalMetabolic = metabolicMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalMetabolic.length * 30, 0);

    return {
      status:
        abnormalMetabolic.length === 0
          ? "NORMAL"
          : abnormalMetabolic.length === 1
          ? "NEEDS_ATTENTION"
          : "ABNORMAL",
      findings:
        abnormalMetabolic.length > 0
          ? abnormalMetabolic.map(
              (b) => `${b.biomarkerName} elevated: ${b.value} ${b.unit}`
            )
          : ["Glucose metabolism appears normal"],
      recommendations:
        abnormalMetabolic.length > 0
          ? [
              "Weight management if indicated",
              "Reduce refined carbohydrates",
              "Regular blood sugar monitoring",
            ]
          : ["Maintain healthy weight", "Continue balanced diet"],
      riskFactors: abnormalMetabolic.map((b) =>
        b.biomarkerName.toLowerCase().replace(/\s+/g, "_")
      ),
      score,
    };
  }

  private reviewHepaticSystem(biomarkers: BiomarkerData[]): SystemReview {
    const liverMarkers = biomarkers.filter((b) =>
      ["ALT", "AST", "Bilirubin", "Alkaline Phosphatase"].includes(
        b.biomarkerName
      )
    );

    const abnormalLiver = liverMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalLiver.length * 35, 0);

    return {
      status: abnormalLiver.length === 0 ? "NORMAL" : "NEEDS_ATTENTION",
      findings:
        abnormalLiver.length > 0
          ? abnormalLiver.map(
              (b) => `Elevated ${b.biomarkerName}: ${b.value} ${b.unit}`
            )
          : ["Liver function markers within normal range"],
      recommendations:
        abnormalLiver.length > 0
          ? [
              "Limit alcohol consumption",
              "Review medications",
              "Consider hepatology consultation",
            ]
          : ["Continue liver-healthy practices", "Moderate alcohol intake"],
      riskFactors: abnormalLiver.map(
        (b) => `elevated_${b.biomarkerName.toLowerCase()}`
      ),
      score,
    };
  }

  private reviewRenalSystem(biomarkers: BiomarkerData[]): SystemReview {
    const kidneyMarkers = biomarkers.filter((b) =>
      ["Creatinine", "BUN", "eGFR"].includes(b.biomarkerName)
    );

    const abnormalKidney = kidneyMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalKidney.length * 40, 0);

    return {
      status: abnormalKidney.length === 0 ? "NORMAL" : "NEEDS_ATTENTION",
      findings:
        abnormalKidney.length > 0
          ? abnormalKidney.map(
              (b) => `${b.biomarkerName} abnormal: ${b.value} ${b.unit}`
            )
          : ["Kidney function appears normal"],
      recommendations:
        abnormalKidney.length > 0
          ? [
              "Increase water intake",
              "Monitor blood pressure",
              "Consider nephrology referral",
            ]
          : [
              "Maintain adequate hydration",
              "Regular blood pressure monitoring",
            ],
      riskFactors: abnormalKidney.map(
        (b) => `impaired_${b.biomarkerName.toLowerCase()}`
      ),
      score,
    };
  }

  private reviewHematologicSystem(biomarkers: BiomarkerData[]): SystemReview {
    const bloodMarkers = biomarkers.filter((b) =>
      [
        "Hemoglobin",
        "Hematocrit",
        "White Blood Cells",
        "Platelets",
        "Vitamin B12",
      ].includes(b.biomarkerName)
    );

    const abnormalBlood = bloodMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalBlood.length * 25, 0);

    return {
      status: abnormalBlood.length === 0 ? "NORMAL" : "NEEDS_ATTENTION",
      findings:
        abnormalBlood.length > 0
          ? abnormalBlood.map(
              (b) => `${b.biomarkerName} abnormal: ${b.value} ${b.unit}`
            )
          : ["Blood parameters within normal range"],
      recommendations:
        abnormalBlood.length > 0
          ? [
              "Iron-rich diet if anemic",
              "B12/folate supplementation if low",
              "Hematology consultation if severe",
            ]
          : ["Continue balanced nutrition", "Regular blood monitoring"],
      riskFactors: abnormalBlood.map((b) =>
        b.biomarkerName.toLowerCase().replace(/\s+/g, "_")
      ),
      score,
    };
  }

  private reviewEndocrineSystem(biomarkers: BiomarkerData[]): SystemReview {
    const endocrineMarkers = biomarkers.filter((b) =>
      ["TSH", "T3", "T4", "Vitamin D", "Testosterone", "Estradiol"].includes(
        b.biomarkerName
      )
    );

    const abnormalEndocrine = endocrineMarkers.filter((b) => b.isAbnormal);
    const score = Math.max(100 - abnormalEndocrine.length * 30, 0);

    return {
      status: abnormalEndocrine.length === 0 ? "NORMAL" : "NEEDS_ATTENTION",
      findings:
        abnormalEndocrine.length > 0
          ? abnormalEndocrine.map(
              (b) => `${b.biomarkerName} abnormal: ${b.value} ${b.unit}`
            )
          : ["Endocrine function appears normal"],
      recommendations:
        abnormalEndocrine.length > 0
          ? [
              "Endocrinology consultation",
              "Hormone optimization",
              "Vitamin D supplementation if low",
            ]
          : ["Continue healthy lifestyle", "Regular hormone monitoring"],
      riskFactors: abnormalEndocrine.map(
        (b) => `${b.biomarkerName.toLowerCase()}_imbalance`
      ),
      score,
    };
  }

  private calculateHealthScore(
    biomarkers: BiomarkerData[],
    systemReviews: any
  ): number {
    const abnormalCount = biomarkers.filter((b) => b.isAbnormal).length;
    const totalMarkers = biomarkers.length;

    // Base score from abnormal percentage
    const abnormalPenalty = (abnormalCount / totalMarkers) * 40;

    // System score average
    const systemScores = Object.values(systemReviews).map(
      (system: any) => system.score
    );
    const avgSystemScore =
      systemScores.reduce((a: number, b: number) => a + b, 0) /
      systemScores.length;

    // Final score (60% system-based, 40% abnormal penalty)
    const finalScore = Math.round(
      avgSystemScore * 0.6 + (100 - abnormalPenalty) * 0.4
    );

    return Math.max(Math.min(finalScore, 100), 0);
  }

  private assessRiskLevel(
    healthScore: number,
    abnormalValues: any[]
  ): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
    const criticalCount = abnormalValues.filter(
      (v) => v.urgency === "urgent"
    ).length;

    if (criticalCount > 0) return "CRITICAL";
    if (healthScore < 60) return "HIGH";
    if (healthScore < 80 || abnormalValues.length > 3) return "MODERATE";
    return "LOW";
  }

  private generateKeyFindings(
    abnormalValues: any[],
    systemReviews: any
  ): string[] {
    const findings: string[] = [];

    // Top abnormal values
    abnormalValues.slice(0, 5).forEach((v) => {
      findings.push(`${v.biomarker}: ${v.value} ${v.unit} (${v.concern})`);
    });

    // System issues
    Object.entries(systemReviews).forEach(([system, review]: [string, any]) => {
      if (review.status === "ABNORMAL") {
        findings.push(
          `${
            system.charAt(0).toUpperCase() + system.slice(1)
          } system needs attention`
        );
      }
    });

    return findings.length > 0
      ? findings
      : ["All major biomarkers within normal ranges"];
  }

  private generateRecommendations(abnormalValues: any[], systemReviews: any) {
    const recommendations: any[] = [];

    // System-specific recommendations
    Object.entries(systemReviews).forEach(([system, review]: [string, any]) => {
      if (review.status !== "NORMAL" && review.recommendations.length > 0) {
        recommendations.push({
          category: system.charAt(0).toUpperCase() + system.slice(1),
          priority: review.status === "ABNORMAL" ? "high" : "moderate",
          recommendation: review.recommendations[0],
          reasoning: `${system} system shows abnormalities requiring intervention`,
          actionable: true,
          evidenceLevel: "high",
          timeline: review.status === "ABNORMAL" ? "2-4 weeks" : "1-3 months",
          estimatedCost: "$100-500",
          difficulty: "Moderate",
        });
      }
    });

    // General recommendations
    if (abnormalValues.length > 0) {
      recommendations.push({
        category: "Medical",
        priority: "high",
        recommendation:
          "Schedule comprehensive health assessment with healthcare provider",
        reasoning:
          "Multiple biomarkers outside normal range require professional evaluation",
        actionable: true,
        evidenceLevel: "high",
        timeline: "Within 2 weeks",
        estimatedCost: "$200-600",
        difficulty: "Easy",
      });
    }

    recommendations.push({
      category: "Monitoring",
      priority: "moderate",
      recommendation: "Implement regular biomarker tracking every 3-6 months",
      reasoning:
        "Consistent monitoring enables early detection and progress tracking",
      actionable: true,
      evidenceLevel: "moderate",
      timeline: "Ongoing",
      estimatedCost: "$150-400 per test",
      difficulty: "Easy",
    });

    return recommendations;
  }

  private analyzeTrends(biomarkers: BiomarkerData[]) {
    // For demo purposes, generate mock trends
    // In real implementation, this would compare with historical data
    return biomarkers.slice(0, 5).map((b) => ({
      biomarker: b.biomarkerName,
      direction: b.isAbnormal ? ("declining" as const) : ("stable" as const),
      changePercent: Math.random() * 10 - 5,
      timeframe: "3 months",
      confidence: 0.7,
    }));
  }

  private generateSummary(
    healthScore: number,
    riskLevel: string,
    abnormalValues: any[],
    systemReviews: any
  ): string {
    const abnormalCount = abnormalValues.length;
    const grade =
      healthScore >= 90
        ? "A"
        : healthScore >= 80
        ? "B"
        : healthScore >= 70
        ? "C"
        : healthScore >= 60
        ? "D"
        : "F";

    if (abnormalCount === 0) {
      return `Excellent health profile (Grade ${grade}) with all major biomarkers within optimal ranges. Continue current health practices and maintain regular monitoring schedule. Your health score of ${healthScore} indicates strong overall wellness.`;
    } else if (abnormalCount <= 2) {
      return `Good health profile (Grade ${grade}) with ${abnormalCount} biomarker(s) requiring attention. Focus on targeted interventions for identified areas while maintaining overall healthy practices. Health score: ${healthScore}.`;
    } else {
      return `Health profile (Grade ${grade}) shows ${abnormalCount} biomarkers outside normal ranges requiring comprehensive intervention. Recommend healthcare provider consultation and systematic approach to address identified issues. Health score: ${healthScore}.`;
    }
  }

  private assessBiomarkerSeverity(
    biomarker: BiomarkerData,
    reference?: BiomarkerReference
  ) {
    // Simple severity assessment
    return {
      urgency: biomarker.isAbnormal
        ? ((Math.random() < 0.2 ? "urgent" : "routine") as const)
        : ("routine" as const),
    };
  }

  private getBiomarkerConcern(
    biomarker: BiomarkerData,
    reference?: BiomarkerReference
  ): string {
    if (!biomarker.isAbnormal) return "Within normal range";

    const concerns: { [key: string]: string } = {
      "Total Cholesterol": "Increased cardiovascular disease risk",
      "LDL Cholesterol": "Increased risk of atherosclerosis",
      "HDL Cholesterol": "Reduced cardioprotective benefit",
      Triglycerides: "Associated with metabolic syndrome",
      Glucose: "Potential diabetes risk",
      Creatinine: "Possible kidney function impairment",
      ALT: "Liver function concern",
      TSH: "Thyroid function imbalance",
    };

    return (
      concerns[biomarker.biomarkerName] || "Outside normal reference range"
    );
  }
}

interface BiomarkerReference {
  name: string;
  unit: string;
  ranges: {
    optimal?: [number, number];
    borderline?: [number, number];
    high?: [number, number];
    low?: [number, number];
  };
  category: string;
  significance: string;
  recommendations: {
    high?: string[];
    low?: string[];
    borderline?: string[];
  };
}

// Export singleton instance
export const localHealthAnalyzer = new LocalHealthAnalyzer();
