// Quick test for the corrected database URL
const { PrismaClient } = require('@prisma/client');

const testUrl = "postgresql://postgres:lazycoderislazy_13@oqsswiriikvrhakhfkdn.supabase.co:5432/postgres?sslmode=require";

console.log('🔍 Testing corrected database URL...');
console.log('URL:', testUrl.replace(/:[^:@]*@/, ':***@')); // Hide password

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testUrl
    }
  }
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();