"use client";

import React from 'react';
import Link from 'next/link';
import { useUploadLimits, getUploadLimitText, getUpgradePromptText } from '@/hooks/useUploadLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Upload, Crown, Calendar } from 'lucide-react';

export function UploadLimitBanner() {
  const subscription = useSubscription();
  const uploadUsage = useUploadLimits();

  // Debug logging
  console.log('🎯 UploadLimitBanner Debug:', {
    subscriptionLoading: subscription.loading,
    uploadUsageLoading: uploadUsage.loading,
    subscriptionPlan: subscription.plan,
    subscriptionHasAccess: subscription.hasAccess,
    uploadUsageCanUpload: uploadUsage.canUpload,
    uploadUsageLimitType: uploadUsage.limitType,
    remainingTotal: uploadUsage.remainingTotal,
    remainingThisMonth: uploadUsage.remainingThisMonth,
  });

  if (uploadUsage.loading || subscription.loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = subscription.plan === 'basic' ? 'Elite Athlete' : 
                   subscription.plan === 'pro' ? 'Pro' : 'Free';

  const limitText = getUploadLimitText(uploadUsage, planName);
  const upgradeText = getUpgradePromptText(uploadUsage);
  
  // Show upgrade prompt if limit exceeded
  if (!uploadUsage.canUpload) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Upload Limit Reached</h3>
              <p className="text-sm text-red-700 mb-3">{upgradeText}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/pricing">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
                {uploadUsage.resetDate && uploadUsage.limitType === 'monthly' && (
                  <div className="flex items-center text-xs text-red-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    Resets {uploadUsage.resetDate.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show usage info if close to limit
  const isCloseToLimit = uploadUsage.limitType === 'monthly' 
    ? uploadUsage.remainingThisMonth <= 2
    : uploadUsage.limitType === 'total' 
    ? (uploadUsage.remainingTotal || 0) <= 5
    : false;

  if (isCloseToLimit) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Upload className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900 mb-1">Upload Limit Warning</h3>
              <p className="text-sm text-yellow-700 mb-2">{limitText}</p>
              <Link href="/pricing">
                <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade for More Uploads
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show normal usage info
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Upload className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-700">{limitText}</p>
            {uploadUsage.resetDate && uploadUsage.limitType === 'monthly' && (
              <p className="text-xs text-blue-600 mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                Resets {uploadUsage.resetDate.toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription.plan === 'basic' && (
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}