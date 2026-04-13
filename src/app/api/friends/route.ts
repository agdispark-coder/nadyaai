import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List user's friends + pending requests received
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [friends, pendingRequests] = await Promise.all([
      // Get accepted friendships (both directions)
      prisma.friendship.findMany({
        where: { userId: session.userId },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              xp: true,
              level: true,
              streak: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Get pending requests received
      prisma.friendRequest.findMany({
        where: {
          receiverId: session.userId,
          status: 'pending',
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              xp: true,
              level: true,
              streak: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      friends,
      pendingRequests,
    });
  } catch (error) {
    console.error('GET /api/friends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send friend request, or accept/reject via ?action= query param
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle accept/reject via query param
    if (action === 'accept' || action === 'reject') {
      const { requestId } = await request.json();

      if (!requestId) {
        return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
      }

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) {
        return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
      }

      if (friendRequest.receiverId !== session.userId) {
        return NextResponse.json({ error: 'You can only respond to requests sent to you' }, { status: 403 });
      }

      if (friendRequest.status !== 'pending') {
        return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
      }

      if (action === 'reject') {
        await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'rejected' },
        });
        return NextResponse.json({ message: 'Friend request rejected' });
      }

      // Accept: create bidirectional friendships
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'accepted' },
        }),
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
        // Notify the sender that their request was accepted
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            type: 'friend_request',
            title: 'Friend Request Accepted',
            message: `${session.email} accepted your friend request!`,
            data: JSON.stringify({ friendRequestId: requestId, friendId: friendRequest.receiverId }),
          },
        }),
      ]);

      return NextResponse.json({ message: 'Friend request accepted' });
    }

    // Default POST: Send friend request
    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    if (friendId === session.userId) {
      return NextResponse.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already friends (either direction)
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.userId, friendId },
          { userId: friendId, friendId: session.userId },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'You are already friends' }, { status: 409 });
    }

    // Check for pending request in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.userId, receiverId: friendId, status: 'pending' },
          { senderId: friendId, receiverId: session.userId, status: 'pending' },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'A pending friend request already exists between you two' }, { status: 409 });
    }

    // If there's a request from them to us that was rejected, allow re-send
    const rejectedRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.userId, receiverId: friendId, status: 'rejected' },
          { senderId: friendId, receiverId: session.userId, status: 'rejected' },
        ],
      },
    });

    if (rejectedRequest) {
      // Update the rejected request to pending instead of creating new
      await prisma.friendRequest.update({
        where: { id: rejectedRequest.id },
        data: {
          senderId: session.userId,
          receiverId: friendId,
          status: 'pending',
          createdAt: new Date(),
        },
      });
    } else {
      // Create the friend request
      await prisma.friendRequest.create({
        data: {
          senderId: session.userId,
          receiverId: friendId,
        },
      });
    }

    // Create notification for the receiver
    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, name: true },
    });

    await prisma.notification.create({
      data: {
        userId: friendId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${sender?.username || sender?.name || 'Someone'} sent you a friend request`,
        data: JSON.stringify({ senderId: session.userId }),
      },
    });

    return NextResponse.json({ message: 'Friend request sent' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/friends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
