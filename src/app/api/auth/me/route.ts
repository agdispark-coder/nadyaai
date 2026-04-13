import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        country: true,
        city: true,
        gender: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        fitnessGoal: true,
        activityLevel: true,
        role: true,
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
        totalWorkouts: true,
        totalMeals: true,
        totalCaloriesBurned: true,
        subscriptionTier: true,
        referralCode: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get user';
    console.error('Me error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
