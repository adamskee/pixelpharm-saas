import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    console.log('🧪 Testing upload limits for user:', userId);

    // Test 1: Check if user exists
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { 
        userId: true, 
        email: true, 
        subscriptionStatus: true, 
        subscriptionPlan: true,
        subscriptionExpiresAt: true 
      }
    });

    console.log('🧪 User found:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found', userId }, { status: 404 });
    }

    // Test 2: Try to count file uploads with different approaches
    console.log('🧪 Testing file_uploads table access...');
    
    try {
      const totalFiles = await prisma.file_uploads.count({
        where: { user_id: userId }
      });
      console.log('🧪 Total files for user:', totalFiles);
    } catch (error: any) {
      console.error('🧪 Error accessing file_uploads:', error.message);
      return NextResponse.json({ 
        error: 'Database access error', 
        details: error.message,
        step: 'file_uploads count'
      }, { status: 500 });
    }

    // Test 3: Try specific upload type query
    try {
      const bodyCompositionFiles = await prisma.file_uploads.count({
        where: { 
          user_id: userId,
          upload_type: 'BODY_COMPOSITION'
        }
      });
      console.log('🧪 Body composition files:', bodyCompositionFiles);
    } catch (error: any) {
      console.error('🧪 Error with upload_type filter:', error.message);
      return NextResponse.json({ 
        error: 'Upload type filter error', 
        details: error.message,
        step: 'upload_type filter'
      }, { status: 500 });
    }

    // Test 4: Try date range query
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyFiles = await prisma.file_uploads.count({
        where: {
          user_id: userId,
          upload_type: {
            in: ['BLOOD_TESTS', 'BODY_COMPOSITION', 'FITNESS_ACTIVITIES']
          },
          created_at: {
            gte: startOfMonth
          }
        }
      });
      console.log('🧪 Monthly files:', monthlyFiles);
    } catch (error: any) {
      console.error('🧪 Error with date range query:', error.message);
      return NextResponse.json({ 
        error: 'Date range query error', 
        details: error.message,
        step: 'date range query'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All tests passed',
      user: user
    });

  } catch (error: any) {
    console.error('🧪 Test endpoint error:', error);
    console.error('🧪 Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}