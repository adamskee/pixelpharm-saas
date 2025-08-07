-- Database migration to add Free Plan support
-- Run this in production to add the new user plan fields

-- Add PlanType enum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PRO');

-- Add new columns to users table
ALTER TABLE "users" 
  ADD COLUMN "plan_type" "PlanType" DEFAULT 'FREE' NOT NULL,
  ADD COLUMN "uploads_used" INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN "upgrade_prompt_shown" BOOLEAN DEFAULT FALSE NOT NULL;

-- Update existing users to have default plan type (already defaults to FREE)
-- This is safe as the default is already set

-- Add indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS "idx_users_plan_type" ON "users" ("plan_type");
CREATE INDEX IF NOT EXISTS "idx_users_uploads_used" ON "users" ("uploads_used");

-- Verify the migration
SELECT 
  plan_type, 
  COUNT(*) as user_count,
  AVG(uploads_used) as avg_uploads
FROM users 
GROUP BY plan_type;

COMMENT ON COLUMN "users"."plan_type" IS 'User subscription plan type for feature limitations';
COMMENT ON COLUMN "users"."uploads_used" IS 'Number of uploads used by the user (for plan limits)';
COMMENT ON COLUMN "users"."upgrade_prompt_shown" IS 'Whether upgrade prompt has been shown to user';