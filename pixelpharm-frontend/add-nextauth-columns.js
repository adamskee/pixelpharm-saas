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

async function addNextAuthColumns() {
  const client = new Client({ connectionString: getDatabaseUrl() });

  try {
    await client.connect();
    console.log("🔗 Adding missing NextAuth columns...");

    // Add missing columns
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT");
    console.log("✅ Added name column");

    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT");
    console.log("✅ Added image column");

    await client.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP"
    );
    console.log("✅ Added email_verified column");

    console.log("🎉 NextAuth columns added successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

addNextAuthColumns();
