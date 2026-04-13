import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Accept friend request (id = request id)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: requestId } = await params;

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only the receiver can accept
    if (friendRequest.receiverId !== session.userId) {
      return NextResponse.json({ error: 'Only the receiver can accept this request' }, { status: 403 });
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    await prisma.$transaction([
      // Update request status
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      }),
      // Create bidirectional friendships
      prisma.friendship.create({
        data: {
          userId: friendRequest.senderId,
          friendId: friendRequest.receiverId,
        },
      }),
      prisma.friendship.create({
        data: {
          userId: friendRequest.receiverId,
          friendId: friendRequest.senderId,
        },
      }),
      // Notify the sender
      prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: 'friend_request',
          title: 'Friend Request Accepted',
          message: 'Your friend request has been accepted!',
          data: JSON.stringify({
            friendRequestId: requestId,
            friendId: friendRequest.receiverId,
          }),
        },
      }),
    ]);

    return NextResponse.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('POST /api/friends/[id]/accept error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
