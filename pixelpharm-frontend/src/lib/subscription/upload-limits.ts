import { getUserSubscription } from "@/lib/auth/subscription-check";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Upload limits configuration
export const UPLOAD_LIMITS = {
  basic: {
    perMonth: 5,
    total: null, // No total limit for subscription
  },
  pro: {
    perMonth: null, // No monthly limit
    total: 20, // Total limit for 30-day access
  },
  inactive: {
    perMonth: 0,
    total: 0,
  },
} as const;

export interface UploadUsage {
  currentMonth: number;
  totalUploads: number;
  remainingThisMonth: number;
  remainingTotal: number | null;
  canUpload: boolean;
  limitType: "monthly" | "total" | "none";
  resetDate?: Date;
}

// Get current upload usage for a user
export async function getUserUploadUsage(userId: string): Promise<UploadUsage> {
  try {
    console.log('📊 Getting subscription for user:', userId);
    const subscription = await getUserSubscription(userId);

    console.log('📊 User subscription:', subscription);

    if (!subscription?.hasAccess) {
      console.log('📊 User has no subscription access, returning default limits');
      return {
        currentMonth: 0,
        totalUploads: 0,
        remainingThisMonth: 0,
        remainingTotal: 0,
        canUpload: false,
        limitType: "none",
      };
    }

  const plan = subscription.plan || "inactive";
  const limits = UPLOAD_LIMITS[plan];

  // Get current month uploads (for Basic plan)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  console.log('📊 Counting monthly uploads for:', { userId, startOfMonth, endOfMonth });
  const monthlyUploads = await prisma.file_uploads.count({
    where: {
      user_id: userId,
      upload_type: {
        in: ["BLOOD_TESTS", "BODY_COMPOSITION", "FITNESS_ACTIVITIES"],
      },
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  console.log('📊 Monthly uploads count:', monthlyUploads);

  // Get total uploads (for Pro plan or general tracking)
  let totalUploads = 0;
  let uploadCountStartDate = startOfMonth;

  if (plan === "pro" && subscription.expiresAt) {
    // For Pro plan, count from subscription start date
    const subscriptionStart = new Date(subscription.expiresAt);
    subscriptionStart.setDate(subscriptionStart.getDate() - 30); // 30 days ago
    uploadCountStartDate = subscriptionStart;

    totalUploads = await prisma.file_uploads.count({
      where: {
        user_id: userId,
        upload_type: {
          in: ["BLOOD_TESTS", "BODY_COMPOSITION", "FITNESS_ACTIVITIES"],
        },
        created_at: {
          gte: uploadCountStartDate,
        },
      },
    });
  } else {
    // For Basic plan, total uploads = monthly uploads
    totalUploads = monthlyUploads;
  }

  // Calculate remaining uploads
  const remainingThisMonth = limits.perMonth
    ? Math.max(0, limits.perMonth - monthlyUploads)
    : null;
  const remainingTotal = limits.total
    ? Math.max(0, limits.total - totalUploads)
    : null;

  // Determine if user can upload
  let canUpload = true;
  let limitType: "monthly" | "total" | "none" = "none";

  console.log('📊 Upload limits calculation:', {
    userId,
    plan,
    limits,
    monthlyUploads,
    totalUploads,
    remainingThisMonth,
    remainingTotal,
  });

  if (plan === "basic") {
    canUpload = monthlyUploads < (limits.perMonth || 0);
    limitType = "monthly";
  } else if (plan === "pro") {
    canUpload = totalUploads < (limits.total || 0);
    limitType = "total";
  }

  console.log('✅ Upload limits result:', {
    canUpload,
    limitType,
    plan,
    finalRemainingTotal: remainingTotal,
    finalRemainingThisMonth: remainingThisMonth,
  });

  return {
    currentMonth: monthlyUploads,
    totalUploads,
    remainingThisMonth: remainingThisMonth || 0,
    remainingTotal,
    canUpload,
    limitType,
    resetDate:
      plan === "basic" ? endOfMonth : subscription.expiresAt || undefined,
  };
  } catch (error: any) {
    console.error('📊 Error in getUserUploadUsage:', error);
    console.error('Error stack:', error.stack);
    
    // Return safe default values in case of error
    return {
      currentMonth: 0,
      totalUploads: 0,
      remainingThisMonth: 0,
      remainingTotal: 0,
      canUpload: false,
      limitType: "none",
    };
  }
}

// Check if user can upload (quick check for API endpoints)
export async function canUserUpload(userId: string): Promise<boolean> {
  const usage = await getUserUploadUsage(userId);
  return usage.canUpload;
}

// Get upload limits for a subscription plan
export function getUploadLimits(plan: "basic" | "pro" | "inactive") {
  return UPLOAD_LIMITS[plan];
}
