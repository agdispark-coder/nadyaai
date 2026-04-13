import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // Validate input
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!email && !username) {
      return NextResponse.json(
        { success: false, error: 'Email or username is required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: email
        ? { email: email.toLowerCase() }
        : { username: username!.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Calculate streak
    const now = new Date();
    let newStreak = 1;
    let newLongestStreak = user.longestStreak;

    if (user.lastActiveAt) {
      const lastActive = new Date(user.lastActiveAt);
      const diffMs = now.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = user.streak + 1;
      } else if (diffDays === 0) {
        // Same day, keep current streak
        newStreak = user.streak;
      }
      // else: streak reset to 1 (already set above)
    }

    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    // Update lastActiveAt and streak
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: now,
        streak: newStreak,
        longestStreak: newLongestStreak,
      },
    });

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Build response with updated user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      country: user.country,
      city: user.city,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      height: user.height,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
      activityLevel: user.activityLevel,
      role: user.role,
      xp: user.xp,
      level: user.level,
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveAt: now.toISOString(),
      totalWorkouts: user.totalWorkouts,
      totalMeals: user.totalMeals,
      totalCaloriesBurned: user.totalCaloriesBurned,
      subscriptionTier: user.subscriptionTier,
      referralCode: user.referralCode,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        token,
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
