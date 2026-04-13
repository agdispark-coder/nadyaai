import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SUBSCRIPTION_TIERS, type TierName } from '@/lib/utils';

const TIER_DURATIONS: Record<string, number> = {
  free: 0,
  bronze: 30,
  silver: 30,
  gold: 30,
  platinum: 30,
};

// GET /api/subscriptions — Current subscription status + all available tiers
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        subscriptionTier: true,
        subscriptionEndAt: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current subscription has expired
    let currentTier = user.subscriptionTier;
    const now = new Date();
    if (user.subscriptionEndAt && user.subscriptionEndAt < now && currentTier !== 'free') {
      // Subscription expired — revert to free
      await prisma.user.update({
        where: { id: session.userId },
        data: { subscriptionTier: 'free' },
      });
      await prisma.subscription.updateMany({
        where: { userId: session.userId, status: 'active' },
        data: { status: 'expired' },
      });
      currentTier = 'free';
    }

    // Build available tiers info
    const availableTiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      name: tier.name,
      price: tier.price,
      duration: TIER_DURATIONS[key] || 30,
      features: tier.features,
      isCurrent: key === currentTier,
    }));

    return NextResponse.json({
      current: {
        tier: currentTier,
        endDate: user.subscriptionEndAt,
        activeSubscription: user.subscriptions[0] || null,
      },
      availableTiers,
    });
  } catch (error) {
    console.error('GET /api/subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST /api/subscriptions — Subscribe/upgrade to a tier
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!tier || typeof tier !== 'string') {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    const tierKey = tier.toLowerCase() as TierName;
    if (!SUBSCRIPTION_TIERS[tierKey]) {
      return NextResponse.json(
        { error: `Invalid tier. Available: ${Object.keys(SUBSCRIPTION_TIERS).join(', ')}` },
        { status: 400 }
      );
    }

    const tierInfo = SUBSCRIPTION_TIERS[tierKey];
    const duration = TIER_DURATIONS[tierKey] || 30;

    // Can't "subscribe" to free
    if (tierKey === 'free') {
      return NextResponse.json(
        { error: 'Use cancel endpoint to downgrade to free' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { subscriptionTier: true, subscriptionEndAt: true, wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already on this tier and still active
    if (user.subscriptionTier === tierKey && user.subscriptionEndAt && user.subscriptionEndAt > new Date()) {
      return NextResponse.json(
        { error: 'You are already subscribed to this tier' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const startDate = now;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + duration);

      // If upgrading from another paid tier with remaining time, extend end date
      if (
        user.subscriptionTier !== 'free' &&
        user.subscriptionTier !== tierKey &&
        user.subscriptionEndAt &&
        user.subscriptionEndAt > now
      ) {
        const remainingDays = Math.ceil(
          (user.subscriptionEndAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        endDate.setDate(endDate.getDate() + remainingDays);
      }

      // Expire old active subscriptions
      await tx.subscription.updateMany({
        where: { userId: session.userId, status: 'active' },
        data: { status: 'cancelled' },
      });

      // Create new subscription record
      const subscription = await tx.subscription.create({
        data: {
          userId: session.userId,
          tier: tierKey,
          price: tierInfo.price,
          currency: 'MAD',
          startDate,
          endDate,
          status: 'active',
        },
      });

      // Update user subscription tier
      await tx.user.update({
        where: { id: session.userId },
        data: {
          subscriptionTier: tierKey,
          subscriptionEndAt: endDate,
        },
      });

      // Create transaction for the subscription payment
      let walletId = user.wallet?.id;
      if (!walletId) {
        const wallet = await tx.wallet.create({
          data: { userId: session.userId },
        });
        walletId = wallet.id;
      }

      await tx.transaction.create({
        data: {
          walletId,
          userId: session.userId,
          type: 'subscription',
          amount: -tierInfo.price,
          description: `Subscription: ${tierInfo.name} plan (${duration} days)`,
          status: 'completed',
        },
      });

      return subscription;
    });

    return NextResponse.json(
      {
        message: `Successfully subscribed to ${tierInfo.name} plan`,
        subscription: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
