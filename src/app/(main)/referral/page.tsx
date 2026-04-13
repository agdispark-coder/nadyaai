'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownLeft,
  Gift,
  Copy,
  Share2,
  Check,
  Users,
  TrendingUp,
  Zap,
  UserPlus,
  Banknote,
} from 'lucide-react';
import { REFERRAL_COMMISSIONS, formatCurrency, formatRelativeTime } from '@/lib/utils';

interface TierBreakdown {
  tier: number;
  commission: number;
  totalEarnings: number;
  referralCount: number;
}

interface RecentEarning {
  id: string;
  tier: number;
  amount: number;
  createdAt: string;
  referredUser: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
}

interface ReferralData {
  referralCode: string;
  totalDirectReferrals: number;
  totalEarnings: number;
  tierBreakdown: TierBreakdown[];
  recentEarnings: RecentEarning[];
}

const TIER_COLORS = [
  'from-purple-500 to-indigo-600',
  'from-indigo-500 to-blue-600',
  'from-blue-500 to-cyan-600',
  'from-cyan-500 to-teal-600',
  'from-teal-500 to-green-600',
  'from-green-500 to-lime-600',
  'from-lime-500 to-yellow-600',
];

const TIER_LABELS = [
  'Friends',
  'Friends of Friends',
  'Network Level 3',
  'Network Level 4',
  'Network Level 5',
  'Network Level 6',
  'Network Level 7',
];

export default function ReferralPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const res = await fetch('/api/referral');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  const copyCode = async () => {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyLink = async () => {
    if (!data?.referralCode) return;
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-28 rounded-2xl bg-gray-800/50 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-24 rounded-2xl bg-gray-800/50 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const referralCode = data?.referralCode || 'N/A';
  const totalEarnings = data?.totalEarnings || 0;
  const totalReferrals = data?.totalDirectReferrals || 0;
  const tierBreakdown = data?.tierBreakdown || [];
  const recentEarnings = data?.recentEarnings || [];

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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Referral Program
            <Gift className="w-5 h-5 text-purple-400" />
          </h1>
          <p className="text-xs text-gray-500">Earn commissions across 7 tiers</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-sm text-gray-400 mb-3">Your Referral Code</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800/80 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-lg font-bold text-white tracking-wider">{referralCode}</span>
            <button
              onClick={copyCode}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={copyLink}
          className="w-full mt-3 py-3 gradient-bg rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share Referral Link
            </>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-3 text-center">
          <Users className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{totalReferrals}</p>
          <p className="text-[10px] text-gray-500">Total Referrals</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <Banknote className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{formatCurrency(totalEarnings)}</p>
          <p className="text-[10px] text-gray-500">Total Earnings</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{REFERRAL_COMMISSIONS[0]}%</p>
          <p className="text-[10px] text-gray-500">Tier 1 Rate</p>
        </div>
      </div>

      {/* Commission Pyramid */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-purple-400" />
          7-Tier Commission Structure
        </h3>
        <div className="space-y-2">
          {REFERRAL_COMMISSIONS.map((commission, index) => {
            const breakdown = tierBreakdown[index];
            return (
              <div
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {/* Tier number */}
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TIER_COLORS[index]} flex items-center justify-center shrink-0`}>
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{TIER_LABELS[index]}</span>
                      <span className="text-xs font-semibold text-white">{commission}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${TIER_COLORS[index]} transition-all duration-500`}
                        style={{
                          width: `${Math.max(breakdown?.referralCount ? Math.min(breakdown.referralCount * 20, 100) : 0, breakdown?.totalEarnings > 0 ? 8 : 0)}%`,
                        }}
                      />
                    </div>
                    {breakdown && (breakdown.totalEarnings > 0 || breakdown.referralCount > 0) && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-600">{breakdown.referralCount} refs</span>
                        <span className="text-[10px] text-green-400/70">{formatCurrency(breakdown.totalEarnings)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Earnings */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-400" />
          Recent Earnings
        </h3>

        {recentEarnings.length === 0 ? (
          <div className="text-center py-6">
            <UserPlus className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No referral earnings yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Share your code to start earning
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentEarnings.map((earning, index) => (
              <div
                key={earning.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TIER_COLORS[(earning.tier || 1) - 1]} flex items-center justify-center shrink-0`}>
                  <span className="text-xs font-bold text-white">{earning.tier}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {earning.referredUser?.name || earning.referredUser?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Tier {earning.tier} · {REFERRAL_COMMISSIONS[earning.tier - 1]}%
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-green-400">+{formatCurrency(earning.amount)}</p>
                  <p className="text-[10px] text-gray-500">{formatRelativeTime(earning.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">How It Works</h3>
        <div className="space-y-4">
          {[
            {
              icon: Share2,
              color: 'from-purple-500 to-indigo-600',
              title: 'Share Your Code',
              desc: 'Share your unique referral code with friends and on social media',
            },
            {
              icon: UserPlus,
              color: 'from-green-500 to-emerald-600',
              title: 'Friends Sign Up',
              desc: 'When someone registers using your code, they become your direct referral',
            },
            {
              icon: Banknote,
              color: 'from-yellow-500 to-orange-600',
              title: 'Earn Commissions',
              desc: 'Earn up to 10% commission across 7 tiers of your referral network',
            },
          ].map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={index} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}>
                  <StepIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
