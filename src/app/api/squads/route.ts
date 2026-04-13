import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List squads user is member of
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.squadMember.findMany({
      where: { userId: session.userId },
      include: {
        squad: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const squads = memberships.map((m) => ({
      id: m.squad.id,
      name: m.squad.name,
      description: m.squad.description,
      avatar: m.squad.avatar,
      isPublic: m.squad.isPublic,
      inviteCode: m.squad.inviteCode,
      maxMembers: m.squad.maxMembers,
      memberCount: m.squad._count.members,
      postsCount: m.squad._count.posts,
      role: m.role,
      creator: m.squad.creator,
      createdAt: m.squad.createdAt,
    }));

    return NextResponse.json({ squads });
  } catch (error) {
    console.error('GET /api/squads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create squad
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Squad name is required' }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Squad name must be 50 characters or less' }, { status: 400 });
    }

    // Check user's squad limit based on subscription tier
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        subscriptionTier: true,
        _count: {
          select: {
            createdSquads: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get squad limit for the user's tier
    const tierConfig = await prisma.subscriptionTier.findUnique({
      where: { tier: user.subscriptionTier },
      select: { squadLimit: true },
    });

    const squadLimit = tierConfig?.squadLimit ?? 1;

    if (user._count.createdSquads >= squadLimit) {
      return NextResponse.json(
        {
          error: `You have reached the squad limit for your ${user.subscriptionTier} tier (${squadLimit})`,
        },
        { status: 403 }
      );
    }

    // Generate a short invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Ensure invite code is unique
    let inviteCode = generateInviteCode();
    let codeExists = await prisma.squad.findUnique({ where: { inviteCode } });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.squad.findUnique({ where: { inviteCode } });
    }

    const squad = await prisma.squad.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic !== false,
        createdBy: session.userId,
        inviteCode,
        members: {
          create: {
            userId: session.userId,
            role: 'owner',
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ squad }, { status: 201 });
  } catch (error) {
    console.error('POST /api/squads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
