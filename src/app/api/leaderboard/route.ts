import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Leaderboard - top users ranked by XP
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // weekly, monthly, all
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1-100

    let where: Record<string, unknown> = {};
    const orderByField = 'xp';
    const orderDirection: 'desc' | 'asc' = 'desc';

    if (period === 'weekly') {
      // Users most active in the last 7 days - use lastActiveAt as a proxy
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      where = {
        lastActiveAt: { gte: weekAgo },
      };
    } else if (period === 'monthly') {
      // Users most active in the last 30 days
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      where = {
        lastActiveAt: { gte: monthAgo },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        totalWorkouts: true,
        subscriptionTier: true,
      },
      orderBy: { [orderByField]: orderDirection },
      take: limit,
    });

    // Get current user's rank
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { xp: true },
    });

    let currentUserRank = null;
    if (currentUser) {
      currentUserRank = await prisma.user.count({
        where: {
          ...where,
          xp: { gt: currentUser.xp },
        },
      });
      currentUserRank += 1; // 1-indexed
    }

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      longestStreak: user.longestStreak,
      totalWorkouts: user.totalWorkouts,
      subscriptionTier: user.subscriptionTier,
    }));

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      period,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
