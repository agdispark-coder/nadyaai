import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Join squad via inviteCode or squadId
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode, squadId } = body;

    if (!inviteCode && !squadId) {
      return NextResponse.json(
        { error: 'Either inviteCode or squadId is required' },
        { status: 400 }
      );
    }

    // Find squad
    let squad;
    if (inviteCode) {
      squad = await prisma.squad.findUnique({
        where: { inviteCode },
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      });
    } else {
      squad = await prisma.squad.findUnique({
        where: { id: squadId },
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      });
    }

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    // Check if private squad (only joinable via invite code)
    if (!squad.isPublic && !inviteCode) {
      return NextResponse.json(
        { error: 'This squad is private. You need an invite code to join.' },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.squadMember.findUnique({
      where: {
        squadId_userId: {
          squadId: squad.id,
          userId: session.userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this squad' }, { status: 409 });
    }

    // Check max members
    if (squad._count.members >= squad.maxMembers) {
      return NextResponse.json(
        { error: `This squad has reached its maximum capacity of ${squad.maxMembers} members` },
        { status: 403 }
      );
    }

    // Add as member
    await prisma.squadMember.create({
      data: {
        squadId: squad.id,
        userId: session.userId,
        role: 'member',
      },
    });

    // Notify the squad creator
    const joiner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, name: true },
    });

    await prisma.notification.create({
      data: {
        userId: squad.creator.id,
        type: 'squad',
        title: 'New Squad Member',
        message: `${joiner?.username || joiner?.name || 'Someone'} joined your squad "${squad.name}"`,
        data: JSON.stringify({
          squadId: squad.id,
          squadName: squad.name,
          memberId: session.userId,
        }),
      },
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the squad',
        squad: {
          id: squad.id,
          name: squad.name,
          description: squad.description,
          memberCount: squad._count.members + 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/squads/join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
