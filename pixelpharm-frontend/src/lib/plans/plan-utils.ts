// File: src/lib/plans/plan-utils.ts
// User plan management and restrictions utility

import { PRICING_PLANS, PlanType } from "@/lib/stripe/config";
import { prisma } from "@/lib/database/client";

export interface PlanLimits {
  maxUploads: number | null; // null = unlimited
  maxBiomarkers: number | null; // null = unlimited
  hasHealthOptimization: boolean;
  hasAdvancedAnalytics: boolean;
}

export interface UserPlanStatus {
  currentPlan: PlanType;
  uploadsUsed: number;
  uploadsRemaining: number | null; // null = unlimited
  canUpload: boolean;
  needsUpgrade: boolean;
  limits: PlanLimits;
}

/**
 * Get plan limits based on plan type
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
  const plan = PRICING_PLANS[planType];
  
  return {
    maxUploads: plan.limits?.maxUploads || null,
    maxBiomarkers: plan.limits?.maxBiomarkers || null,
    hasHealthOptimization: planType !== 'free', // All paid plans have optimization
    hasAdvancedAnalytics: planType !== 'free', // All paid plans have advanced analytics
  };
}

/**
 * Check if user can upload based on their plan and usage
 */
export async function checkUploadPermission(userId: string): Promise<{
  canUpload: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        planType: true,
        uploadsUsed: true,
      }
    });

    if (!user) {
      return { canUpload: false, reason: "User not found" };
    }

    const limits = getPlanLimits(user.planType as PlanType);
    
    // Check upload limit
    if (limits.maxUploads !== null && user.uploadsUsed >= limits.maxUploads) {
      return {
        canUpload: false,
        reason: `Upload limit reached (${limits.maxUploads} uploads)`,
        upgradeRequired: true
      };
    }

    return { canUpload: true };
  } catch (error) {
    console.error("Error checking upload permission:", error);
    return { canUpload: false, reason: "Database error" };
  }
}

/**
 * Get user's current plan status and usage
 */
export async function getUserPlanStatus(userId: string): Promise<UserPlanStatus> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        planType: true,
        uploadsUsed: true,
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const planType = user.planType as PlanType;
    const limits = getPlanLimits(planType);
    
    const uploadsRemaining = limits.maxUploads 
      ? Math.max(0, limits.maxUploads - user.uploadsUsed)
      : null; // unlimited

    const canUpload = limits.maxUploads 
      ? user.uploadsUsed < limits.maxUploads 
      : true; // unlimited

    const needsUpgrade = planType === 'free' && user.uploadsUsed >= 1;

    return {
      currentPlan: planType,
      uploadsUsed: user.uploadsUsed,
      uploadsRemaining,
      canUpload,
      needsUpgrade,
      limits,
    };
  } catch (error) {
    console.error("Error getting user plan status:", error);
    // Return default free plan status on error
    return {
      currentPlan: 'free',
      uploadsUsed: 0,
      uploadsRemaining: 1,
      canUpload: true,
      needsUpgrade: false,
      limits: getPlanLimits('free'),
    };
  }
}

/**
 * Increment user's upload count
 */
export async function incrementUploadCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { userId },
      data: {
        uploadsUsed: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error("Error incrementing upload count:", error);
    throw error;
  }
}

/**
 * Limit biomarkers for free plan users
 */
export function limitBiomarkersForPlan<T extends { biomarkerName: string }>(
  biomarkers: T[], 
  planType: PlanType
): T[] {
  const limits = getPlanLimits(planType);
  
  if (limits.maxBiomarkers === null) {
    return biomarkers; // No limit
  }
  
  // For free plan, return only first 3 biomarkers
  return biomarkers.slice(0, limits.maxBiomarkers);
}

/**
 * Check if user needs to upgrade based on their usage
 */
export function shouldShowUpgradePrompt(planStatus: UserPlanStatus): boolean {
  if (planStatus.currentPlan !== 'free') return false;
  
  // Show upgrade prompt if they've used their free upload
  return planStatus.uploadsUsed >= 1 || !planStatus.canUpload;
}

/**
 * Get upgrade suggestions based on user's current plan and usage
 */
export function getUpgradeSuggestions(planStatus: UserPlanStatus): {
  title: string;
  description: string;
  recommendedPlan: PlanType;
} {
  if (planStatus.currentPlan === 'free') {
    return {
      title: "Unlock Full Health Insights",
      description: "Upgrade to analyze ALL your biomarkers and get unlimited uploads with advanced health optimization features.",
      recommendedPlan: 'basic'
    };
  }
  
  if (planStatus.currentPlan === 'basic') {
    return {
      title: "Get Professional Access",
      description: "Upgrade to Pro for 30-day full access with 20 uploads and priority support.",
      recommendedPlan: 'pro'
    };
  }
  
  return {
    title: "You're on the best plan!",
    description: "Enjoy unlimited access to all features.",
    recommendedPlan: 'pro'
  };
}