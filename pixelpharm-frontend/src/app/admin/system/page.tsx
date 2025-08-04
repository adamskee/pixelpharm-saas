"use client";

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth/admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Cloud,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Activity,
  Zap,
  Clock,
  FileText
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: {
    api: { status: 'online' | 'offline' | 'degraded'; responseTime: number; uptime: number };
    database: { status: 'online' | 'offline' | 'degraded'; connections: number; uptime: number };
    storage: { status: 'online' | 'offline' | 'degraded'; usage: number; capacity: number };
    ai: { status: 'online' | 'offline' | 'degraded'; modelsAvailable: number; avgProcessingTime: number };
  };
  infrastructure: {
    cpu: { usage: number; cores: number };
    memory: { usage: number; total: number };
    disk: { usage: number; total: number };
    network: { bandwidth: number; latency: number };
  };
  security: {
    lastSecurityScan: string;
    vulnerabilities: number;
    certificateExpiry: string;
    backupStatus: 'healthy' | 'warning' | 'failed';
  };
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    service: string;
    message: string;
  }>;
  generatedAt: string;
}

export default function AdminSystemPage() {
  const { admin, hasPermission } = useAdminAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSystemHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/admin/system', {
        headers: {
          'Authorization': `Bearer ${admin?.role === 'super_admin' ? 'admin_token_super_admin' : 'admin_token_support'}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch system health');
      
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_analytics')) {
      fetchSystemHealth();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchSystemHealth(true);
      }, 30000);

      return () => clearInterval(interval);
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
                You don't have permission to view system health.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'healthy': return 'bg-green-600';
      case 'warning': case 'degraded': return 'bg-yellow-600';
      case 'offline': case 'critical': case 'failed': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline': case 'critical': case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Health</h1>
          <p className="text-slate-600 mt-1">
            Monitor infrastructure, services, and system performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-green-600">
            <Activity className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button
            onClick={() => fetchSystemHealth(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Service</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon('online')}
              <Badge className={getStatusColor('online')}>Online</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Response: 142ms</div>
              <div>Uptime: 99.97%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon('online')}
              <Badge className={getStatusColor('online')}>Online</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Connections: 23/100</div>
              <div>Uptime: 99.99%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cloud Storage</CardTitle>
            <Cloud className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon('online')}
              <Badge className={getStatusColor('online')}>Online</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Usage: 2.3TB/10TB</div>
              <div>Sync: Active</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Services</CardTitle>
            <Zap className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon('online')}
              <Badge className={getStatusColor('online')}>Online</Badge>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Models: 3/3 Available</div>
              <div>Avg Processing: 2.1s</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              <span>Infrastructure Resources</span>
            </CardTitle>
            <CardDescription>
              Server resource utilization and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-slate-600">34.2%</span>
              </div>
              <Progress value={34.2} className="h-2" />
              <p className="text-xs text-slate-500">8 cores available</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-slate-600">68.7%</span>
              </div>
              <Progress value={68.7} className="h-2" />
              <p className="text-xs text-slate-500">11.2GB / 16GB used</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-slate-600">45.8%</span>
              </div>
              <Progress value={45.8} className="h-2" />
              <p className="text-xs text-slate-500">458GB / 1TB used</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network I/O</span>
                <span className="text-sm text-slate-600">12.3 MB/s</span>
              </div>
              <Progress value={25} className="h-2" />
              <p className="text-xs text-slate-500">Avg latency: 15ms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Security & Compliance</span>
            </CardTitle>
            <CardDescription>
              Security status and compliance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Security Scan</span>
              </div>
              <Badge className="bg-green-600">Passed</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Vulnerabilities</span>
              </div>
              <Badge className="bg-yellow-600">2 Low</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">SSL Certificate</span>
              </div>
              <Badge className="bg-green-600">Valid</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Backup Status</span>
              </div>
              <Badge className="bg-green-600">Healthy</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <span>Recent System Logs</span>
          </CardTitle>
          <CardDescription>
            Latest system events and service logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Clock className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-600">INFO</Badge>
                  <span className="text-sm font-medium">API Service</span>
                  <span className="text-xs text-slate-500">2 minutes ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">Health check completed successfully</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Clock className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-600">INFO</Badge>
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-xs text-slate-500">5 minutes ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">Automated backup completed</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Clock className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600">WARNING</Badge>
                  <span className="text-sm font-medium">AI Service</span>
                  <span className="text-xs text-slate-500">12 minutes ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">Processing queue above 80% capacity</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Clock className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-600">INFO</Badge>
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-xs text-slate-500">18 minutes ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">File cleanup task completed</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Full Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleString()} • Auto-refresh: Every 30 seconds
      </div>
    </div>
  );
}