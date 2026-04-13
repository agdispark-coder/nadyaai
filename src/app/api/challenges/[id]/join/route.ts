import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Join challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: challengeId } = await params;

    // Validate challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge is still active
    const now = new Date();
    if (now < challenge.startDate) {
      return NextResponse.json({ error: 'This challenge has not started yet' }, { status: 400 });
    }
    if (now > challenge.endDate) {
      return NextResponse.json({ error: 'This challenge has already ended' }, { status: 400 });
    }

    // Check if already joined
    const existingParticipant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: 'You have already joined this challenge' }, { status: 409 });
    }

    // Join challenge
    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId,
        userId: session.userId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'challenge',
        title: 'Challenge Joined',
        message: `You joined the challenge "${challenge.title}"!`,
        data: JSON.stringify({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          participantId: participant.id,
        }),
      },
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the challenge',
        participant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/challenges/[id]/join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
