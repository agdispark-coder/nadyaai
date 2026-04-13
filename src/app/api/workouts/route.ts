import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

function recalculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /api/workouts — list user's workouts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.userId };
    if (type) where.type = type;

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: { exercises: { orderBy: { order: 'asc' } } },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workout.count({ where }),
    ]);

    return NextResponse.json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/workouts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

// POST /api/workouts — create workout
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      duration,
      difficulty,
      notes,
      calories = 0,
      isPublic = false,
      exercises = [],
    } = body;

    if (!name || !type || duration == null) {
      return NextResponse.json(
        { error: 'name, type, and duration are required' },
        { status: 400 }
      );
    }

    const xpGain = Math.round(calories * 0.1 + duration * 0.5);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create workout with exercises and update user stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.create({
        data: {
          userId: session.userId,
          name,
          type,
          duration,
          difficulty: difficulty || 'medium',
          notes,
          calories,
          isPublic,
          exercises: {
            create: exercises.map(
              (ex: {
                name: string;
                sets?: number;
                reps?: number;
                weight?: number;
                duration?: number;
                distance?: number;
                order: number;
              }) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                duration: ex.duration,
                distance: ex.distance,
                order: ex.order ?? 0,
              })
            ),
          },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });

      // Update user stats
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { xp: true, totalCaloriesBurned: true },
      });

      const newXp = (user?.xp || 0) + xpGain;
      const newCaloriesBurned = (user?.totalCaloriesBurned || 0) + calories;
      const newLevel = recalculateLevel(newXp);

      await tx.user.update({
        where: { id: session.userId },
        data: {
          totalWorkouts: { increment: 1 },
          totalCaloriesBurned: newCaloriesBurned,
          xp: newXp,
          level: newLevel,
          lastActiveAt: new Date(),
        },
      });

      // Upsert daily log
      await tx.dailyLog.upsert({
        where: {
          userId_date: {
            userId: session.userId,
            date: today,
          },
        },
        create: {
          userId: session.userId,
          date: today,
          caloriesOut: calories,
        },
        update: {
          caloriesOut: { increment: calories },
        },
      });

      return workout;
    });

    return NextResponse.json(
      { workout: result, xpGained: xpGain },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/workouts error:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}
