import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getXPProgress } from '@/lib/utils';

// GET /api/analytics — User analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '7', 10); // 7 or 30 days

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - period);

    // Fetch user with core stats
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        totalWorkouts: true,
        totalMeals: true,
        totalCaloriesBurned: true,
        weight: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // XP progression
    const xpInfo = getXPProgress(user.xp);

    // Workout stats for the period
    const workoutStats = await prisma.workout.aggregate({
      where: {
        userId: session.userId,
        completedAt: { gte: periodStart },
      },
      _count: true,
      _sum: {
        duration: true,
        calories: true,
      },
    });

    // Meal stats for the period
    const mealStats = await prisma.meal.aggregate({
      where: {
        userId: session.userId,
        loggedAt: { gte: periodStart },
      },
      _count: true,
      _sum: {
        calories: true,
        protein: true,
        carbs: true,
        fats: true,
      },
    });

    // Streak data
    const streakData = {
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      lastActive: user.lastActiveAt,
    };

    // Weekly activity chart data — group workouts and meals by day
    const dailyWorkouts = await prisma.workout.groupBy({
      by: ['completedAt'],
      where: {
        userId: session.userId,
        completedAt: { gte: periodStart },
      },
      _count: true,
      _sum: { calories: true, duration: true },
    });

    const dailyMeals = await prisma.meal.groupBy({
      by: ['loggedAt'],
      where: {
        userId: session.userId,
        loggedAt: { gte: periodStart },
      },
      _count: true,
      _sum: { calories: true },
    });

    // Build daily chart data for the period
    const dailyChart: Array<{
      date: string;
      day: string;
      workouts: number;
      caloriesBurned: number;
      duration: number;
      meals: number;
      caloriesConsumed: number;
    }> = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create a map for quick lookup
    const workoutMap = new Map<string, { count: number; calories: number; duration: number }>();
    for (const w of dailyWorkouts) {
      const dateKey = new Date(w.completedAt).toISOString().split('T')[0];
      const existing = workoutMap.get(dateKey) || { count: 0, calories: 0, duration: 0 };
      workoutMap.set(dateKey, {
        count: existing.count + w._count,
        calories: existing.calories + (w._sum.calories || 0),
        duration: existing.duration + (w._sum.duration || 0),
      });
    }

    const mealMap = new Map<string, { count: number; calories: number }>();
    for (const m of dailyMeals) {
      const dateKey = new Date(m.loggedAt).toISOString().split('T')[0];
      const existing = mealMap.get(dateKey) || { count: 0, calories: 0 };
      mealMap.set(dateKey, {
        count: existing.count + m._count,
        calories: existing.calories + (m._sum.calories || 0),
      });
    }

    // Fill every day in the period
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const w = workoutMap.get(dateKey) || { count: 0, calories: 0, duration: 0 };
      const m = mealMap.get(dateKey) || { count: 0, calories: 0 };

      dailyChart.push({
        date: dateKey,
        day: dayNames[d.getDay()],
        workouts: w.count,
        caloriesBurned: w.calories,
        duration: w.duration,
        meals: m.count,
        caloriesConsumed: m.calories,
      });
    }

    // Body metrics trend — from daily logs or user weight history
    const bodyMetrics = await prisma.dailyLog.findMany({
      where: {
        userId: session.userId,
        date: { gte: periodStart },
      },
      select: {
        date: true,
        caloriesIn: true,
        caloriesOut: true,
        waterIntake: true,
        sleepHours: true,
        steps: true,
      },
      orderBy: { date: 'asc' },
    });

    // Also get weight from user profile (single point)
    const weightTrend = user.weight ? [{ date: now.toISOString(), weight: user.weight }] : [];

    // Macro averages for the period
    const totalMealsInPeriod = mealStats._count || 0;
    const avgProtein = totalMealsInPeriod > 0 ? (mealStats._sum.protein || 0) / totalMealsInPeriod : 0;
    const avgCarbs = totalMealsInPeriod > 0 ? (mealStats._sum.carbs || 0) / totalMealsInPeriod : 0;
    const avgFats = totalMealsInPeriod > 0 ? (mealStats._sum.fats || 0) / totalMealsInPeriod : 0;

    return NextResponse.json({
      period,
      periodStart,
      periodEnd: now,
      workouts: {
        total: workoutStats._count || 0,
        totalMinutes: workoutStats._sum.duration || 0,
        totalCaloriesBurned: workoutStats._sum.calories || 0,
      },
      meals: {
        total: mealStats._count || 0,
        totalCaloriesConsumed: mealStats._sum.calories || 0,
        macros: {
          avgProtein: Math.round(avgProtein * 10) / 10,
          avgCarbs: Math.round(avgCarbs * 10) / 10,
          avgFats: Math.round(avgFats * 10) / 10,
          totalProtein: Math.round(mealStats._sum.protein || 0),
          totalCarbs: Math.round(mealStats._sum.carbs || 0),
          totalFats: Math.round(mealStats._sum.fats || 0),
        },
      },
      streaks: streakData,
      xp: xpInfo,
      dailyChart,
      bodyMetrics,
      weightTrend,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
