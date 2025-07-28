// test-biomarker-data.js
// Quick test to verify biomarker data is accessible
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function testBiomarkerData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to database for testing");

    // Test 1: Get total biomarker count
    const totalResult = await client.query(`
      SELECT COUNT(*) as total FROM biomarker_values;
    `);
    console.log(
      `📊 Total biomarkers in database: ${totalResult.rows[0].total}`
    );

    // Test 2: Get biomarkers by category
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM biomarker_values 
      GROUP BY category 
      ORDER BY count DESC;
    `);

    console.log("📋 Biomarkers by category:");
    categoryResult.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count} biomarkers`);
    });

    // Test 3: Get abnormal values (non-normal status)
    const abnormalResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM biomarker_values 
      GROUP BY status;
    `);

    console.log("🏥 Health status distribution:");
    abnormalResult.rows.forEach((row) => {
      const emoji =
        row.status === "normal"
          ? "✅"
          : row.status === "high"
          ? "⬆️"
          : row.status === "low"
          ? "⬇️"
          : "❓";
      console.log(`   ${emoji} ${row.status}: ${row.count} values`);
    });

    // Test 4: Get recent biomarkers
    const recentResult = await client.query(`
      SELECT biomarker_name, value, unit, status, created_at 
      FROM biomarker_values 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);

    console.log("📅 Most recent biomarkers:");
    recentResult.rows.forEach((row) => {
      const status =
        row.status === "normal"
          ? "✅"
          : row.status === "high"
          ? "⬆️"
          : row.status === "low"
          ? "⬇️"
          : "❓";
      console.log(
        `   ${status} ${row.biomarker_name}: ${row.value} ${row.unit} (${row.status})`
      );
    });

    // Test 5: Simulate API endpoint
    console.log("\n🔗 Testing API endpoint format...");
    const apiResult = await client.query(`
      SELECT 
        user_id,
        COUNT(*) as total_biomarkers,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT file_key) as reports,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN status = 'high' THEN 1 END) as high_values,
        COUNT(CASE WHEN status = 'low' THEN 1 END) as low_values,
        COUNT(CASE WHEN status = 'normal' THEN 1 END) as normal_values
      FROM biomarker_values 
      WHERE user_id = 'user-demo'
      GROUP BY user_id;
    `);

    if (apiResult.rows.length > 0) {
      const stats = apiResult.rows[0];
      console.log("📊 API Response Format (demo user):");
      console.log(`   User ID: ${stats.user_id}`);
      console.log(`   Total Biomarkers: ${stats.total_biomarkers}`);
      console.log(`   Categories: ${stats.categories}`);
      console.log(`   Reports: ${stats.reports}`);
      console.log(
        `   Average Confidence: ${(stats.avg_confidence || 0).toFixed(2)}`
      );
      console.log(`   Normal Values: ${stats.normal_values}`);
      console.log(
        `   Abnormal Values: ${
          parseInt(stats.high_values) + parseInt(stats.low_values)
        }`
      );
    }

    console.log("\n🎉 Database test completed successfully!");
    console.log("💡 Your biomarker storage is ready for the enhanced pipeline");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    console.error("Details:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

// Run the test
testBiomarkerData();
