import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('📤 Exporting data for user:', session.user.email);

    let exportData;
    
    try {
      console.log('🔍 Attempting database connection...');
      
      // Get user ID from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { userId: true }
      });

      console.log('👤 Database query result:', user ? 'User found' : 'User not found');

      if (!user) {
        console.log('⚠️ User not found in database, creating basic export');
        // Fallback to basic export if user not in database
        exportData = {
          exportInfo: {
            exportDate: new Date().toISOString(),
            email: session.user.email,
            userId: session.user.id || 'unknown',
            version: '1.5',
            description: 'Basic export - user not found in database'
          },
          profile: {
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            provider: session.user.provider || 'unknown'
          },
          note: 'This user does not have data in the PixelPharm database yet.'
        };
        console.log('✅ Basic export data created');
      } else {
        const userId = user.userId;
        console.log('📋 Found user ID:', userId);

        // Collect all user data from database
        const [
          userData,
          fileUploads,
          bloodTestResults,
          biomarkerValues,
          bodyCompositionResults,
          fitnessActivities,
          healthInsights,
          medicalReviews,
          aiProcessingResults
        ] = await Promise.all([
          // User profile data
          prisma.user.findUnique({
            where: { userId },
            select: {
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              dateOfBirth: true,
              gender: true,
              timezone: true,
              bio: true,
              height: true,
              weight: true,
              provider: true,
              subscriptionStatus: true,
              subscriptionPlan: true,
              subscriptionExpiresAt: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // File uploads
          prisma.fileUpload.findMany({
            where: { userId },
            select: {
              uploadId: true,
              originalFilename: true,
              fileType: true,
              uploadType: true,
              fileSize: true,
              uploadStatus: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // Blood test results
          prisma.bloodTestResult.findMany({
            where: { userId },
            select: {
              resultId: true,
              testDate: true,
              labName: true,
              biomarkers: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // Biomarker values
          prisma.biomarkerValue.findMany({
            where: { userId },
            select: {
              valueId: true,
              biomarkerName: true,
              value: true,
              unit: true,
              referenceRange: true,
              isAbnormal: true,
              testDate: true,
              createdAt: true
            }
          }),

          // Body composition results
          prisma.bodyCompositionResult.findMany({
            where: { userId },
            select: {
              compositionId: true,
              testDate: true,
              totalWeight: true,
              bodyFatPercentage: true,
              skeletalMuscleMass: true,
              visceralFatLevel: true,
              bmr: true,
              rawData: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // Fitness activities
          prisma.fitnessActivity.findMany({
            where: { userId },
            select: {
              activityId: true,
              activityDate: true,
              activityType: true,
              durationMinutes: true,
              caloriesBurned: true,
              avgHeartRate: true,
              maxHeartRate: true,
              distanceKm: true,
              rawData: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // Health insights
          prisma.healthInsight.findMany({
            where: { userId },
            select: {
              insightId: true,
              insightType: true,
              title: true,
              description: true,
              priority: true,
              dataSources: true,
              aiConfidence: true,
              isRead: true,
              expiresAt: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // Medical reviews
          prisma.medicalReview.findMany({
            where: { userId },
            select: {
              id: true,
              overallHealthScore: true,
              healthGrade: true,
              riskLevel: true,
              primaryRisks: true,
              criticalFindings: true,
              abnormalFindings: true,
              dataCompleteness: true,
              nextReviewDate: true,
              analysisVersion: true,
              createdAt: true,
              updatedAt: true
            }
          }),

          // AI processing results (excluding sensitive raw results)
          prisma.aiProcessingResult.findMany({
            where: { userId },
            select: {
              processingId: true,
              processingType: true,
              confidenceScore: true,
              processingStatus: true,
              errorMessage: true,
              createdAt: true,
              processedAt: true
            }
          })
        ]);

        console.log('📊 Data collection complete:', {
          uploads: fileUploads.length,
          bloodTests: bloodTestResults.length,
          biomarkers: biomarkerValues.length,
          bodyComposition: bodyCompositionResults.length,
          fitness: fitnessActivities.length,
          insights: healthInsights.length,
          reviews: medicalReviews.length,
          processing: aiProcessingResults.length
        });

        // Structure the comprehensive export data
        exportData = {
          exportInfo: {
            exportDate: new Date().toISOString(),
            userId: userId,
            email: session.user.email,
            version: '2.0',
            description: 'Complete PixelPharm health data export'
          },
          profile: userData,
          uploads: {
            count: fileUploads.length,
            data: fileUploads
          },
          bloodTests: {
            count: bloodTestResults.length,
            results: bloodTestResults,
            biomarkers: {
              count: biomarkerValues.length,
              values: biomarkerValues
            }
          },
          bodyComposition: {
            count: bodyCompositionResults.length,
            data: bodyCompositionResults
          },
          fitness: {
            count: fitnessActivities.length,
            activities: fitnessActivities
          },
          health: {
            insights: {
              count: healthInsights.length,
              data: healthInsights
            },
            medicalReviews: {
              count: medicalReviews.length,
              data: medicalReviews
            }
          },
          processing: {
            count: aiProcessingResults.length,
            results: aiProcessingResults
          }
        };
        console.log('✅ Full database export data created');
      }
    } catch (dbError: any) {
      console.error('Database query failed, falling back to basic export:', dbError);
      // Fallback to basic export if database queries fail
      exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          email: session.user.email,
          userId: session.user.id || 'unknown',
          version: '1.5',
          description: 'Basic export - database queries failed'
        },
        profile: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          provider: session.user.provider || 'unknown'
        },
        error: `Database access failed: ${dbError.message}`,
        note: 'Full data export unavailable due to database connection issues.'
      };
      console.log('✅ Fallback export data created');
    }

    console.log('📋 Export data status:', exportData ? 'Ready' : 'Missing');

    // Convert to JSON string with proper formatting
    let jsonString;
    try {
      // Custom replacer function to handle BigInt values
      jsonString = JSON.stringify(exportData, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }, 2);
    } catch (jsonError: any) {
      console.error('JSON stringify failed:', jsonError);
      // Fallback to minimal export
      const fallbackData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          email: session.user.email,
          version: '1.0',
          description: 'Minimal export due to JSON serialization error'
        },
        error: `JSON serialization failed: ${jsonError.message}`,
        profile: {
          email: session.user.email,
          name: session.user.name || 'Unknown'
        }
      };
      jsonString = JSON.stringify(fallbackData, null, 2);
    }

    // Ensure we have a valid JSON string
    if (!jsonString) {
      jsonString = JSON.stringify({
        error: 'Export failed',
        exportDate: new Date().toISOString()
      }, null, 2);
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pixelpharm-data-export-${timestamp}.json`;

    console.log('📄 Export ready, file size:', Buffer.byteLength(jsonString, 'utf8'), 'bytes');

    // Return as downloadable file
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(jsonString, 'utf8').toString()
      }
    });

  } catch (error: any) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: `Failed to export data: ${error.message}` },
      { status: 500 }
    );
  }
}