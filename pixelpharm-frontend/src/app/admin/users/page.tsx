"use client";

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth/admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter,
  Crown,
  Upload,
  Calendar,
  Mail,
  User,
  MoreHorizontal,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  provider: string;
  createdAt: string;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  daysRemaining: number | null;
  uploads: {
    thisMonth: number;
    total: number;
    remaining: number;
    limit: number;
  };
  data: {
    biomarkers: number;
    bodyComposition: number;
  };
  status: string;
}

interface UserStats {
  total: number;
  active: number;
  expiring: number;
  bySubscription: {
    free: number;
    basic: number;
    pro: number;
  };
  totalUploads: number;
  uploadsThisMonth: number;
}

export default function AdminUsersPage() {
  const { admin, hasPermission } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
        subscription: subscriptionFilter
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin?.role === 'super_admin' ? 'admin_token_super_admin' : 'admin_token_support'}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_users')) {
      fetchUsers();
    }
  }, [hasPermission, page, search, subscriptionFilter]);

  const updateUserSubscription = async (userId: string, subscriptionPlan: string, daysToAdd?: number) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin?.role === 'super_admin' ? 'admin_token_super_admin' : 'admin_token_support'}`
        },
        body: JSON.stringify({
          userId,
          subscriptionPlan,
          daysToAdd
        })
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      // Refresh users list
      fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (!hasPermission('view_users')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600 mt-1">
                You don't have permission to view users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (user: AdminUser) => {
    if (user.status === 'expiring') {
      return <Badge className="bg-yellow-600">Expiring Soon</Badge>;
    }
    if (user.subscriptionPlan === 'free') {
      return <Badge variant="outline">Free</Badge>;
    }
    return <Badge className="bg-green-600">Active</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-slate-500',
      basic: 'bg-blue-600',
      pro: 'bg-purple-600'
    };
    return (
      <Badge className={colors[plan as keyof typeof colors] || 'bg-slate-500'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            Manage users, subscriptions, and view usage statistics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-slate-600">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.bySubscription.basic + stats.bySubscription.pro}</p>
                  <p className="text-xs text-slate-600">Paid Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiring}</p>
                  <p className="text-xs text-slate-600">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.uploadsThisMonth}</p>
                  <p className="text-xs text-slate-600">Uploads This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-slate-600">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="subscription">Subscription Plan</Label>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {loading ? 'Loading users...' : `Showing ${users.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </h3>
                        {getStatusBadge(user)}
                        {getPlanBadge(user.subscriptionPlan)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{user.uploads.thisMonth}/{user.uploads.limit}</div>
                      <div className="text-slate-500">Uploads</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{user.data.biomarkers}</div>
                      <div className="text-slate-500">Biomarkers</div>
                    </div>
                    
                    {user.daysRemaining !== null && (
                      <div className="text-center">
                        <div className="font-medium">{user.daysRemaining}</div>
                        <div className="text-slate-500">Days Left</div>
                      </div>
                    )}
                    
                    {hasPermission('manage_subscriptions') && (
                      <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User Subscription</DialogTitle>
                            <DialogDescription>
                              Update subscription plan for {user.firstName} {user.lastName} ({user.email})
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={user.subscriptionPlan === 'free' ? 'default' : 'outline'}
                                onClick={() => updateUserSubscription(user.id, 'free')}
                              >
                                Free Plan
                              </Button>
                              <Button
                                variant={user.subscriptionPlan === 'basic' ? 'default' : 'outline'}
                                onClick={() => updateUserSubscription(user.id, 'basic', 30)}
                              >
                                Basic Plan
                              </Button>
                              <Button
                                variant={user.subscriptionPlan === 'pro' ? 'default' : 'outline'}
                                onClick={() => updateUserSubscription(user.id, 'pro', 30)}
                              >
                                Pro Plan
                              </Button>
                            </div>
                            
                            {user.subscriptionPlan !== 'free' && (
                              <div className="space-y-2">
                                <Label>Extend Subscription</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateUserSubscription(user.id, user.subscriptionPlan, 7)}
                                  >
                                    +7 days
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateUserSubscription(user.id, user.subscriptionPlan, 30)}
                                  >
                                    +30 days
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateUserSubscription(user.id, user.subscriptionPlan, 365)}
                                  >
                                    +365 days
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
              
              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}