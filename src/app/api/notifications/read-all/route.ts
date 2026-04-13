import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Mark all user notifications as read
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('POST /api/notifications/read-all error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
