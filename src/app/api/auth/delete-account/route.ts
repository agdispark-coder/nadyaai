import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal whether the account exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, it will be deleted.',
      });
    }

    // Delete the user (cascading will handle all related data)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete account';
    console.error('Delete account error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}
