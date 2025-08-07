// File: src/hooks/usePlanStatus.ts
// React hook for accessing user's plan status and limits

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface PlanStatus {
  currentPlan: string;
  uploadsUsed: number;
  uploadsRemaining: number | null;
  canUpload: boolean;
  needsUpgrade: boolean;
  limits: {
    maxUploads: number | null;
    maxBiomarkers: number | null;
    hasHealthOptimization: boolean;
    hasAdvancedAnalytics: boolean;
  };
}

export interface PlanStatusHook {
  planStatus: PlanStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlanStatus(): PlanStatusHook {
  const { data: session } = useSession();
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanStatus = async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = session.user.id || 
        session.user.userId || 
        `user-${session.user.email.replace(/[^a-z0-9]/g, "")}`;

      const response = await fetch(`/api/user/plan-status?userId=${userId}&_timestamp=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.planStatus) {
        setPlanStatus(data.planStatus);
      } else {
        throw new Error(data.error || "Failed to fetch plan status");
      }
    } catch (err: any) {
      console.error("Error fetching plan status:", err);
      setError(err.message || "Failed to fetch plan status");
      
      // Provide fallback plan status for free users
      setPlanStatus({
        currentPlan: 'free',
        uploadsUsed: 0,
        uploadsRemaining: 1,
        canUpload: true,
        needsUpgrade: false,
        limits: {
          maxUploads: 1,
          maxBiomarkers: 3,
          hasHealthOptimization: true,
          hasAdvancedAnalytics: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanStatus();
  }, [session?.user?.email]);

  return {
    planStatus,
    loading,
    error,
    refetch: fetchPlanStatus,
  };
}

// Helper functions for plan status display
export function getPlanDisplayName(planType: string): string {
  switch (planType) {
    case 'free': return 'Free';
    case 'basic': return 'Elite Athlete';
    case 'pro': return 'Pro';
    default: return 'Free';
  }
}

export function getUploadLimitText(planStatus: PlanStatus): string {
  const { uploadsUsed, uploadsRemaining, limits } = planStatus;
  
  if (limits.maxUploads === null) {
    return "Unlimited uploads";
  }
  
  if (uploadsRemaining === null) {
    return `${uploadsUsed} uploads used`;
  }
  
  if (uploadsRemaining === 0) {
    return `Upload limit reached (${uploadsUsed}/${limits.maxUploads})`;
  }
  
  return `${uploadsRemaining} upload${uploadsRemaining === 1 ? '' : 's'} remaining (${uploadsUsed}/${limits.maxUploads} used)`;
}

export function getUpgradePromptText(planStatus: PlanStatus): string {
  const { currentPlan, needsUpgrade, limits } = planStatus;
  
  if (currentPlan === 'free' && needsUpgrade) {
    return "Upgrade to Elite Athlete for 5 uploads per month and unlimited biomarker analysis!";
  }
  
  if (currentPlan === 'free' && !planStatus.canUpload) {
    return "Your free upload has been used. Upgrade for more uploads and full access!";
  }
  
  if (currentPlan === 'basic' && !planStatus.canUpload) {
    return "Monthly upload limit reached. Upgrade to Pro for 30-day unlimited access!";
  }
  
  return "Upgrade for more features and unlimited access!";
}