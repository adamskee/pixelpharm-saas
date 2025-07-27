const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function getDatabaseUrl() {
  try {
    const envPath = path.join(__dirname, "prisma", ".env");
    const envContent = fs.readFileSync(envPath, "utf8");

    for (const line of envContent.split("\n")) {
      if (line.startsWith("DATABASE_URL=")) {
        return line.split("=")[1].replace(/"/g, "").trim();
      }
    }
  } catch (error) {
    console.error("Error reading DATABASE_URL");
    process.exit(1);
  }
}

async function debugBiomarkers() {
  const client = new Client({ connectionString: getDatabaseUrl() });

  try {
    await client.connect();
    console.log("🔗 Connected to database for biomarker debugging\n");

    // Check what tables exist
    console.log("📋 CHECKING DATABASE TABLES:");
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '%bio%' OR tablename LIKE '%test%' OR tablename LIKE '%upload%'
      ORDER BY tablename
    `);

    console.log(
      "Available tables:",
      tables.rows.map((r) => r.tablename)
    );

    // Check file uploads for your user
    console.log("\n📁 FILE UPLOADS:");
    const uploads = await client.query(`
      SELECT 
        upload_id,
        user_id,
        original_filename,
        upload_type,
        upload_status,
        created_at
      FROM file_uploads 
      WHERE user_id = '117355393393976327622'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`Found ${uploads.rows.length} file uploads:`);
    uploads.rows.forEach((upload) => {
      console.log(
        `  - ${upload.original_filename} (${upload.upload_type}) - Status: ${upload.upload_status}`
      );
      console.log(`    Upload ID: ${upload.upload_id}`);
      console.log(`    Created: ${upload.created_at}`);
    });

    // Check AI processing results
    console.log("\n🤖 AI PROCESSING RESULTS:");
    const aiResults = await client.query(`
      SELECT 
        processing_id,
        upload_id,
        processing_type,
        processing_status,
        raw_results,
        error_message,
        created_at
      FROM ai_processing_results 
      WHERE user_id = '117355393393976327622'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`Found ${aiResults.rows.length} AI processing results:`);
    aiResults.rows.forEach((result) => {
      console.log(`  - Upload: ${result.upload_id}`);
      console.log(
        `    Type: ${result.processing_type}, Status: ${result.processing_status}`
      );
      if (result.error_message) {
        console.log(`    Error: ${result.error_message}`);
      }
      if (result.raw_results) {
        console.log(`    Raw Results Keys:`, Object.keys(result.raw_results));
        if (result.raw_results.biomarkers) {
          console.log(
            `    Found ${result.raw_results.biomarkers.length} biomarkers in raw results`
          );
        }
      }
    });

    // Check blood test results
    console.log("\n🩸 BLOOD TEST RESULTS:");
    const bloodTests = await client.query(`
      SELECT 
        result_id,
        upload_id,
        test_date,
        lab_name,
        biomarkers,
        created_at
      FROM blood_test_results 
      WHERE user_id = '117355393393976327622'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`Found ${bloodTests.rows.length} blood test results:`);
    bloodTests.rows.forEach((test) => {
      console.log(
        `  - Test Date: ${test.test_date}, Lab: ${test.lab_name || "Unknown"}`
      );
      console.log(`    Upload ID: ${test.upload_id}`);
      if (test.biomarkers) {
        console.log(
          `    Biomarkers stored:`,
          Object.keys(test.biomarkers).length
        );
        console.log(
          `    Sample biomarkers:`,
          Object.keys(test.biomarkers).slice(0, 3)
        );
      }
    });

    // Check individual biomarker values
    console.log("\n📊 BIOMARKER VALUES:");
    const biomarkerValues = await client.query(`
      SELECT 
        biomarker_name,
        value,
        unit,
        is_abnormal,
        test_date,
        created_at
      FROM biomarker_values 
      WHERE user_id = '117355393393976327622'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(
      `Found ${biomarkerValues.rows.length} individual biomarker values:`
    );
    biomarkerValues.rows.forEach((biomarker) => {
      console.log(
        `  - ${biomarker.biomarker_name}: ${biomarker.value} ${
          biomarker.unit
        } ${biomarker.is_abnormal ? "⚠️" : "✅"}`
      );
      console.log(
        `    Test Date: ${biomarker.test_date}, Stored: ${biomarker.created_at}`
      );
    });

    // Check what the dashboard API is actually fetching
    console.log("\n🎯 DASHBOARD DATA QUERY SIMULATION:");
    const dashboardQuery = await client.query(`
      SELECT COUNT(*) as total_biomarkers
      FROM biomarker_values 
      WHERE user_id = '117355393393976327622'
    `);

    console.log(
      `Dashboard would see: ${dashboardQuery.rows[0].total_biomarkers} biomarkers`
    );

    // Check for recent uploads that might not have been processed
    console.log("\n⏰ RECENT UPLOAD STATUS:");
    const recentUploads = await client.query(`
      SELECT 
        fu.upload_id,
        fu.original_filename,
        fu.upload_status,
        fu.created_at,
        apr.processing_status,
        apr.error_message
      FROM file_uploads fu
      LEFT JOIN ai_processing_results apr ON fu.upload_id = apr.upload_id
      WHERE fu.user_id = '117355393393976327622'
      AND fu.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY fu.created_at DESC
    `);

    console.log(`Recent uploads (last 24h): ${recentUploads.rows.length}`);
    recentUploads.rows.forEach((upload) => {
      console.log(`  - ${upload.original_filename}`);
      console.log(`    Upload Status: ${upload.upload_status}`);
      console.log(
        `    Processing Status: ${upload.processing_status || "Not processed"}`
      );
      if (upload.error_message) {
        console.log(`    Error: ${upload.error_message}`);
      }
    });

    console.log("\n🎯 DIAGNOSIS:");
    if (uploads.rows.length === 0) {
      console.log(
        "❌ No file uploads found - files are not being uploaded properly"
      );
    } else if (aiResults.rows.length === 0) {
      console.log(
        "❌ Files uploaded but no AI processing results - OCR pipeline not working"
      );
    } else if (
      bloodTests.rows.length === 0 &&
      biomarkerValues.rows.length === 0
    ) {
      console.log(
        "❌ AI processing happening but biomarkers not being stored in database"
      );
    } else if (biomarkerValues.rows.length === 0) {
      console.log(
        "❌ Biomarkers in blood_test_results but not in biomarker_values table"
      );
    } else {
      console.log("✅ Data exists - check dashboard API endpoints");
    }
  } catch (error) {
    console.error("❌ Debug error:", error.message);
  } finally {
    await client.end();
  }
}

debugBiomarkers();
