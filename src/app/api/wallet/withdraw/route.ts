import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/wallet/withdraw — Request withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'A positive withdrawal amount is required' },
        { status: 400 }
      );
    }

    // Minimum withdrawal threshold
    if (amount < 50) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 50 MAD' },
        { status: 400 }
      );
    }

    const validMethods = ['bank_transfer', 'paypal', 'wallet_transfer'];
    const withdrawalMethod = validMethods.includes(method) ? method : 'bank_transfer';

    const result = await prisma.$transaction(async (tx) => {
      // Find wallet and lock for update
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Check for existing pending withdrawals
      const existingPending = await tx.transaction.aggregate({
        where: {
          userId: session.userId,
          type: 'withdrawal',
          status: 'pending',
        },
        _sum: { amount: true },
      });

      const availableBalance = wallet.balance - (existingPending._sum.amount || 0);
      if (availableBalance < amount) {
        throw new Error('Insufficient available balance after pending withdrawals');
      }

      // Create debit transaction (pending status for admin review)
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: session.userId,
          type: 'withdrawal',
          amount: -amount, // Negative to indicate debit
          description: `Withdrawal request via ${withdrawalMethod.replace(/_/g, ' ')}`,
          status: 'pending',
        },
      });

      // Deduct from wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
        method: withdrawalMethod,
      };
    });

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        wallet: result.wallet,
        transaction: result.transaction,
        method: result.method,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/wallet/withdraw error:', error);

    if (error instanceof Error) {
      if (error.message === 'Wallet not found') {
        return NextResponse.json({ error: 'Wallet not found. Please contact support.' }, { status: 404 });
      }
      if (error.message === 'Insufficient balance' || error.message === 'Insufficient available balance after pending withdrawals') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
