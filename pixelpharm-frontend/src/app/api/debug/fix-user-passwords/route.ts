import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting password field migration...');

    // Find all users where password field exists but passwordHash doesn't
    // Note: This assumes there might be a 'password' field in the database that shouldn't exist
    // according to the schema, but might exist from old webhook code
    
    const usersNeedingMigration = await prisma.$queryRaw`
      SELECT user_id, email, password_hash, provider 
      FROM "User" 
      WHERE provider = 'credentials' 
      AND (password_hash IS NULL OR password_hash = '')
    `;

    console.log('📊 Users needing password migration:', usersNeedingMigration);

    if (Array.isArray(usersNeedingMigration) && usersNeedingMigration.length > 0) {
      console.log(`🔄 Found ${usersNeedingMigration.length} users that may need password migration`);
      
      return NextResponse.json({
        message: `Found ${usersNeedingMigration.length} users with missing password hashes`,
        users: usersNeedingMigration,
        action: 'These users will need their passwords reset or recreated'
      });
    } else {
      console.log('✅ No users found needing password migration');
      
      // Let's also check for any users with credentials provider
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

      return NextResponse.json({
        message: 'No migration needed',
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