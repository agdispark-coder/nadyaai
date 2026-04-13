import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/streaks — Current streak info + history for calendar view (last 30 days)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get daily logs for the last 30 days for calendar view
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        userId: session.userId,
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        caloriesIn: true,
        caloriesOut: true,
        waterIntake: true,
        sleepHours: true,
        steps: true,
        mood: true,
      },
      orderBy: { date: 'asc' },
    });

    // Also check workouts and meals per day for activity status
    const recentWorkouts = await prisma.workout.groupBy({
      by: ['completedAt'],
      where: {
        userId: session.userId,
        completedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    const recentMeals = await prisma.meal.groupBy({
      by: ['loggedAt'],
      where: {
        userId: session.userId,
        loggedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Build activity map
    const activityMap = new Map<string, { workouts: number; meals: number }>();
    for (const w of recentWorkouts) {
      const dateKey = new Date(w.completedAt).toISOString().split('T')[0];
      const existing = activityMap.get(dateKey) || { workouts: 0, meals: 0 };
      activityMap.set(dateKey, { ...existing, workouts: existing.workouts + w._count });
    }
    for (const m of recentMeals) {
      const dateKey = new Date(m.loggedAt).toISOString().split('T')[0];
      const existing = activityMap.get(dateKey) || { workouts: 0, meals: 0 };
      activityMap.set(dateKey, { ...existing, meals: existing.meals + m._count });
    }

    // Build calendar data (last 30 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calendar: Array<{
      date: string;
      day: string;
      isActive: boolean;
      workouts: number;
      meals: number;
      log: typeof dailyLogs[number] | null;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const activity = activityMap.get(dateKey) || { workouts: 0, meals: 0 };
      const log = dailyLogs.find(
        (l) => new Date(l.date).toISOString().split('T')[0] === dateKey
      ) || null;

      calendar.push({
        date: dateKey,
        day: dayNames[d.getDay()],
        isActive: (activity.workouts + activity.meals) > 0 || log !== null,
        workouts: activity.workouts,
        meals: activity.meals,
        log,
      });
    }

    // Check if streak is still active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = activityMap.get(today.toISOString().split('T')[0]);
    const todayLog = dailyLogs.find(
      (l) => new Date(l.date).toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    const isStreakActiveToday = !!todayActivity || !!todayLog;

    return NextResponse.json({
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      lastActiveAt: user.lastActiveAt,
      isStreakActiveToday,
      calendar,
      dailyLogs,
    });
  } catch (error) {
    console.error('GET /api/streaks error:', error);
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
  }
}

// POST /api/streaks — Manual check-in / update streak for today
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    if (user.lastActiveAt) {
      const lastActive = new Date(user.lastActiveAt);
      lastActive.setHours(0, 0, 0, 0);
      if (lastActive.getTime() === today.getTime()) {
        return NextResponse.json({
          message: 'Already checked in today',
          streak: user.streak,
          longestStreak: user.longestStreak,
        });
      }
    }

    // Calculate new streak
    let newStreak = 1;
    if (user.lastActiveAt) {
      const lastActive = new Date(user.lastActiveAt);
      lastActive.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // If last active was yesterday, continue streak; otherwise reset
      if (lastActive.getTime() === yesterday.getTime()) {
        newStreak = user.streak + 1;
      }
    }

    const newLongest = Math.max(newStreak, user.longestStreak);

    // Update user streak
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        streak: newStreak,
        longestStreak: newLongest,
        lastActiveAt: now,
      },
      select: {
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
      },
    });

    // Ensure daily log exists for today
    await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date: today,
        },
      },
      create: {
        userId: session.userId,
        date: today,
      },
      update: {},
    });

    return NextResponse.json({
      message: 'Check-in successful!',
      streak: updatedUser.streak,
      longestStreak: updatedUser.longestStreak,
      previousStreak: user.streak,
      isNewLongest: updatedUser.longestStreak > user.longestStreak,
    });
  } catch (error) {
    console.error('POST /api/streaks error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
