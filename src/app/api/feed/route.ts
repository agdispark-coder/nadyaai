import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Social feed - posts from user + friends, with like/comment counts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: { userId: session.userId },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);

    // Author IDs = self + friends
    const authorIds = [session.userId, ...friendIds];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId: { in: authorIds },
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              level: true,
              xp: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: session.userId
            ? {
                where: { userId: session.userId },
                select: { id: true },
                take: 1,
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          userId: { in: authorIds },
          isPublic: true,
        },
      }),
    ]);

    const feed = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      type: post.type,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      author: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: post.likes?.length > 0,
    }));

    return NextResponse.json({
      feed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
