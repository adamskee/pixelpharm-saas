// add-auth-migration.js
const { Client } = require('pg');
require('dotenv').config({ path: 'prisma/.env' });

async function addAuthColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Add password_hash column
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');
    console.log('✅ Added password_hash column');

    // Add provider column
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT \'google\'');
    console.log('✅ Added provider column');

    // Update existing users
    await client.query('UPDATE users SET provider = \'google\' WHERE provider IS NULL');
    console.log('✅ Updated existing users');

    // Add index
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider)');
    console.log('✅ Added index');

    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_hash', 'provider')
      ORDER BY column_name
    `);
    
    console.log('✅ Verified columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.column_default ? ` (default: ${row.column_default})` : ''}`);
    });

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

addAuthColumns();