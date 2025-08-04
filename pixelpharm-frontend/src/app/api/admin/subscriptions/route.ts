// Admin API: Subscription analytics and management
import { NextRequest, NextResponse } from 'next/server';

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

    // For now, return demo data
    // TODO: Implement actual database queries
    const now = new Date();

    return NextResponse.json({
      overview: {
        totalRevenue: 28164,
        monthlyRevenue: 2347,
        annualRevenue: 28164,
        churnRate: 3.2,
        averageRevenuePerUser: 49.7
      },
      plans: {
        free: { count: 186, percentage: 79.8 },
        basic: { count: 32, percentage: 13.7, revenue: 928 },
        pro: { count: 15, percentage: 6.4, revenue: 1185 }
      },
      trends: {
        newSubscriptions: 8,
        cancellations: 2,
        upgrades: 5,
        downgrades: 1
      },
      expiringSubscriptions: {
        next7Days: 3,
        next30Days: 12,
        pastDue: 1
      },
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}