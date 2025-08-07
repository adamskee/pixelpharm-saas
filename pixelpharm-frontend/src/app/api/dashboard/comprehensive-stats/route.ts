// File: src/app/api/dashboard/comprehensive-stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { limitBiomarkersForPlan, getUserPlanStatus } from "@/lib/plans/plan-utils";
import { PlanType } from "@/lib/stripe/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching comprehensive stats for user: ${userId}`);

    // Check if user exists - get all user profile data
    let user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        cognitoSub: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        weight: true,
        timezone: true,
        name: true,
        image: true,
        emailVerified: true,
        passwordHash: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        bio: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
      }
    });

    if (!user) {
      console.log("🔧 Creating demo user record...");
      try {
        const timestamp = Date.now();
        const emailPart = userId.replace("user-", "").replace(/[^a-z0-9]/g, "");
        const uniqueEmail = userId.includes("@")
          ? userId
          : `${emailPart}-${timestamp}@demo.pixelpharm.com`;

        user = await prisma.user.create({
          data: {
            userId,
            email: uniqueEmail,
            firstName: "Demo",
            lastName: "User",
            cognitoSub: `demo-${userId}`,
          },
        });
        console.log("✅ Demo user created successfully:", user.userId);
      } catch (createError) {
        console.error("❌ Failed to create demo user:", createError);
      }
    }

    // Try to get real data first
    console.log("📊 Fetching real data for user:", userId);

    try {
      // Get file uploads using correct field names from your schema
      const fileUploads = await prisma.fileUpload.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Get ALL biomarker values (not limited to 20)
      let biomarkerValues = [];
      let totalBiomarkerCount = 0;
      let uniqueBiomarkerNames = [];

      try {
        // Get total count of ALL biomarker records
        totalBiomarkerCount = await prisma.biomarkerValue.count({
          where: { userId },
        });

        // Get unique biomarker names
        const uniqueMarkers = await prisma.biomarkerValue.findMany({
          where: { userId },
          select: { biomarkerName: true },
          distinct: ["biomarkerName"],
        });
        uniqueBiomarkerNames = uniqueMarkers.map((m) => m.biomarkerName);

        // Get sample biomarker values for statistics
        const rawBiomarkerValues = await prisma.biomarkerValue.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50, // Get more for better statistics
        });

        // Apply plan-based limitations for Free users (fallback to 'free' if planType doesn't exist)
        const userPlanType = (user as any).planType || 'free';
        const filteredBiomarkerValues = limitBiomarkersForPlan(rawBiomarkerValues, userPlanType);
        
        console.log(`🔒 Plan filtering applied for ${userPlanType} plan: ${rawBiomarkerValues.length} → ${filteredBiomarkerValues.length} biomarkers`);
        
        // Use filtered biomarkers for calculations but keep track of both counts
        biomarkerValues = filteredBiomarkerValues;

        console.log(`📊 Found ${totalBiomarkerCount} total biomarker records`);
        console.log(
          `📊 Found ${uniqueBiomarkerNames.length} unique biomarker types`
        );
        console.log(
          `📊 Sample biomarkers:`,
          biomarkerValues.slice(0, 5).map((b) => b.biomarkerName)
        );
      } catch (biomarkerError) {
        console.log(
          "⚠️ biomarkerValue table not accessible:",
          biomarkerError.message
        );
      }

      // Get blood test results count
      let bloodTestResults = [];
      try {
        bloodTestResults = await prisma.bloodTestResult.findMany({
          where: { userId },
          orderBy: { testDate: "desc" },
        });
      } catch (error) {
        console.log("⚠️ bloodTestResult table not accessible:", error.message);
      }

      console.log(`👤 User profile data:`, {
        age: user?.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender: user?.gender,
        height: user?.height?.toString(),
        weight: user?.weight?.toString(),
      });

      console.log(
        `📊 Found ${fileUploads.length} file uploads and ${totalBiomarkerCount} biomarker records`
      );

      // If we have real data, return real stats
      if (fileUploads.length > 0 || totalBiomarkerCount > 0) {
        console.log("✅ Returning REAL user stats based on database data");

        // Calculate real statistics
        const bloodTestUploads = fileUploads.filter(
          (f) => f.uploadType === "BLOOD_TESTS"
        ).length;

        console.log(`📁 File uploads debug:`, fileUploads.map(f => ({
          uploadType: f.uploadType,
          filename: f.originalFilename,
          createdAt: f.createdAt
        })));

        const bodyCompositionUploads = fileUploads.filter(
          (f) => f.uploadType === "BODY_COMPOSITION"
        ).length;
        
        console.log(`🏋️ Body composition uploads found:`, bodyCompositionUploads);

        // Get body composition data
        let latestBodyComposition = null;
        try {
          latestBodyComposition = await prisma.bodyCompositionResult.findFirst({
            where: { userId },
            orderBy: { testDate: "desc" },
          });
          console.log(`🏋️ Body composition data found:`, latestBodyComposition ? 'Yes' : 'No');
          if (latestBodyComposition) {
            console.log(`🏋️ Body composition basic values:`, {
              weight: latestBodyComposition.totalWeight?.toString(),
              bodyFat: latestBodyComposition.bodyFatPercentage?.toString(),
              muscleMass: latestBodyComposition.skeletalMuscleMass?.toString(),
              testDate: latestBodyComposition.testDate
            });
            
            // Debug rawData structure
            if (latestBodyComposition.rawData) {
              console.log(`🏋️ RawData structure available:`, Object.keys(latestBodyComposition.rawData));
              if (latestBodyComposition.rawData.bodyComposition) {
                console.log(`🏋️ Body composition detailed data:`, Object.keys(latestBodyComposition.rawData.bodyComposition));
                
                // Show sample values
                const bc = latestBodyComposition.rawData.bodyComposition;
                console.log(`🏋️ Sample detailed metrics:`, {
                  totalWeight: bc.totalWeight,
                  bodyFatPercentage: bc.bodyFatPercentage,
                  muscle: bc.muscle ? Object.keys(bc.muscle) : 'none',
                  fat: bc.fat ? Object.keys(bc.fat) : 'none',
                  water: bc.water ? Object.keys(bc.water) : 'none',
                  phaseAngle: bc.phaseAngle,
                  ecwTbwRatio: bc.ecwTbwRatio
                });
              } else {
                console.log(`🏋️ No bodyComposition field in rawData`);
              }
            } else {
              console.log(`🏋️ No rawData available in body composition result`);
            }
          }
        } catch (error) {
          console.log("⚠️ bodyCompositionResult table not accessible:", error.message);
        }

        const abnormalBiomarkers = biomarkerValues.filter(
          (b) => b.isAbnormal
        ).length;

        // For critical, check for high-risk biomarker values
        const criticalBiomarkers = biomarkerValues.filter((b) => {
          if (!b.isAbnormal) return false;

          // Define critical thresholds based on biomarker name and value
          const name = b.biomarkerName.toLowerCase();
          const value = parseFloat(b.value.toString());

          if (name.includes("cholesterol") && value > 7.0) return true;
          if (name.includes("glucose") && value > 11.0) return true;
          if (name.includes("creatinine") && value > 150) return true;

          return false;
        }).length;

        const normalBiomarkers = totalBiomarkerCount - abnormalBiomarkers;

        // Calculate health score based on real data (biomarkers + body composition)
        let healthScore = 100;
        
        // Biomarker-based scoring
        if (abnormalBiomarkers > 0)
          healthScore -= Math.min(abnormalBiomarkers * 5, 50);
        if (criticalBiomarkers > 0) healthScore -= criticalBiomarkers * 15;
        
        // Body composition-based scoring
        if (latestBodyComposition) {
          console.log('🏋️ Including body composition in health score calculation');
          
          // BMI scoring (if we have height from user profile)
          if (user?.height && latestBodyComposition.totalWeight) {
            const height = parseFloat(user.height.toString()) / 100; // convert cm to m
            const weight = parseFloat(latestBodyComposition.totalWeight.toString());
            const bmi = weight / (height * height);
            
            console.log(`🏋️ BMI calculation: ${bmi.toFixed(1)}`);
            
            // BMI scoring: optimal range 18.5-24.9
            if (bmi < 18.5) healthScore -= 10; // underweight
            else if (bmi > 30) healthScore -= 20; // obese
            else if (bmi > 25) healthScore -= 10; // overweight
            else healthScore += 5; // healthy BMI bonus
          }
          
          // Body fat percentage scoring
          if (latestBodyComposition.bodyFatPercentage && user?.gender) {
            const bodyFat = parseFloat(latestBodyComposition.bodyFatPercentage.toString());
            const gender = user.gender.toLowerCase();
            
            console.log(`🏋️ Body fat: ${bodyFat}% (${gender})`);
            
            // Gender-specific healthy body fat ranges
            let isHealthyBodyFat = false;
            if (gender === 'male') {
              isHealthyBodyFat = bodyFat >= 10 && bodyFat <= 20;
              if (bodyFat > 25) healthScore -= 15;
              else if (bodyFat > 22) healthScore -= 8;
              else if (isHealthyBodyFat) healthScore += 5;
            } else if (gender === 'female') {
              isHealthyBodyFat = bodyFat >= 16 && bodyFat <= 30;
              if (bodyFat > 35) healthScore -= 15;
              else if (bodyFat > 32) healthScore -= 8;
              else if (isHealthyBodyFat) healthScore += 5;
            }
          }
          
          // Muscle mass scoring (if available)
          if (latestBodyComposition.skeletalMuscleMass) {
            const muscleMass = parseFloat(latestBodyComposition.skeletalMuscleMass.toString());
            console.log(`🏋️ Muscle mass: ${muscleMass}kg`);
            
            // Higher muscle mass is generally positive for health
            if (muscleMass > 30) healthScore += 5; // good muscle mass
            else if (muscleMass < 20) healthScore -= 5; // low muscle mass concern
          }
          
          console.log(`🏋️ Health score after body composition: ${healthScore}`);
        }
        
        healthScore = Math.max(20, Math.min(100, healthScore));

        // Determine risk level (biomarkers + body composition)
        let riskLevel = "LOW";
        let bodyCompositionRiskFactors = 0;
        
        // Check body composition risk factors
        if (latestBodyComposition && user?.height) {
          const weight = latestBodyComposition.totalWeight ? parseFloat(latestBodyComposition.totalWeight.toString()) : null;
          const bodyFat = latestBodyComposition.bodyFatPercentage ? parseFloat(latestBodyComposition.bodyFatPercentage.toString()) : null;
          
          if (weight) {
            const height = parseFloat(user.height.toString()) / 100;
            const bmi = weight / (height * height);
            
            if (bmi > 35) bodyCompositionRiskFactors += 2; // severe obesity
            else if (bmi > 30) bodyCompositionRiskFactors += 1; // obesity
            else if (bmi < 18.5) bodyCompositionRiskFactors += 1; // underweight
          }
          
          if (bodyFat && user?.gender) {
            const gender = user.gender.toLowerCase();
            if ((gender === 'male' && bodyFat > 25) || (gender === 'female' && bodyFat > 35)) {
              bodyCompositionRiskFactors += 1; // high body fat
            }
          }
        }
        
        // Combined risk assessment
        if (criticalBiomarkers > 0 || bodyCompositionRiskFactors >= 2) riskLevel = "CRITICAL";
        else if (abnormalBiomarkers > 3 || (abnormalBiomarkers > 1 && bodyCompositionRiskFactors >= 1)) riskLevel = "HIGH";
        else if (abnormalBiomarkers > 1 || bodyCompositionRiskFactors >= 1) riskLevel = "MODERATE";
        
        console.log(`🏋️ Risk assessment: biomarkers(${abnormalBiomarkers}), body composition factors(${bodyCompositionRiskFactors}), final risk: ${riskLevel}`);

        // Calculate data completeness (biomarkers + body composition + user profile)
        let completenessScore = 0;
        const maxCompleteness = 100;
        
        // Biomarker completeness (60% of total score)
        const expectedBiomarkers = 25;
        const biomarkerCompleteness = Math.min(60, (uniqueBiomarkerNames.length / expectedBiomarkers) * 60);
        completenessScore += biomarkerCompleteness;
        
        // Body composition completeness (25% of total score)
        if (latestBodyComposition) {
          let bodyCompositionFields = 0;
          if (latestBodyComposition.totalWeight) bodyCompositionFields++;
          if (latestBodyComposition.bodyFatPercentage) bodyCompositionFields++;
          if (latestBodyComposition.skeletalMuscleMass) bodyCompositionFields++;
          
          const bodyCompleteness = (bodyCompositionFields / 3) * 25;
          completenessScore += bodyCompleteness;
          console.log(`🏋️ Body composition completeness: ${bodyCompleteness}% (${bodyCompositionFields}/3 fields)`);
        }
        
        // User profile completeness (15% of total score)
        let profileFields = 0;
        if (user?.height) profileFields++;
        if (user?.weight) profileFields++;
        if (user?.dateOfBirth) profileFields++;
        if (user?.gender) profileFields++;
        
        const profileCompleteness = (profileFields / 4) * 15;
        completenessScore += profileCompleteness;
        
        const dataCompleteness = Math.min(100, Math.round(completenessScore));
        console.log(`🏋️ Data completeness: ${dataCompleteness}% (biomarkers: ${biomarkerCompleteness}%, body: ${latestBodyComposition ? (completenessScore - biomarkerCompleteness - profileCompleteness) : 0}%, profile: ${profileCompleteness}%)`);

        const realStats = {
          user,
          healthMetrics: {
            totalReports: bloodTestResults.length || bloodTestUploads,
            latestHealthScore: healthScore,
            riskLevel,
            lastAnalysisDate: fileUploads[0]?.createdAt?.toISOString() || null,
          },
          biomarkers: {
            // Show total available biomarker count (not filtered) so component knows data exists
            totalBiomarkers: totalBiomarkerCount, // Total available biomarkers
            uniqueBiomarkers: uniqueBiomarkerNames.length,
            abnormalCount: abnormalBiomarkers,
            criticalCount: criticalBiomarkers,
            normalCount: biomarkerValues.length - abnormalBiomarkers - criticalBiomarkers, // Based on filtered analysis
            lastTestDate:
              bloodTestResults[0]?.testDate?.toISOString() ||
              biomarkerValues[0]?.createdAt?.toISOString() ||
              fileUploads[0]?.createdAt?.toISOString() ||
              null,
            // Add plan filtering info for dashboard components
            _planFiltering: {
              totalAvailable: totalBiomarkerCount,
              displayedCount: biomarkerValues.length,
              planType: userPlanType,
              isFiltered: totalBiomarkerCount > biomarkerValues.length,
              allowedByPlan: biomarkerValues.length
            }
          },
          bodyComposition: {
            totalScans: bodyCompositionUploads,
            // Prioritize user's current weight over body composition scan weight for BMI calculation
            latestBMI: user?.weight && user?.height 
              ? parseFloat((parseFloat(user.weight.toString()) / 
                  Math.pow(parseFloat(user.height.toString()) / 100, 2)).toFixed(1))
              : latestBodyComposition?.totalWeight && user?.height 
                ? parseFloat((parseFloat(latestBodyComposition.totalWeight.toString()) / 
                    Math.pow(parseFloat(user.height.toString()) / 100, 2)).toFixed(1))
                : null,
            bodyFatPercentage: latestBodyComposition?.bodyFatPercentage 
              ? parseFloat(latestBodyComposition.bodyFatPercentage.toString())
              : null,
            muscleMass: latestBodyComposition?.skeletalMuscleMass 
              ? parseFloat(latestBodyComposition.skeletalMuscleMass.toString())
              : null,
            lastScanDate: latestBodyComposition?.testDate?.toISOString() ||
              fileUploads
                .find((f) => f.uploadType === "BODY_COMPOSITION")
                ?.createdAt?.toISOString() || null,
            
            // Extract all detailed metrics from rawData
            ...(latestBodyComposition?.rawData?.bodyComposition ? {
              // Basic metrics (may override above if more detailed data available)
              totalWeight: latestBodyComposition.rawData.bodyComposition.totalWeight || latestBodyComposition.totalWeight,
              bodyFatPercentage: latestBodyComposition.rawData.bodyComposition.bodyFatPercentage || latestBodyComposition.bodyFatPercentage,
              skeletalMuscleMass: latestBodyComposition.rawData.bodyComposition.skeletalMuscleMass || latestBodyComposition.skeletalMuscleMass,
              visceralFatLevel: latestBodyComposition.rawData.bodyComposition.visceralFatLevel || latestBodyComposition.visceralFatLevel,
              bmr: latestBodyComposition.rawData.bodyComposition.bmr || latestBodyComposition.bmr,
              
              // Advanced composition metrics
              bodyFatMass: latestBodyComposition.rawData.bodyComposition.fat?.bodyFatMass,
              leanMass: latestBodyComposition.rawData.bodyComposition.muscle?.dryLeanMass,
              
              // Hydration & minerals
              totalBodyWater: latestBodyComposition.rawData.bodyComposition.water?.totalBodyWater,
              proteinMass: latestBodyComposition.rawData.bodyComposition.metabolic?.proteinMass,
              boneMineralContent: latestBodyComposition.rawData.bodyComposition.mineral?.boneMineralContent,
              
              // Segmental analysis
              rightArmMuscle: latestBodyComposition.rawData.bodyComposition.muscle?.rightArm,
              leftArmMuscle: latestBodyComposition.rawData.bodyComposition.muscle?.leftArm,
              trunkMuscle: latestBodyComposition.rawData.bodyComposition.muscle?.trunk,
              rightLegMuscle: latestBodyComposition.rawData.bodyComposition.muscle?.rightLeg,
              leftLegMuscle: latestBodyComposition.rawData.bodyComposition.muscle?.leftLeg,
              
              // Advanced InBody metrics
              phaseAngle: latestBodyComposition.rawData.bodyComposition.phaseAngle,
              ecwTbwRatio: latestBodyComposition.rawData.bodyComposition.ecwTbwRatio,
              intracellularWater: latestBodyComposition.rawData.bodyComposition.water?.intracellularWater,
              extracellularWater: latestBodyComposition.rawData.bodyComposition.water?.extracellularWater,
              
              // Device information
              deviceModel: latestBodyComposition.rawData.deviceInfo?.deviceModel,
              facilityName: latestBodyComposition.rawData.deviceInfo?.facilityName,
            } : {}),
          },
          trends: {
            healthScoreTrend:
              healthScore >= 75
                ? "positive"
                : healthScore >= 50
                ? "stable"
                : "concerning",
            weightTrend: "stable",
            cholesterolTrend: abnormalBiomarkers > 0 ? "concerning" : "stable",
            overallTrend: riskLevel === "LOW" ? "positive" : "concerning",
          },
          recentActivity: fileUploads.slice(0, 5).map((upload) => ({
            type:
              upload.uploadType?.toLowerCase().replace("_", "_") || "general",
            date: upload.createdAt.toISOString(),
            description: `${
              upload.uploadType?.replace("_", " ").toLowerCase() || "file"
            } uploaded: ${upload.originalFilename}`,
            status: "completed",
          })),
          recommendations: {
            activeCount: Math.max(1, abnormalBiomarkers),
            highPriorityCount:
              criticalBiomarkers + Math.floor(abnormalBiomarkers / 2),
            completedCount: 0,
            categories:
              criticalBiomarkers > 0
                ? ["medical", "monitoring"]
                : ["lifestyle", "monitoring"],
          },
          dataQuality: {
            completeness: dataCompleteness,
            reliability:
              totalBiomarkerCount > 10
                ? "HIGH"
                : fileUploads.length > 2
                ? "MEDIUM"
                : "LOW",
            lastUpdated: new Date().toISOString(),
          },
          performance: {
            processingTime: 450,
            cacheHit: false,
            dataSource: "database",
            generatedAt: new Date().toISOString(),
          },
          // Enhanced debug info
          _debug: {
            fileUploadsFound: fileUploads.length,
            totalBiomarkerRecords: totalBiomarkerCount, // Total count
            uniqueBiomarkerTypes: uniqueBiomarkerNames.length, // Unique types
            bloodTestResults: bloodTestResults.length,
            userId: userId,
            mostRecentUpload: fileUploads[0]?.originalFilename || "None",
            mostRecentUploadDate:
              fileUploads[0]?.createdAt?.toISOString() || "None",
            sampleBiomarkers: uniqueBiomarkerNames.slice(0, 10), // Show sample names
          },
        };

        // Add plan status for frontend display (gracefully handle missing fields)
        try {
          const planStatus = await getUserPlanStatus(userId);
          realStats.planStatus = planStatus;
          console.log(`📊 Added plan status: ${planStatus.currentPlan}, uploads used: ${planStatus.uploadsUsed}`);
        } catch (planError) {
          console.warn("⚠️ Could not fetch plan status (likely missing DB fields):", planError.message);
          // Provide default plan status for users without the new fields
          realStats.planStatus = {
            currentPlan: 'free',
            uploadsUsed: 0,
            uploadsRemaining: 1,
            canUpload: true,
            needsUpgrade: false,
            limits: {
              maxUploads: 1,
              maxBiomarkers: 3,
              hasHealthOptimization: true, // Allow free users to access these features
              hasAdvancedAnalytics: false,
            },
          };
        }

        return NextResponse.json(realStats);
      } else {
        console.log("📊 No file uploads or biomarkers found for user:", userId);
      }
    } catch (fetchError) {
      console.error("❌ Error fetching real user data:", fetchError);
    }

    // Return empty stats for new users (no demo data)
    console.log("📊 No real data found, returning empty stats for new user");

    const emptyStats = {
      user: user || {
        userId,
        email: `${userId}@demo.com`,
        firstName: "New",
        lastName: "User",
      },
      healthMetrics: {
        totalReports: 0,
        latestHealthScore: 0,
        riskLevel: "UNKNOWN",
        lastAnalysisDate: null,
      },
      biomarkers: {
        totalBiomarkers: 0,
        uniqueBiomarkers: 0,
        abnormalCount: 0,
        criticalCount: 0,
        normalCount: 0,
        lastTestDate: null,
      },
      bodyComposition: {
        totalScans: 0,
        latestBMI: null,
        bodyFatPercentage: null,
        muscleMass: null,
        lastScanDate: null,
      },
      trends: {
        healthScoreTrend: "unknown",
        weightTrend: "unknown",
        cholesterolTrend: "unknown",
        overallTrend: "unknown",
      },
      recentActivity: [],
      recommendations: {
        activeCount: 0,
        highPriorityCount: 0,
        completedCount: 0,
        categories: [],
      },
      dataQuality: {
        completeness: 0,
        reliability: "NONE",
        lastUpdated: new Date().toISOString(),
      },
      performance: {
        processingTime: 150,
        cacheHit: false,
        dataSource: "empty",
        generatedAt: new Date().toISOString(),
      },
      _debug: {
        reason: "New user - no health data uploaded yet",
        userId: userId,
        isNewUser: true,
      },
    };

    return NextResponse.json(emptyStats);
  } catch (error) {
    console.error("❌ Comprehensive stats API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Unable to fetch comprehensive stats",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
