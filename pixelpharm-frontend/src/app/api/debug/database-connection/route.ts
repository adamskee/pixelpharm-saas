import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function GET() {
  try {
    // Check environment variables (safely)
    const databaseUrl = process.env.DATABASE_URL;
    const hasDbUrl = !!databaseUrl;
    const dbUrlPreview = databaseUrl 
      ? `${databaseUrl.substring(0, 20)}...${databaseUrl.substring(databaseUrl.length - 10)}`
      : 'NOT SET';

    console.log('🔍 Database Connection Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      hasDbUrl,
      dbUrlPreview,
    });

    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      const userCount = await prisma.user.count();
      console.log(`📊 Total users in database: ${userCount}`);

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        environment: process.env.NODE_ENV,
        hasDbUrl,
        dbUrlPreview,
        userCount,
      });

    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError);
      
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message,
        environment: process.env.NODE_ENV,
        hasDbUrl,
        dbUrlPreview,
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error.message,
    }, { status: 500 });
  }
}