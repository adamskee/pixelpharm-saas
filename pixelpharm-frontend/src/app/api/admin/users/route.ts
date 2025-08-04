// Admin API: Get all users with subscription and usage data
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Admin authentication middleware
function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  // For now, simple token check - in production, use proper JWT validation
  const token = authHeader.replace('Bearer ', '');
  const validTokens = [
    'admin_token_super_admin',
    'admin_token_support'
  ];

  if (!validTokens.includes(token)) {
    throw new Error('Invalid admin token');
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const subscriptionFilter = searchParams.get('subscription');
    const statusFilter = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (subscriptionFilter && subscriptionFilter !== 'all') {
      where.subscriptionPlan = subscriptionFilter;
    }

    // Get users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
          subscriptionPlan: true,
          subscriptionExpiresAt: true,
          _count: {
            select: {
              FileUpload: true,
              Biomarker: true,
              BodyComposition: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Get upload usage for each user (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userIds = users.map(user => user.id);
    const recentUploads = await prisma.fileUpload.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        userId: true
      }
    });

    // Calculate usage and subscription info for each user
    const enrichedUsers = users.map(user => {
      const uploadCount = recentUploads.find(u => u.userId === user.id)?._count.userId || 0;
      const subscriptionPlan = user.subscriptionPlan || 'free';
      
      // Calculate remaining uploads based on plan
      const monthlyLimits = {
        free: 3,
        basic: 15,
        pro: 50
      };

      const monthlyLimit = monthlyLimits[subscriptionPlan as keyof typeof monthlyLimits] || 3;
      const remainingUploads = Math.max(0, monthlyLimit - uploadCount);

      // Calculate days remaining for subscription
      let daysRemaining = null;
      if (user.subscriptionExpiresAt && subscriptionPlan !== 'free') {
        const now = new Date();
        const expiresAt = new Date(user.subscriptionExpiresAt);
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        daysRemaining,
        uploads: {
          thisMonth: uploadCount,
          total: user._count.FileUpload,
          remaining: remainingUploads,
          limit: monthlyLimit
        },
        data: {
          biomarkers: user._count.Biomarker,
          bodyComposition: user._count.BodyComposition
        },
        status: daysRemaining !== null && daysRemaining <= 7 ? 'expiring' : 'active'
      };
    });

    // Calculate summary statistics
    const stats = {
      total: totalCount,
      active: enrichedUsers.filter(u => u.status === 'active').length,
      expiring: enrichedUsers.filter(u => u.status === 'expiring').length,
      bySubscription: {
        free: enrichedUsers.filter(u => u.subscriptionPlan === 'free').length,
        basic: enrichedUsers.filter(u => u.subscriptionPlan === 'basic').length,
        pro: enrichedUsers.filter(u => u.subscriptionPlan === 'pro').length
      },
      totalUploads: enrichedUsers.reduce((sum, u) => sum + u.uploads.total, 0),
      uploadsThisMonth: enrichedUsers.reduce((sum, u) => sum + u.uploads.thisMonth, 0)
    };

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Update user subscription (admin only)
export async function PATCH(request: NextRequest) {
  try {
    verifyAdminAuth(request);

    const body = await request.json();
    const { userId, subscriptionPlan, daysToAdd } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (subscriptionPlan) {
      updateData.subscriptionPlan = subscriptionPlan;
      
      // Set expiration date based on plan
      if (subscriptionPlan !== 'free') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (daysToAdd || 30));
        updateData.subscriptionExpiresAt = expiresAt;
      } else {
        updateData.subscriptionExpiresAt = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}