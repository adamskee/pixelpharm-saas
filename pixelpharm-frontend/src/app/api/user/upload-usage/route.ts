import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { getUserUploadUsage } from '@/lib/subscription/upload-limits';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadUsage = await getUserUploadUsage(session.user.id);

    return NextResponse.json(uploadUsage);
  } catch (error: any) {
    console.error('Error fetching upload usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload usage' },
      { status: 500 }
    );
  }
}