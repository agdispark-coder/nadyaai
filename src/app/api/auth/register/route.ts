import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, name, referralCode } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate field formats
    if (typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Resolve referral
    let referredById: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (!referrer) {
        return NextResponse.json(
          { success: false, error: 'Invalid referral code' },
          { status: 400 }
        );
      }
      referredById = referrer.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        referredBy: referredById || null,
      },
    });

    // Create wallet with welcome bonus
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        coins: 50,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'Welcome to Nadya AI! 🎉',
        message:
          'Welcome aboard! You\'ve received 50 welcome coins. Start your fitness journey today!',
      },
    });

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            onboardingCompleted: user.onboardingCompleted,
            subscriptionTier: user.subscriptionTier,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          token,
        },
      },
      { status: 201 }
    );

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
      error instanceof Error ? error.message : 'Registration failed';
    console.error('Register error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
