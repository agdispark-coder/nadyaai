import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

function recalculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /api/meals — list user's meals
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const date = searchParams.get('date') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.userId };
    if (type) where.type = type;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.loggedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        include: { items: true },
        orderBy: { loggedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meal.count({ where }),
    ]);

    return NextResponse.json({
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/meals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

// POST /api/meals — create meal
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      name,
      imageUrl,
      calories = 0,
      protein = 0,
      carbs = 0,
      fats = 0,
      fiber = 0,
      water = 0,
      notes,
      aiScanned = false,
      items = [],
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'type is required' },
        { status: 400 }
      );
    }

    const xpGain = Math.round(calories * 0.02);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      const meal = await tx.meal.create({
        data: {
          userId: session.userId,
          type,
          name,
          imageUrl,
          calories,
          protein,
          carbs,
          fats,
          fiber,
          water,
          notes,
          aiScanned,
          items: {
            create: items.map(
              (item: {
                name: string;
                amount?: number;
                unit?: string;
                calories?: number;
                protein?: number;
                carbs?: number;
                fats?: number;
              }) => ({
                name: item.name,
                amount: item.amount,
                unit: item.unit || 'g',
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fats: item.fats || 0,
              })
            ),
          },
        },
        include: { items: true },
      });

      // Update user stats
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { xp: true },
      });

      const newXp = (user?.xp || 0) + xpGain;
      const newLevel = recalculateLevel(newXp);

      await tx.user.update({
        where: { id: session.userId },
        data: {
          totalMeals: { increment: 1 },
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
          caloriesIn: calories,
          waterIntake: water / 1000, // convert ml to liters
        },
        update: {
          caloriesIn: { increment: calories },
          waterIntake: { increment: water / 1000 },
        },
      });

      return meal;
    });

    return NextResponse.json(
      { meal: result, xpGained: xpGain },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/meals error:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}
