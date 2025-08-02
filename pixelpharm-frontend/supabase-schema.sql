-- PixelPharm Database Schema for Supabase
-- Generated from Prisma schema

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "user_id" TEXT NOT NULL,
    "cognito_sub" TEXT,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "name" TEXT,
    "image" TEXT,
    "provider" TEXT,
    "password_hash" TEXT,
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- Create unique indexes for User table
CREATE UNIQUE INDEX IF NOT EXISTS "User_cognito_sub_key" ON "User"("cognito_sub");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Create FileUpload table
CREATE TABLE IF NOT EXISTS "FileUpload" (
    "upload_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "upload_status" TEXT NOT NULL DEFAULT 'pending',
    "processing_stage" TEXT NOT NULL DEFAULT 'uploaded',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("upload_id")
);

-- Create BiomarkerValue table
CREATE TABLE IF NOT EXISTS "BiomarkerValue" (
    "biomarker_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "biomarker_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "reference_range_min" DOUBLE PRECISION,
    "reference_range_max" DOUBLE PRECISION,
    "is_abnormal" BOOLEAN NOT NULL DEFAULT false,
    "abnormality_type" TEXT,
    "test_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiomarkerValue_pkey" PRIMARY KEY ("biomarker_id")
);

-- Create BodyComposition table
CREATE TABLE IF NOT EXISTS "BodyComposition" (
    "composition_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "body_fat_percentage" DOUBLE PRECISION,
    "muscle_mass_kg" DOUBLE PRECISION,
    "bone_mass_kg" DOUBLE PRECISION,
    "water_percentage" DOUBLE PRECISION,
    "visceral_fat_level" INTEGER,
    "metabolic_age" INTEGER,
    "bmr_kcal" INTEGER,
    "measurement_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyComposition_pkey" PRIMARY KEY ("composition_id")
);

-- Create FitnessActivity table
CREATE TABLE IF NOT EXISTS "FitnessActivity" (
    "activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "activity_name" TEXT,
    "duration_minutes" INTEGER,
    "distance_km" DOUBLE PRECISION,
    "calories_burned" INTEGER,
    "average_heart_rate" INTEGER,
    "max_heart_rate" INTEGER,
    "activity_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessActivity_pkey" PRIMARY KEY ("activity_id")
);

-- Create AIProcessingResult table
CREATE TABLE IF NOT EXISTS "AIProcessingResult" (
    "result_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "processing_type" TEXT NOT NULL,
    "input_data" TEXT,
    "ai_response" TEXT,
    "extracted_data" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "processing_time_ms" INTEGER,
    "model_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProcessingResult_pkey" PRIMARY KEY ("result_id")
);

-- Create HealthInsight table
CREATE TABLE IF NOT EXISTS "HealthInsight" (
    "insight_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_biomarkers" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthInsight_pkey" PRIMARY KEY ("insight_id")
);

-- Create UserSubscription table
CREATE TABLE IF NOT EXISTS "UserSubscription" (
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "status" TEXT NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("subscription_id")
);

-- Create foreign key constraints
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiomarkerValue" ADD CONSTRAINT "BiomarkerValue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BiomarkerValue" ADD CONSTRAINT "BiomarkerValue_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "FileUpload"("upload_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BodyComposition" ADD CONSTRAINT "BodyComposition_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BodyComposition" ADD CONSTRAINT "BodyComposition_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "FileUpload"("upload_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FitnessActivity" ADD CONSTRAINT "FitnessActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FitnessActivity" ADD CONSTRAINT "FitnessActivity_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "FileUpload"("upload_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIProcessingResult" ADD CONSTRAINT "AIProcessingResult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIProcessingResult" ADD CONSTRAINT "AIProcessingResult_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "FileUpload"("upload_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HealthInsight" ADD CONSTRAINT "HealthInsight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "FileUpload_user_id_idx" ON "FileUpload"("user_id");
CREATE INDEX IF NOT EXISTS "BiomarkerValue_user_id_idx" ON "BiomarkerValue"("user_id");
CREATE INDEX IF NOT EXISTS "BiomarkerValue_upload_id_idx" ON "BiomarkerValue"("upload_id");
CREATE INDEX IF NOT EXISTS "BodyComposition_user_id_idx" ON "BodyComposition"("user_id");
CREATE INDEX IF NOT EXISTS "FitnessActivity_user_id_idx" ON "FitnessActivity"("user_id");
CREATE INDEX IF NOT EXISTS "AIProcessingResult_user_id_idx" ON "AIProcessingResult"("user_id");
CREATE INDEX IF NOT EXISTS "HealthInsight_user_id_idx" ON "HealthInsight"("user_id");
CREATE INDEX IF NOT EXISTS "UserSubscription_user_id_idx" ON "UserSubscription"("user_id");