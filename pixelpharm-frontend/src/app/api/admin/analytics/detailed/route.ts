// Admin API: Detailed analytics with time range support
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';

    // For now, return demo data
    // TODO: Implement actual database queries based on time range
    const now = new Date();

    return NextResponse.json({
      timeRange,
      userEngagement: {
        dailyActiveUsers: 1247,
        weeklyActiveUsers: 5642,
        monthlyActiveUsers: 18934,
        avgSessionDuration: 754, // seconds
        bounceRate: 23.4
      },
      contentAnalytics: {
        totalDocumentsProcessed: 2847,
        avgProcessingTime: 2300, // milliseconds
        successRate: 96.8,
        mostPopularDocumentTypes: [
          { type: 'Blood Tests', count: 1456 },
          { type: 'Body Composition', count: 823 },
          { type: 'Medical Reports', count: 568 }
        ]
      },
      healthInsights: {
        totalBiomarkersAnalyzed: 15234,
        criticalFindingsDetected: 127,
        avgBiomarkersPerUser: 8.3,
        mostCommonAbnormalities: [
          { condition: 'High Cholesterol', count: 34 },
          { condition: 'Vitamin D Deficiency', count: 28 },
          { condition: 'Iron Deficiency', count: 19 }
        ]
      },
      systemPerformance: {
        apiLatency: 142,
        errorRate: 0.12,
        uptime: 99.97,
        totalRequests: 847000
      },
      trends: {
        userGrowth: generateTrendData('users', timeRange),
        uploadTrends: generateTrendData('uploads', timeRange),
        revenueGrowth: generateTrendData('revenue', timeRange)
      },
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Admin detailed analytics API error:', error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch detailed analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateTrendData(type: string, timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    let value: number;
    switch (type) {
      case 'users':
        value = Math.floor(Math.random() * 50) + 20;
        break;
      case 'uploads':
        value = Math.floor(Math.random() * 100) + 30;
        break;
      case 'revenue':
        value = Math.floor(Math.random() * 500) + 200;
        break;
      default:
        value = Math.floor(Math.random() * 100);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      [type === 'users' ? 'count' : type === 'uploads' ? 'count' : 'amount']: value
    });
  }
  
  return data;
}