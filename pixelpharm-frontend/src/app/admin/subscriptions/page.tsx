"use client";

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth/admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';

interface SubscriptionAnalytics {
  overview: {
    totalRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
    churnRate: number;
    averageRevenuePerUser: number;
  };
  plans: {
    free: { count: number; percentage: number };
    basic: { count: number; percentage: number; revenue: number };
    pro: { count: number; percentage: number; revenue: number };
  };
  trends: {
    newSubscriptions: number;
    cancellations: number;
    upgrades: number;
    downgrades: number;
  };
  expiringSubscriptions: {
    next7Days: number;
    next30Days: number;
    pastDue: number;
  };
  generatedAt: string;
}

export default function AdminSubscriptionsPage() {
  const { admin, hasPermission } = useAdminAuth();
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptionAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': `Bearer ${admin?.role === 'super_admin' ? 'admin_token_super_admin' : 'admin_token_support'}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch subscription analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_analytics')) {
      fetchSubscriptionAnalytics();
    }
  }, [hasPermission]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600 mt-1">
                You don't have permission to view subscription analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
          <p className="text-slate-600 mt-1">
            Monitor subscription analytics, revenue, and plan performance
          </p>
        </div>
        <Button
          onClick={() => fetchSubscriptionAnalytics(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,347</div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$28,164</div>
            <p className="text-xs text-slate-500 mt-1">Projected annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution & Expiring Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Plan Distribution</span>
            </CardTitle>
            <CardDescription>
              User distribution across subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-slate-500">Free</Badge>
                  <span className="text-sm text-slate-600">186 users</span>
                </div>
                <span className="text-sm font-medium">79.8%</span>
              </div>
              <Progress value={79.8} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-600">Basic</Badge>
                  <span className="text-sm text-slate-600">32 users</span>
                </div>
                <span className="text-sm font-medium">13.7%</span>
              </div>
              <Progress value={13.7} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600">Pro</Badge>
                  <span className="text-sm text-slate-600">15 users</span>
                </div>
                <span className="text-sm font-medium">6.4%</span>
              </div>
              <Progress value={6.4} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Expiring Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <span>Expiring Subscriptions</span>
            </CardTitle>
            <CardDescription>
              Subscriptions requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Next 7 Days</p>
                <p className="text-sm text-slate-600">Expiring soon</p>
              </div>
              <Badge className="bg-red-600">3</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Next 30 Days</p>
                <p className="text-sm text-slate-600">Renewal reminders</p>
              </div>
              <Badge className="bg-yellow-600">12</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Past Due</p>
                <p className="text-sm text-slate-600">Require immediate action</p>
              </div>
              <Badge className="bg-red-600">1</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card>
        <CardContent className="flex flex-col items-center space-y-4 p-12">
          <Crown className="h-16 w-16 text-slate-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-slate-600 max-w-md">
              Detailed subscription analytics, revenue forecasting, and advanced reporting tools 
              are currently in development and will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}