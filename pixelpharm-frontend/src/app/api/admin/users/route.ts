// Admin API: Get all users with subscription and usage data
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

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
    
    // Build complex where clause with AND conditions
    const conditions = [];
    
    if (search) {
      conditions.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (subscriptionFilter && subscriptionFilter !== 'all') {
      conditions.push({
        OR: [
          { planType: subscriptionFilter.toUpperCase() },
          { subscriptionPlan: subscriptionFilter }
        ]
      });
    }
    
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Get users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
          planType: true,
          subscriptionPlan: true,
          subscriptionExpiresAt: true,
          uploadsUsed: true,
          _count: {
            select: {
              file_uploads: true,
              biomarker_values: true,
              body_composition_results: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Get upload usage for each user (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userIds = users.map(user => user.userId);
    const recentUploads = await prisma.file_uploads.groupBy({
      by: ['user_id'],
      where: {
        user_id: { in: userIds },
        created_at: { gte: thirtyDaysAgo }
      },
      _count: {
        user_id: true
      }
    });

    // Calculate usage and subscription info for each user
    const enrichedUsers = users.map(user => {
      const uploadCount = recentUploads.find(u => u.user_id === user.userId)?._count.user_id || 0;
      
      // Use planType first, then fall back to subscriptionPlan, then default to free
      let subscriptionPlan = 'free';
      if (user.planType) {
        subscriptionPlan = user.planType.toLowerCase();
      } else if (user.subscriptionPlan) {
        subscriptionPlan = user.subscriptionPlan.toLowerCase();
      }
      
      // Calculate remaining uploads based on plan
      const monthlyLimits = {
        free: 1,
        basic: 15,
        pro: 999, // Unlimited for pro
        elite: 999 // Unlimited for elite
      };

      const monthlyLimit = monthlyLimits[subscriptionPlan as keyof typeof monthlyLimits] || 1;
      const remainingUploads = subscriptionPlan === 'free' ? Math.max(0, monthlyLimit - (user.uploadsUsed || 0)) : 999;

      // Calculate days remaining for subscription
      let daysRemaining = null;
      if (user.subscriptionExpiresAt && subscriptionPlan !== 'free') {
        const now = new Date();
        const expiresAt = new Date(user.subscriptionExpiresAt);
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: user.userId,
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
          total: user._count.file_uploads,
          remaining: remainingUploads,
          limit: monthlyLimit
        },
        data: {
          biomarkers: user._count.biomarker_values,
          bodyComposition: user._count.body_composition_results
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
      // Update planType (the primary field we're using)
      updateData.planType = subscriptionPlan.toUpperCase();
      
      // Also update subscriptionPlan for backward compatibility
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
      where: { userId: userId },
      data: updateData,
      select: {
        userId: true,
        email: true,
        planType: true,
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