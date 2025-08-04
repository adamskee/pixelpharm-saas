// Admin API: System analytics and overview
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const validTokens = ['admin_token_super_admin', 'admin_token_support'];

  if (!validTokens.includes(token)) {
    throw new Error('Invalid admin token');
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    verifyAdminAuth(request);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    // Get user statistics
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeUsersLast7Days,
      subscriptionStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.user.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          } 
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { FileUpload: { some: { createdAt: { gte: last7Days } } } },
            { Biomarker: { some: { createdAt: { gte: last7Days } } } }
          ]
        }
      }),
      prisma.user.groupBy({
        by: ['subscriptionPlan'],
        _count: {
          subscriptionPlan: true
        }
      })
    ]);

    // Get upload statistics
    const [
      totalUploads,
      uploadsThisMonth,
      uploadsLastMonth,
      uploadsLast7Days,
      avgUploadsPerUser
    ] = await Promise.all([
      prisma.fileUpload.count(),
      prisma.fileUpload.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.fileUpload.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          } 
        }
      }),
      prisma.fileUpload.count({
        where: { createdAt: { gte: last7Days } }
      }),
      prisma.fileUpload.aggregate({
        _avg: {
          id: true
        }
      })
    ]);

    // Get biomarker and health data statistics
    const [
      totalBiomarkers,
      biomarkersThisMonth,
      criticalBiomarkers,
      bodyCompositionEntries
    ] = await Promise.all([
      prisma.biomarker.count(),
      prisma.biomarker.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.biomarker.count({
        where: { abnormalityLevel: 'CRITICAL' }
      }),
      prisma.bodyComposition.count()
    ]);

    // Calculate revenue estimates (based on subscription plans)
    const revenueEstimates = {
      monthly: 0,
      annual: 0
    };

    subscriptionStats.forEach(stat => {
      const count = stat._count.subscriptionPlan;
      if (stat.subscriptionPlan === 'basic') {
        revenueEstimates.monthly += count * 29; // $29/month
        revenueEstimates.annual += count * 29 * 12;
      } else if (stat.subscriptionPlan === 'pro') {
        revenueEstimates.monthly += count * 79; // $79/month
        revenueEstimates.annual += count * 79 * 12;
      }
    });

    // Get daily upload trend for last 30 days
    const dailyUploads = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as uploads
      FROM file_upload 
      WHERE created_at >= ${last30Days}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; uploads: number }>;

    // Get user growth trend for last 30 days
    const dailySignups = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as signups
      FROM user 
      WHERE created_at >= ${last30Days}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; signups: number }>;

    // Calculate growth rates
    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 0;

    const uploadGrowthRate = uploadsLastMonth > 0 
      ? ((uploadsThisMonth - uploadsLastMonth) / uploadsLastMonth) * 100 
      : 0;

    // System health metrics
    const systemHealth = {
      averageProcessingTime: Math.random() * 1000 + 500, // Mock data
      errorRate: Math.random() * 5, // Mock data
      uptime: 99.9, // Mock data
      apiResponseTime: Math.random() * 200 + 100 // Mock data
    };

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersThisMonth,
        userGrowthRate: Number(userGrowthRate.toFixed(1)),
        activeUsersLast7Days,
        totalUploads,
        uploadsThisMonth,
        uploadGrowthRate: Number(uploadGrowthRate.toFixed(1)),
        avgUploadsPerUser: Number((totalUploads / Math.max(totalUsers, 1)).toFixed(1))
      },
      subscriptions: {
        breakdown: subscriptionStats.reduce((acc, stat) => {
          acc[stat.subscriptionPlan || 'free'] = stat._count.subscriptionPlan;
          return acc;
        }, {} as Record<string, number>),
        revenue: revenueEstimates
      },
      health: {
        totalBiomarkers,
        biomarkersThisMonth,
        criticalBiomarkers,
        bodyCompositionEntries
      },
      trends: {
        dailyUploads: dailyUploads.map(d => ({
          date: d.date.toISOString().split('T')[0],
          uploads: Number(d.uploads)
        })),
        dailySignups: dailySignups.map(d => ({
          date: d.date.toISOString().split('T')[0],
          signups: Number(d.signups)
        }))
      },
      system: systemHealth,
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Admin analytics API error:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}