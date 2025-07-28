// create-biomarker-table.js
// Safe migration script for adding biomarker_values table
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function createBiomarkerTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL database");

    // Drop table if exists and recreate (safer approach)
    console.log("📊 Recreating biomarker_values table...");

    await client.query(`DROP TABLE IF EXISTS biomarker_values CASCADE;`);
    console.log("🗑️ Dropped existing table (if any)");

    await client.query(`
      CREATE TABLE biomarker_values (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        biomarker_name VARCHAR(255) NOT NULL,
        value DECIMAL(10,3) NOT NULL,
        unit VARCHAR(50),
        category VARCHAR(100),
        status VARCHAR(20),
        confidence DECIMAL(3,2),
        file_key VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, biomarker_name, file_key)
      );
    `);
    console.log("✅ biomarker_values table created successfully");

    // Verify table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'biomarker_values'
      ORDER BY ordinal_position;
    `);

    console.log("📋 Table structure verification:");
    tableInfo.rows.forEach((col) => {
      console.log(
        `   ${col.column_name}: ${col.data_type} (${
          col.is_nullable === "YES" ? "nullable" : "not null"
        })`
      );
    });

    // Create indexes for performance (with error handling)
    console.log("🔍 Creating performance indexes...");

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_biomarker_values_user_id 
        ON biomarker_values(user_id);
      `);
      console.log("   ✅ User ID index created");
    } catch (error) {
      console.warn("   ⚠️ User ID index creation failed:", error.message);
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_biomarker_values_category 
        ON biomarker_values(category);
      `);
      console.log("   ✅ Category index created");
    } catch (error) {
      console.warn("   ⚠️ Category index creation failed:", error.message);
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_biomarker_values_created_at 
        ON biomarker_values(created_at);
      `);
      console.log("   ✅ Created_at index created");
    } catch (error) {
      console.warn("   ⚠️ Created_at index creation failed:", error.message);
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_biomarker_values_status 
        ON biomarker_values(status);
      `);
      console.log("   ✅ Status index created");
    } catch (error) {
      console.warn("   ⚠️ Status index creation failed:", error.message);
    }

    console.log("✅ Performance indexes completed");

    // Add some reference biomarker data for testing
    console.log("📋 Adding reference biomarker data...");

    await client.query(`
      INSERT INTO biomarker_values (
        user_id, biomarker_name, value, unit, category, status, confidence, file_key, created_at
      ) VALUES 
        ('user-demo', 'Total Cholesterol', 185.0, 'mg/dL', 'lipid', 'normal', 0.95, 'demo-file-1', NOW()),
        ('user-demo', 'HDL Cholesterol', 55.0, 'mg/dL', 'lipid', 'normal', 0.92, 'demo-file-1', NOW()),
        ('user-demo', 'LDL Cholesterol', 110.0, 'mg/dL', 'lipid', 'normal', 0.90, 'demo-file-1', NOW()),
        ('user-demo', 'Triglycerides', 120.0, 'mg/dL', 'lipid', 'normal', 0.88, 'demo-file-1', NOW()),
        ('user-demo', 'Glucose', 95.0, 'mg/dL', 'glucose', 'normal', 0.96, 'demo-file-2', NOW()),
        ('user-demo', 'HbA1c', 5.2, '%', 'glucose', 'normal', 0.94, 'demo-file-2', NOW()),
        ('user-demo', 'White Blood Cell Count', 7.5, 'K/uL', 'complete_blood_count', 'normal', 0.91, 'demo-file-3', NOW()),
        ('user-demo', 'Red Blood Cell Count', 4.8, 'M/uL', 'complete_blood_count', 'normal', 0.89, 'demo-file-3', NOW()),
        ('user-demo', 'Hemoglobin', 14.2, 'g/dL', 'complete_blood_count', 'normal', 0.93, 'demo-file-3', NOW()),
        ('user-demo', 'Creatinine', 0.9, 'mg/dL', 'kidney', 'normal', 0.87, 'demo-file-4', NOW())
      ON CONFLICT (user_id, biomarker_name, file_key) DO NOTHING;
    `);

    console.log("✅ Demo biomarker data added");

    // Verify the table was created properly
    const result = await client.query(`
      SELECT COUNT(*) as total_biomarkers,
             COUNT(DISTINCT category) as categories,
             COUNT(DISTINCT user_id) as users
      FROM biomarker_values;
    `);

    const stats = result.rows[0];
    console.log("📊 Table verification:");
    console.log(`   Total biomarkers: ${stats.total_biomarkers}`);
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Users: ${stats.users}`);

    // Show sample data
    const sampleData = await client.query(`
      SELECT biomarker_name, value, unit, category, status 
      FROM biomarker_values 
      LIMIT 5;
    `);

    console.log("📋 Sample biomarker data:");
    sampleData.rows.forEach((row) => {
      console.log(
        `   ${row.biomarker_name}: ${row.value} ${row.unit} (${row.status})`
      );
    });

    console.log("🎉 Database migration completed successfully!");
    console.log("💡 Your enhanced pipeline can now store biomarker data");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("Details:", error.message);

    if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      console.log("💡 Create database first: createdb pixelpharm");
    }

    if (error.message.includes("authentication")) {
      console.log("💡 Check your DATABASE_URL in .env.local");
    }
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration
createBiomarkerTable();
