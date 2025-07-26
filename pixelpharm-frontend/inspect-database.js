// inspect-database.js
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

    throw new Error("DATABASE_URL not found in prisma/.env");
  } catch (error) {
    console.error("❌ Error reading database URL:", error.message);
    process.exit(1);
  }
}

async function inspectDatabase() {
  const databaseUrl = getDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("🔗 Connected to database for inspection\n");

    // Get users table structure
    console.log("📋 USERS TABLE STRUCTURE:");
    const usersColumns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    usersColumns.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type}${
          row.character_maximum_length
            ? `(${row.character_maximum_length})`
            : ""
        } ${row.is_nullable === "NO" ? "NOT NULL" : "NULL"} ${
          row.column_default ? `DEFAULT ${row.column_default}` : ""
        }`
      );
    });

    // Get primary key info
    console.log("\n🔑 PRIMARY KEY INFO:");
    const primaryKey = await client.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users' 
        AND tc.constraint_type = 'PRIMARY KEY'
    `);

    primaryKey.rows.forEach((row) => {
      console.log(
        `  - Constraint: ${row.constraint_name}, Column: ${row.column_name}`
      );
    });

    // Get unique constraints
    console.log("\n🔒 UNIQUE CONSTRAINTS:");
    const uniqueConstraints = await client.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users' 
        AND tc.constraint_type = 'UNIQUE'
      ORDER BY tc.constraint_name
    `);

    uniqueConstraints.rows.forEach((row) => {
      console.log(
        `  - Constraint: ${row.constraint_name}, Column: ${row.column_name}`
      );
    });

    // Check foreign keys that reference users table
    console.log("\n🔗 FOREIGN KEYS REFERENCING USERS:");
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name as foreign_key_column,
        ccu.column_name as referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
      ORDER BY tc.table_name, kcu.column_name
    `);

    foreignKeys.rows.forEach((row) => {
      console.log(
        `  - ${row.table_name}.${row.foreign_key_column} -> users.${row.referenced_column}`
      );
    });

    // Check if there are any existing users
    console.log("\n👥 USER COUNT:");
    const userCount = await client.query("SELECT COUNT(*) as count FROM users");
    console.log(`  - Total users: ${userCount.rows[0].count}`);

    if (userCount.rows[0].count > 0) {
      const sampleUser = await client.query(
        "SELECT id, user_id, email, provider FROM users LIMIT 1"
      );
      console.log("  - Sample user:", sampleUser.rows[0]);
    }

    console.log("\n🎯 DIAGNOSIS:");
    console.log(
      "Based on the foreign key relationships, your other tables are referencing:"
    );

    // Determine what column foreign keys actually reference
    const referencedColumn = foreignKeys.rows[0]?.referenced_column;
    if (referencedColumn === "id") {
      console.log(
        "❌ PROBLEM: Foreign keys reference users.id (integer primary key)"
      );
      console.log(
        "🔧 SOLUTION: Schema should use id as primary key, not userId"
      );
    } else if (referencedColumn === "user_id") {
      console.log("✅ GOOD: Foreign keys reference users.user_id");
      console.log("🔧 SOLUTION: Schema should use userId as primary key");
    }
  } catch (error) {
    console.error("❌ Inspection error:", error.message);
  } finally {
    await client.end();
  }
}

inspectDatabase();
