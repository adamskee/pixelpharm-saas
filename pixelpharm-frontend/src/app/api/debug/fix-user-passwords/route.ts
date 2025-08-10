import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting password field migration...');

    // Find all users with credentials provider and check their password status
    const credentialsUsers = await prisma.user.findMany({
      where: { 
        provider: 'credentials' 
      },
      select: {
        userId: true,
        email: true,
        passwordHash: true,
        provider: true,
        createdAt: true,
        subscriptionStatus: true,
      }
    });

    const usersNeedingMigration = credentialsUsers.filter(user => 
      !user.passwordHash || user.passwordHash === ''
    );

    console.log('📊 Users needing password migration:', usersNeedingMigration);

    if (usersNeedingMigration.length > 0) {
      console.log(`🔄 Found ${usersNeedingMigration.length} users that may need password migration`);
      
      return NextResponse.json({
        message: `Found ${usersNeedingMigration.length} users with missing password hashes`,
        users: usersNeedingMigration.map(user => ({
          userId: user.userId,
          email: user.email,
          hasPasswordHash: !!user.passwordHash,
          passwordHashLength: user.passwordHash?.length || 0,
          provider: user.provider,
          createdAt: user.createdAt,
          subscriptionStatus: user.subscriptionStatus,
        })),
        action: 'These users will need their passwords reset or recreated'
      });
    } else {
      console.log('✅ No users found needing password migration');

      return NextResponse.json({
        message: 'No migration needed',
        totalCredentialsUsers: credentialsUsers.length,
        credentialsUsers: credentialsUsers.map(user => ({
          userId: user.userId,
          email: user.email,
          hasPasswordHash: !!user.passwordHash,
          passwordHashLength: user.passwordHash?.length || 0,
          provider: user.provider,
          createdAt: user.createdAt,
          subscriptionStatus: user.subscriptionStatus,
        }))
      });
    }

  } catch (error: any) {
    console.error('❌ Error in password migration check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}