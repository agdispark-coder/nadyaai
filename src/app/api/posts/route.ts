import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List user's posts with likes and comments
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

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { userId: session.userId },
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: {
            where: { userId: session.userId },
            select: { id: true },
            take: 1,
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: { userId: session.userId },
      }),
    ]);

    const postsWithDetails = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      type: post.type,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: post.likes?.length > 0,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.user,
      })),
    }));

    return NextResponse.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create post
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, imageUrl, type } = body;

    // At least content or imageUrl must be provided
    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: 'Post must have either content or an image' },
        { status: 400 }
      );
    }

    const validTypes = ['post', 'workout_share', 'achievement', 'challenge'];
    const postType = type && validTypes.includes(type) ? type : 'post';

    const post = await prisma.post.create({
      data: {
        userId: session.userId,
        content: content?.trim() || null,
        imageUrl: imageUrl || null,
        type: postType,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Notify friends about new post
    const friendships = await prisma.friendship.findMany({
      where: { userId: session.userId },
      select: { friendId: true },
    });

    if (friendships.length > 0) {
      const friendIds = friendships.map((f) => f.friendId);
      const sender = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true, name: true },
      });

      await prisma.notification.createMany({
        data: friendIds.map((friendId) => ({
          userId: friendId,
          type: 'system',
          title: 'New Post from Friend',
          message: `${sender?.username || sender?.name || 'Your friend'} shared a new post`,
          data: JSON.stringify({
            postId: post.id,
            authorId: session.userId,
            postType: postType,
          }),
        })),
      });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
