-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Blood test storage with flexible JSON structure
CREATE TABLE blood_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    test_date DATE NOT NULL,
    lab_name VARCHAR(100),
    file_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(50),
    raw_data JSONB,
    normalized_metrics JSONB,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_blood_tests_user_id (user_id),
    INDEX idx_blood_tests_test_date (test_date)
);

-- Body composition tests (InBody 570, DEXA, etc.)
CREATE TABLE body_composition_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    test_date DATE NOT NULL,
    test_type VARCHAR(50) DEFAULT 'InBody570',
    
    -- Basic metrics
    total_body_water DECIMAL(5,1),
    protein_mass DECIMAL(5,1),
    minerals DECIMAL(5,2),
    body_fat_mass DECIMAL(5,1),
    total_weight DECIMAL(5,1),
    inbody_score INTEGER,
    
    -- Muscle analysis
    skeletal_muscle_mass DECIMAL(5,1),
    body_fat_percentage DECIMAL(5,1),
    
    -- Segmental lean mass (kg)
    right_arm_lean DECIMAL(5,2),
    left_arm_lean DECIMAL(5,2),
    trunk_lean DECIMAL(5,1),
    right_leg_lean DECIMAL(5,2),
    left_leg_lean DECIMAL(5,2),
    
    -- Advanced biomarkers
    basal_metabolic_rate INTEGER,
    waist_hip_ratio DECIMAL(4,3),
    visceral_fat_level INTEGER,
    bone_mineral_content DECIMAL(5,2),
    body_cell_mass DECIMAL(5,1),
    extracellular_water DECIMAL(5,1),
    intracellular_water DECIMAL(5,1),
    
    -- Raw data storage
    raw_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_body_composition_user_id (user_id),
    INDEX idx_body_composition_test_date (test_date)
);

-- Fitness activities from Garmin Connect
CREATE TABLE fitness_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    activity_date TIMESTAMP NOT NULL,
    activity_type VARCHAR(100),
    duration_seconds INTEGER,
    distance_km DECIMAL(8,2),
    calories INTEGER,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    aerobic_training_effect DECIMAL(3,1),
    training_stress_score DECIMAL(6,1),
    avg_pace_per_km TIME,
    cadence INTEGER,
    total_strokes INTEGER,
    steps INTEGER,
    raw_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_fitness_activities_user_id (user_id),
    INDEX idx_fitness_activities_date (activity_date),
    INDEX idx_fitness_activities_type (activity_type)
);

-- AI-generated recommendations
CREATE TABLE user_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    blood_test_id UUID REFERENCES blood_tests(id),
    body_composition_id UUID REFERENCES body_composition_tests(id),
    fitness_activity_id UUID REFERENCES fitness_activities(id),
    recommendation_type VARCHAR(50),
    content JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_recommendations_user_id (user_id),
    INDEX idx_user_recommendations_status (status)
);

-- Reminder scheduling system
CREATE TABLE reminder_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    reminder_type VARCHAR(50),
    schedule_data JSONB NOT NULL,
    next_reminder TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_reminder_schedules_user_id (user_id),
    INDEX idx_reminder_schedules_next_reminder (next_reminder)
);

-- Biomarker reference ranges
CREATE TABLE reference_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_name VARCHAR(100) NOT NULL,
    biomarker_type VARCHAR(50),
    lab_name VARCHAR(100),
    unit VARCHAR(20),
    min_value DECIMAL(10,3),
    max_value DECIMAL(10,3),
    optimal_min DECIMAL(10,3),
    optimal_max DECIMAL(10,3),
    age_group VARCHAR(20),
    gender VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_reference_ranges_biomarker (biomarker_name),
    INDEX idx_reference_ranges_type (biomarker_type)
);