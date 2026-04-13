import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/wallet — Get user wallet (balance, coins, recent transactions)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Find or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.userId },
      });
    }

    // Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get summary stats
    const [totalCredits, totalDebits, pendingWithdrawals] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: session.userId, type: { in: ['credit', 'referral', 'achievement', 'challenge_reward'] }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.userId, type: { in: ['debit', 'subscription', 'withdrawal'] }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.userId, type: 'withdrawal', status: 'pending' },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        coins: wallet.coins,
      },
      totalEarned: totalCredits._sum.amount || 0,
      totalSpent: totalDebits._sum.amount || 0,
      pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error('GET /api/wallet error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

// POST /api/wallet — Manual credit (admin/achievement/challenge rewards)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, coins, description, type } = body;

    if (amount == null || amount <= 0) {
      return NextResponse.json(
        { error: 'A positive amount is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const validTypes = ['credit', 'achievement', 'challenge_reward', 'referral', 'subscription'];
    const txType = validTypes.includes(type) ? type : 'credit';

    const result = await prisma.$transaction(async (tx) => {
      // Find or create wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: session.userId },
        });
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          ...(coins ? { coins: { increment: coins } } : {}),
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: session.userId,
          type: txType,
          amount,
          coins: coins || 0,
          description,
          status: 'completed',
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json(
      { wallet: result.wallet, transaction: result.transaction },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/wallet error:', error);
    return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 });
  }
}
