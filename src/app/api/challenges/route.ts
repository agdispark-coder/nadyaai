import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List active challenges with user participation status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const now = new Date();

    const where: Record<string, unknown> = {
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (type) {
      where.type = type;
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
          participants: {
            where: { userId: session.userId },
            select: {
              id: true,
              progress: true,
              completed: true,
              joinedAt: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.challenge.count({ where }),
    ]);

    const challengesWithStatus = challenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      category: challenge.category,
      goalTarget: challenge.goalTarget,
      goalUnit: challenge.goalUnit,
      rewardXP: challenge.rewardXP,
      rewardCoins: challenge.rewardCoins,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      participantCount: challenge._count.participants,
      creator: challenge.creator,
      userParticipation: challenge.participants[0] || null,
    }));

    return NextResponse.json({
      challenges: challengesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/challenges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create challenge
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      category,
      goalTarget,
      goalUnit,
      startDate,
      endDate,
      rewardXP,
      rewardCoins,
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!type || !['daily', 'weekly', 'monthly', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be one of: daily, weekly, monthly, custom' },
        { status: 400 }
      );
    }

    if (!category || !['workout', 'nutrition', 'consistency', 'special'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be one of: workout, nutrition, consistency, special' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        category,
        goalTarget: goalTarget || 1,
        goalUnit: goalUnit || 'times',
        rewardXP: rewardXP || 50,
        rewardCoins: rewardCoins || 10,
        startDate: start,
        endDate: end,
        createdBy: session.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Auto-join the creator
    await prisma.challengeParticipant.create({
      data: {
        challengeId: challenge.id,
        userId: session.userId,
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('POST /api/challenges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
