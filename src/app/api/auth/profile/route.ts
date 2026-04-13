import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Destructure allowed fields
    const {
      name,
      bio,
      avatar,
      phone,
      country,
      city,
      gender,
      dateOfBirth,
      height,
      weight,
      fitnessGoal,
      activityLevel,
    } = body;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = typeof name === 'string' ? name.trim() || null : null;
    if (bio !== undefined) updateData.bio = typeof bio === 'string' ? bio : '';
    if (avatar !== undefined) updateData.avatar = typeof avatar === 'string' ? avatar : 'default';
    if (phone !== undefined) updateData.phone = typeof phone === 'string' ? phone.trim() || null : null;
    if (country !== undefined) updateData.country = typeof country === 'string' ? country.trim() || null : null;
    if (city !== undefined) updateData.city = typeof city === 'string' ? city.trim() || null : null;
    if (gender !== undefined) updateData.gender = typeof gender === 'string' ? gender : 'other';
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (height !== undefined) updateData.height = typeof height === 'number' ? height : null;
    if (weight !== undefined) updateData.weight = typeof weight === 'number' ? weight : null;
    if (fitnessGoal !== undefined) updateData.fitnessGoal = typeof fitnessGoal === 'string' ? fitnessGoal : 'lose_weight';
    if (activityLevel !== undefined) updateData.activityLevel = typeof activityLevel === 'string' ? activityLevel : 'moderate';

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile';
    console.error('Profile update error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
