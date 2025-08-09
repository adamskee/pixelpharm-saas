// File: src/app/api/dashboard/comprehensive-stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
// TEMPORARILY DISABLED - PLAN FIELDS REMOVED FROM SCHEMA
// import { limitBiomarkersForPlan, getUserPlanStatus } from "@/lib/plans/plan-utils";
// import { PlanType } from "@/lib/stripe/config";

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
      const fileUploads = await prisma.file_uploads.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 10,
      });

      // Get ALL biomarker values (not limited to 20)
      let biomarkerValues = [];
      let totalBiomarkerCount = 0;
      let uniqueBiomarkerNames = [];

      try {
        // Get total count of ALL biomarker records
        totalBiomarkerCount = await prisma.biomarker_values.count({
          where: { user_id: userId },
        });

        // Get unique biomarker names
        const uniqueMarkers = await prisma.biomarker_values.findMany({
          where: { user_id: userId },
          select: { biomarker_name: true },
          distinct: ["biomarker_name"],
        });
        uniqueBiomarkerNames = uniqueMarkers.map((m) => m.biomarker_name);

        // Get sample biomarker values for statistics
        const rawBiomarkerValues = await prisma.biomarker_values.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          take: 50, // Get more for better statistics
        });

        // TEMPORARY FREE PLAN LIMITATION - Hardcode to 3 biomarkers for now
        const FREE_PLAN_BIOMARKER_LIMIT = 3;
        
        // Get unique biomarkers first, then limit
        const uniqueBiomarkersByName = new Map();
        rawBiomarkerValues.forEach(biomarker => {
          if (!uniqueBiomarkersByName.has(biomarker.biomarker_name)) {
            uniqueBiomarkersByName.set(biomarker.biomarker_name, biomarker);
          }
        });
        
        const uniqueBiomarkers = Array.from(uniqueBiomarkersByName.values());
        
        if (uniqueBiomarkers.length > FREE_PLAN_BIOMARKER_LIMIT) {
          biomarkerValues = uniqueBiomarkers.slice(0, FREE_PLAN_BIOMARKER_LIMIT);
          console.log(`📊 Applied temporary free plan limit: ${uniqueBiomarkers.length} unique → ${biomarkerValues.length} biomarkers`);
        } else {
          biomarkerValues = uniqueBiomarkers;
          console.log(`📊 Using all biomarkers (within free limit): ${biomarkerValues.length}`);
        }

        console.log(`📊 Found ${totalBiomarkerCount} total biomarker records`);
        console.log(
          `📊 Found ${uniqueBiomarkerNames.length} unique biomarker types`
        );
        console.log(
          `📊 Sample biomarkers:`,
          biomarkerValues.slice(0, 5).map((b) => b.biomarker_name)
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
        bloodTestResults = await prisma.blood_test_results.findMany({
          where: { user_id: userId },
          orderBy: { test_date: "desc" },
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
          (f) => f.upload_type === "BLOOD_TESTS"
        ).length;

        console.log(`📁 File uploads debug:`, fileUploads.map(f => ({
          uploadType: f.upload_type,
          filename: f.original_filename,
          createdAt: f.created_at
        })));

        const bodyCompositionUploads = fileUploads.filter(
          (f) => f.upload_type === "BODY_COMPOSITION"
        ).length;
        
        console.log(`🏋️ Body composition uploads found:`, bodyCompositionUploads);

        // Get body composition data
        let latestBodyComposition = null;
        try {
          latestBodyComposition = await prisma.body_composition_results.findFirst({
            where: { user_id: userId },
            orderBy: { test_date: "desc" },
          });
          console.log(`🏋️ Body composition data found:`, latestBodyComposition ? 'Yes' : 'No');
          if (latestBodyComposition) {
            console.log(`🏋️ Body composition basic values:`, {
              weight: latestBodyComposition.total_weight?.toString(),
              bodyFat: latestBodyComposition.body_fat_percentage?.toString(),
              muscleMass: latestBodyComposition.skeletal_muscle_mass?.toString(),
              testDate: latestBodyComposition.test_date
            });
            
            // Debug rawData structure
            if (latestBodyComposition.raw_data) {
              console.log(`🏋️ RawData structure available:`, Object.keys(latestBodyComposition.raw_data));
              if (latestBodyComposition.raw_data.bodyComposition) {
                console.log(`🏋️ Body composition detailed data:`, Object.keys(latestBodyComposition.raw_data.bodyComposition));
                
                // Show sample values
                const bc = latestBodyComposition.raw_data.bodyComposition;
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
          (b) => b.is_abnormal
        ).length;

        // For critical, check for high-risk biomarker values
        const criticalBiomarkers = biomarkerValues.filter((b) => {
          if (!b.is_abnormal) return false;

          // Define critical thresholds based on biomarker name and value
          const name = b.biomarker_name.toLowerCase();
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
          if (user?.height && latestBodyComposition.total_weight) {
            const height = parseFloat(user.height.toString()) / 100; // convert cm to m
            const weight = parseFloat(latestBodyComposition.total_weight.toString());
            const bmi = weight / (height * height);
            
            console.log(`🏋️ BMI calculation: ${bmi.toFixed(1)}`);
            
            // BMI scoring: optimal range 18.5-24.9
            if (bmi < 18.5) healthScore -= 10; // underweight
            else if (bmi > 30) healthScore -= 20; // obese
            else if (bmi > 25) healthScore -= 10; // overweight
            else healthScore += 5; // healthy BMI bonus
          }
          
          // Body fat percentage scoring
          if (latestBodyComposition.body_fat_percentage && user?.gender) {
            const bodyFat = parseFloat(latestBodyComposition.body_fat_percentage.toString());
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
          if (latestBodyComposition.skeletal_muscle_mass) {
            const muscleMass = parseFloat(latestBodyComposition.skeletal_muscle_mass.toString());
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
          const weight = latestBodyComposition.total_weight ? parseFloat(latestBodyComposition.total_weight.toString()) : null;
          const bodyFat = latestBodyComposition.body_fat_percentage ? parseFloat(latestBodyComposition.body_fat_percentage.toString()) : null;
          
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
          if (latestBodyComposition.total_weight) bodyCompositionFields++;
          if (latestBodyComposition.body_fat_percentage) bodyCompositionFields++;
          if (latestBodyComposition.skeletal_muscle_mass) bodyCompositionFields++;
          
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
            lastAnalysisDate: fileUploads[0]?.created_at?.toISOString() || null,
          },
          biomarkers: {
            // Show total available biomarker count (not filtered) so component knows data exists
            totalBiomarkers: totalBiomarkerCount, // Total available biomarkers
            uniqueBiomarkers: uniqueBiomarkerNames.length,
            abnormalCount: abnormalBiomarkers,
            criticalCount: criticalBiomarkers,
            normalCount: biomarkerValues.length - abnormalBiomarkers - criticalBiomarkers, // Based on filtered analysis
            lastTestDate:
              bloodTestResults[0]?.test_date?.toISOString() ||
              biomarkerValues[0]?.created_at?.toISOString() ||
              fileUploads[0]?.created_at?.toISOString() ||
              null,
            // TEMPORARILY DISABLED - Plan filtering info removed
            // _planFiltering: {
            //   totalAvailable: totalBiomarkerCount,
            //   displayedCount: biomarkerValues.length,
            //   planType: userPlanType,
            //   isFiltered: totalBiomarkerCount > biomarkerValues.length,
            //   allowedByPlan: biomarkerValues.length
            // }
          },
          bodyComposition: {
            totalScans: bodyCompositionUploads,
            // Prioritize user's current weight over body composition scan weight for BMI calculation
            latestBMI: user?.weight && user?.height 
              ? parseFloat((parseFloat(user.weight.toString()) / 
                  Math.pow(parseFloat(user.height.toString()) / 100, 2)).toFixed(1))
              : latestBodyComposition?.total_weight && user?.height 
                ? parseFloat((parseFloat(latestBodyComposition.total_weight.toString()) / 
                    Math.pow(parseFloat(user.height.toString()) / 100, 2)).toFixed(1))
                : null,
            bodyFatPercentage: latestBodyComposition?.body_fat_percentage 
              ? parseFloat(latestBodyComposition.body_fat_percentage.toString())
              : null,
            muscleMass: latestBodyComposition?.skeletal_muscle_mass 
              ? parseFloat(latestBodyComposition.skeletal_muscle_mass.toString())
              : null,
            lastScanDate: latestBodyComposition?.test_date?.toISOString() ||
              fileUploads
                .find((f) => f.upload_type === "BODY_COMPOSITION")
                ?.created_at?.toISOString() || null,
            
            // Extract all detailed metrics from rawData
            ...(latestBodyComposition?.raw_data?.bodyComposition ? {
              // Basic metrics (may override above if more detailed data available)
              totalWeight: latestBodyComposition.raw_data.bodyComposition.totalWeight || latestBodyComposition.total_weight,
              bodyFatPercentage: latestBodyComposition.raw_data.bodyComposition.bodyFatPercentage || latestBodyComposition.body_fat_percentage,
              skeletalMuscleMass: latestBodyComposition.raw_data.bodyComposition.skeletalMuscleMass || latestBodyComposition.skeletal_muscle_mass,
              visceralFatLevel: latestBodyComposition.raw_data.bodyComposition.visceralFatLevel || latestBodyComposition.visceral_fat_level,
              bmr: latestBodyComposition.raw_data.bodyComposition.bmr || latestBodyComposition.bmr,
              
              // Advanced composition metrics
              bodyFatMass: latestBodyComposition.raw_data.bodyComposition.fat?.bodyFatMass,
              leanMass: latestBodyComposition.raw_data.bodyComposition.muscle?.dryLeanMass,
              
              // Hydration & minerals
              totalBodyWater: latestBodyComposition.raw_data.bodyComposition.water?.totalBodyWater,
              proteinMass: latestBodyComposition.raw_data.bodyComposition.metabolic?.proteinMass,
              boneMineralContent: latestBodyComposition.raw_data.bodyComposition.mineral?.boneMineralContent,
              
              // Segmental analysis
              rightArmMuscle: latestBodyComposition.raw_data.bodyComposition.muscle?.rightArm,
              leftArmMuscle: latestBodyComposition.raw_data.bodyComposition.muscle?.leftArm,
              trunkMuscle: latestBodyComposition.raw_data.bodyComposition.muscle?.trunk,
              rightLegMuscle: latestBodyComposition.raw_data.bodyComposition.muscle?.rightLeg,
              leftLegMuscle: latestBodyComposition.raw_data.bodyComposition.muscle?.leftLeg,
              
              // Advanced InBody metrics
              phaseAngle: latestBodyComposition.raw_data.bodyComposition.phaseAngle,
              ecwTbwRatio: latestBodyComposition.raw_data.bodyComposition.ecwTbwRatio,
              intracellularWater: latestBodyComposition.raw_data.bodyComposition.water?.intracellularWater,
              extracellularWater: latestBodyComposition.raw_data.bodyComposition.water?.extracellularWater,
              
              // Device information
              deviceModel: latestBodyComposition.raw_data.deviceInfo?.deviceModel,
              facilityName: latestBodyComposition.raw_data.deviceInfo?.facilityName,
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
              upload.upload_type?.toLowerCase().replace("_", "_") || "general",
            date: upload.created_at.toISOString(),
            description: `${
              upload.upload_type?.replace("_", " ").toLowerCase() || "file"
            } uploaded: ${upload.original_filename}`,
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
            mostRecentUpload: fileUploads[0]?.original_filename || "None",
            mostRecentUploadDate:
              fileUploads[0]?.created_at?.toISOString() || "None",
            sampleBiomarkers: uniqueBiomarkerNames.slice(0, 10), // Show sample names
          },
        };

        // TEMPORARY FREE PLAN STATUS - Hardcoded until schema is updated
        const totalUniqueBiomarkers = uniqueBiomarkerNames.length;
        const FREE_PLAN_BIOMARKER_LIMIT = 3;
        
        realStats.planStatus = {
          currentPlan: 'free',
          uploadsUsed: 1, // Show that they've used their upload
          uploadsRemaining: 0, // No more uploads for free users after first one
          canUpload: false, // Free users get 1 upload only
          needsUpgrade: totalUniqueBiomarkers > FREE_PLAN_BIOMARKER_LIMIT, // Show upgrade prompt if they have more data
          limits: {
            maxUploads: 1,
            maxBiomarkers: FREE_PLAN_BIOMARKER_LIMIT,
            hasHealthOptimization: true,
            hasAdvancedAnalytics: false,
          },
        };
        console.log(`📊 Added temporary free plan status: ${totalUniqueBiomarkers} total biomarkers, showing ${Math.min(totalUniqueBiomarkers, FREE_PLAN_BIOMARKER_LIMIT)}`);

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
