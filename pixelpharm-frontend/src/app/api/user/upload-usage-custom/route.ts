import { NextResponse } from 'next/server';
import { getUserUploadUsage } from '@/lib/subscription/upload-limits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('📊 Getting upload usage for custom auth user:', userId);

    const uploadUsage = await getUserUploadUsage(userId);

    return NextResponse.json(uploadUsage);
  } catch (error: any) {
    console.error('Error fetching upload usage for custom auth:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload usage' },
      { status: 500 }
    );
  }
}