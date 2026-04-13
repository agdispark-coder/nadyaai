'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Plus,
  Minus,
  X,
  Check,
  Loader2,
  Trophy,
  Zap,
  CreditCard,
  Banknote,
  Building2,
  Star,
  Gift,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  coins: number;
  description: string;
  status: string;
  createdAt: string;
}

interface WalletData {
  wallet: {
    id: string;
    balance: number;
    coins: number;
  };
  totalEarned: number;
  totalSpent: number;
  pendingWithdrawals: number;
  recentTransactions: Transaction[];
}

const TRANSACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  credit: Star,
  referral: Gift,
  achievement: Trophy,
  challenge_reward: Zap,
  subscription: CreditCard,
  withdrawal: Banknote,
  debit: ArrowDownLeft,
};

const TRANSACTION_COLORS: Record<string, string> = {
  credit: 'bg-green-500/10 text-green-400',
  referral: 'bg-purple-500/10 text-purple-400',
  achievement: 'bg-yellow-500/10 text-yellow-400',
  challenge_reward: 'bg-orange-500/10 text-orange-400',
  subscription: 'bg-red-500/10 text-red-400',
  withdrawal: 'bg-blue-500/10 text-blue-400',
  debit: 'bg-gray-500/10 text-gray-400',
};

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet?limit=20');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      setError('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) {
      setError('Minimum withdrawal is 50 MAD');
      return;
    }
    if (data && amount > data.wallet.balance) {
      setError('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    setError('');
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: withdrawMethod }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Withdrawal failed');
        return;
      }
      setWithdrawOpen(false);
      setWithdrawAmount('');
      fetchWallet();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4 animate-fade-in">
        <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-44 rounded-2xl bg-gray-800/50 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-16 rounded-2xl bg-gray-800/50 animate-pulse" />
          ))}
        </div>
        <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse mt-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-800/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const wallet = data?.wallet || { balance: 0, coins: 0 };
  const transactions = data?.recentTransactions || [];

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">My Wallet</h1>
          <p className="text-xs text-gray-500">Manage your earnings</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 gradient-bg opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70 font-medium">Available Balance</span>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-1">
            {formatCurrency(wallet.balance)}
          </p>
          {data && data.pendingWithdrawals > 0 && (
            <p className="text-xs text-white/50 mb-4">
              {formatCurrency(data.pendingWithdrawals)} pending withdrawal
            </p>
          )}

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-white/50">Coins</p>
                <p className="text-sm font-bold text-white">{wallet.coins.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-green-400/20 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-300" />
              </div>
              <div>
                <p className="text-xs text-white/50">Total Earned</p>
                <p className="text-sm font-bold text-white">{formatCurrency(data?.totalEarned || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setWithdrawOpen(true)}
          className="flex-1 py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Top Up
        </button>
        <button
          onClick={() => setWithdrawOpen(true)}
          className="flex-1 py-3.5 glass-card rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all border border-gray-700/50"
        >
          <Minus className="w-4 h-4" />
          Withdraw
        </button>
        <button
          onClick={() => {}}
          className="flex-1 py-3.5 glass-card rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all border border-gray-700/50"
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-purple-400" />
          Recent Transactions
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No transactions yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Start earning by completing challenges and referring friends
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx, index) => {
              const isCredit = tx.amount > 0;
              const Icon = TRANSACTION_ICONS[tx.type] || Star;
              const colorClass = TRANSACTION_COLORS[tx.type] || 'bg-gray-500/10 text-gray-400';

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(tx.createdAt)}
                      </p>
                      {tx.status === 'pending' && (
                        <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </p>
                    {tx.coins > 0 && (
                      <p className="text-[10px] text-yellow-400">+{tx.coins} coins</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setWithdrawOpen(false)}
          />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 glass-strong rounded-2xl p-6 animate-slide-up border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Balance info */}
              <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">Available</span>
                <span className="text-sm font-bold text-white">{formatCurrency(wallet.balance)}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Amount (MAD)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }}
                  placeholder="Min. 50 MAD"
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Method */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Withdrawal Method</label>
                <div className="space-y-2">
                  {[
                    { id: 'bank_transfer', icon: Building2, label: 'Bank Transfer', desc: '2-3 business days' },
                    { id: 'paypal', icon: CreditCard, label: 'PayPal', desc: 'Instant' },
                    { id: 'wallet_transfer', icon: Wallet, label: 'Wallet Transfer', desc: 'Instant' },
                  ].map((method) => {
                    const MethodIcon = method.icon;
                    const isActive = withdrawMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setWithdrawMethod(method.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50'
                        }`}
                      >
                        <MethodIcon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {method.label}
                          </p>
                          <p className="text-xs text-gray-500">{method.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
                        }`}>
                          {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2">{error}</p>
              )}

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount}
                className="w-full py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    Confirm Withdrawal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
