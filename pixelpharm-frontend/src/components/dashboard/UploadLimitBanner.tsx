"use client";

import React from 'react';
import Link from 'next/link';
import { usePlanStatus, getPlanDisplayName, getUploadLimitText, getUpgradePromptText } from '@/hooks/usePlanStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Upload, Crown, Calendar, Zap } from 'lucide-react';

export function UploadLimitBanner() {
  const { planStatus, loading, error } = usePlanStatus();

  // Debug logging
  console.log('🎯 UploadLimitBanner Debug (New Plan System):', {
    loading,
    error,
    planStatus,
    canUpload: planStatus?.canUpload,
    currentPlan: planStatus?.currentPlan,
    uploadsUsed: planStatus?.uploadsUsed,
    uploadsRemaining: planStatus?.uploadsRemaining,
  });

  if (loading) {
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

  if (error || !planStatus) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Unable to check upload limits
              </p>
              <p className="text-xs text-yellow-700">
                You can still upload, but limits may apply. {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = getPlanDisplayName(planStatus.currentPlan);
  const limitText = getUploadLimitText(planStatus);
  const upgradeText = getUpgradePromptText(planStatus);
  
  // Show upgrade prompt if limit exceeded
  if (!planStatus.canUpload) {
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
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
                {planStatus.currentPlan === 'basic' && (
                  <div className="flex items-center text-xs text-red-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    Monthly limit resets soon
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show usage info if close to limit or for free users
  const showLimitWarning = planStatus.currentPlan === 'free' || 
    (planStatus.uploadsRemaining !== null && planStatus.uploadsRemaining <= 2);

  if (showLimitWarning && planStatus.canUpload) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Upload className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                {planStatus.currentPlan === 'free' ? 'Free Plan' : 'Upload Limit Warning'}
              </h3>
              <p className="text-sm text-blue-700 mb-2">{limitText}</p>
              <Link href="/pricing">
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Zap className="h-4 w-4 mr-2" />
                  {planStatus.currentPlan === 'free' ? 'Upgrade for More' : 'Upgrade for Unlimited'}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show normal usage info for users who can upload
  return (
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Upload className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 mb-1">{planName} Plan</p>
            <p className="text-sm text-green-700">{limitText}</p>
            {planStatus.currentPlan === 'basic' && (
              <p className="text-xs text-green-600 mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                Monthly limits reset at billing cycle
              </p>
            )}
          </div>
          {planStatus.currentPlan === 'basic' && (
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}