import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { REFERRAL_COMMISSIONS } from '@/lib/utils';

// GET /api/referral — Get referral code, stats, earnings per tier
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        referralCode: true,
        referredBy: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Total users referred (direct = tier 1)
    const totalDirectReferrals = await prisma.user.count({
      where: { referredBy: session.userId },
    });

    // Earnings aggregated by tier
    const earningsByTier = await prisma.referralEarning.groupBy({
      by: ['tier'],
      where: { userId: session.userId },
      _sum: { amount: true },
      _count: true,
      orderBy: { tier: 'asc' },
    });

    // Total earnings
    const totalEarningsAgg = await prisma.referralEarning.aggregate({
      where: { userId: session.userId },
      _sum: { amount: true },
    });

    // Build tier breakdown
    const tierBreakdown = earningsByTier.map((entry) => ({
      tier: entry.tier,
      commission: REFERRAL_COMMISSIONS[entry.tier - 1] || 0,
      totalEarnings: entry._sum.amount || 0,
      referralCount: entry._count,
    }));

    // Fill in missing tiers (0 earnings)
    for (let i = 1; i <= 7; i++) {
      if (!tierBreakdown.find((t) => t.tier === i)) {
        tierBreakdown.push({
          tier: i,
          commission: REFERRAL_COMMISSIONS[i - 1] || 0,
          totalEarnings: 0,
          referralCount: 0,
        });
      }
    }
    tierBreakdown.sort((a, b) => a.tier - b.tier);

    // Recent referral earnings (last 10)
    const recentEarnings = await prisma.referralEarning.findMany({
      where: { userId: session.userId },
      include: {
        referredUser: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      totalDirectReferrals,
      totalEarnings: totalEarningsAgg._sum.amount || 0,
      tierBreakdown,
      recentEarnings,
    });
  } catch (error) {
    console.error('GET /api/referral error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

// POST /api/referral — Generate referral tree / link info
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Action: get referral tree
    if (action === 'tree') {
      return await getReferralTree(session.userId);
    }

    // Default: return referral link info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { referralCode: true, username: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: `/register?ref=${user.referralCode}`,
      sharedBy: user.name || user.username,
      commissions: REFERRAL_COMMISSIONS,
      maxDepth: 7,
    });
  } catch (error) {
    console.error('POST /api/referral error:', error);
    return NextResponse.json({ error: 'Failed to process referral request' }, { status: 500 });
  }
}

async function getReferralTree(userId: string) {
  // Get all direct referrals (tier 1)
  const directReferrals = await prisma.user.findMany({
    where: { referredBy: userId },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      createdAt: true,
      subscriptionTier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get earnings from all tiers for this user
  const allEarnings = await prisma.referralEarning.findMany({
    where: { userId },
    include: {
      referredUser: {
        select: { id: true, username: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Count referrals at each depth level
  const depthCounts: number[] = [];
  for (let i = 1; i <= 7; i++) {
    const count = await prisma.referralEarning.count({
      where: { userId, tier: i },
    });
    depthCounts.push(count);
  }

  return NextResponse.json({
    directReferrals,
    totalReferralsAtDepth: depthCounts,
    recentEarnings: allEarnings,
  });
}
