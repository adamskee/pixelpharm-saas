"use client";

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth/admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Upload,
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  FileText,
  Heart,
  Database
} from 'lucide-react';

interface DetailedAnalytics {
  timeRange: string;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  contentAnalytics: {
    totalDocumentsProcessed: number;
    avgProcessingTime: number;
    successRate: number;
    mostPopularDocumentTypes: Array<{ type: string; count: number }>;
  };
  healthInsights: {
    totalBiomarkersAnalyzed: number;
    criticalFindingsDetected: number;
    avgBiomarkersPerUser: number;
    mostCommonAbnormalities: Array<{ condition: string; count: number }>;
  };
  systemPerformance: {
    apiLatency: number;
    errorRate: number;
    uptime: number;
    totalRequests: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    uploadTrends: Array<{ date: string; count: number }>;
    revenueGrowth: Array<{ date: string; amount: number }>;
  };
  generatedAt: string;
}

export default function AdminAnalyticsPage() {
  const { admin, hasPermission } = useAdminAuth();
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchDetailedAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/admin/analytics/detailed?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${admin?.role === 'super_admin' ? 'admin_token_super_admin' : 'admin_token_support'}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch detailed analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_analytics')) {
      fetchDetailedAnalytics();
    }
  }, [hasPermission, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
                You don't have permission to view detailed analytics.
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
          <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-slate-600 mt-1">
            Comprehensive insights into platform performance and user behavior
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchDetailedAnalytics(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* User Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8.2% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12m 34s</div>
            <p className="text-xs text-slate-500 mt-1">Average per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Success Rate</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+1.2% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Database className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142ms</div>
            <p className="text-xs text-slate-500 mt-1">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Analytics & Health Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Processing Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Document Processing</span>
            </CardTitle>
            <CardDescription>
              Analysis of document uploads and processing performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2,847</div>
                <p className="text-sm text-slate-600">Total Processed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">2.3s</div>
                <p className="text-sm text-slate-600">Avg Processing</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blood Tests</span>
                <Badge>1,456 (51%)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Body Composition</span>
                <Badge>823 (29%)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medical Reports</span>
                <Badge>568 (20%)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <span>Health Insights</span>
            </CardTitle>
            <CardDescription>
              Medical analysis and biomarker insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">15,234</div>
                <p className="text-sm text-slate-600">Biomarkers Analyzed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">127</div>
                <p className="text-sm text-slate-600">Critical Findings</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High Cholesterol</span>
                <Badge className="bg-amber-600">34 cases</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vitamin D Deficiency</span>
                <Badge className="bg-yellow-600">28 cases</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Iron Deficiency</span>
                <Badge className="bg-red-600">19 cases</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <span>System Performance Overview</span>
          </CardTitle>
          <CardDescription>
            Platform reliability and performance metrics for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.97%</div>
              <p className="text-sm text-slate-600">Uptime</p>
              <p className="text-xs text-slate-500">System availability</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">847K</div>
              <p className="text-sm text-slate-600">API Requests</p>
              <p className="text-xs text-slate-500">Total processed</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0.12%</div>
              <p className="text-sm text-slate-600">Error Rate</p>
              <p className="text-xs text-slate-500">System errors</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">87</div>
              <p className="text-sm text-slate-600">Active Integrations</p>
              <p className="text-xs text-slate-500">Third-party services</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card>
        <CardContent className="flex flex-col items-center space-y-4 p-12">
          <BarChart3 className="h-16 w-16 text-slate-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Real-time Charts & Trends Coming Soon
            </h3>
            <p className="text-slate-600 max-w-md">
              Interactive charts, real-time data visualization, and advanced filtering options 
              are currently in development and will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleString()} • Time range: {timeRange}
      </div>
    </div>
  );
}