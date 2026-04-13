'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownLeft,
  Check,
  Crown,
  Star,
  Shield,
  Sparkles,
  Loader2,
  Zap,
  ChevronRight,
  Gem,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/store';

interface TierInfo {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  isCurrent: boolean;
}

interface SubscriptionData {
  current: {
    tier: string;
    endDate: string | null;
    activeSubscription: {
      id: string;
      tier: string;
      startDate: string;
      endDate: string;
    } | null;
  };
  availableTiers: TierInfo[];
}

const TIER_COLORS: Record<string, { gradient: string; border: string; badge: string; glow: string; icon: string }> = {
  free: {
    gradient: 'from-gray-600 to-gray-700',
    border: 'border-gray-600/30',
    badge: 'bg-gray-600/20 text-gray-300',
    glow: '',
    icon: 'text-gray-400',
  },
  bronze: {
    gradient: 'from-amber-700 to-amber-800',
    border: 'border-amber-600/30',
    badge: 'bg-amber-600/20 text-amber-300',
    glow: '',
    icon: 'text-amber-500',
  },
  silver: {
    gradient: 'from-gray-300 to-gray-400',
    border: 'border-gray-300/30',
    badge: 'bg-gray-300/20 text-gray-200',
    glow: '',
    icon: 'text-gray-300',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-400/30',
    badge: 'bg-yellow-400/20 text-yellow-200',
    glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    icon: 'text-yellow-400',
  },
  platinum: {
    gradient: 'from-purple-400 to-indigo-600',
    border: 'border-purple-400/30',
    badge: 'bg-purple-500/20 text-purple-200',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    icon: 'text-purple-400',
  },
};

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Shield,
  bronze: Star,
  silver: Shield,
  gold: Crown,
  platinum: Gem,
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'platinum'];

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/subscriptions');
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
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free') return;
    if (subscribing) return;
    setSubscribing(tierId);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to subscribe');
        return;
      }
      // Update local user store
      if (user) {
        useAppStore.getState().setUser({
          ...user,
          subscriptionTier: tierId,
        });
      }
      fetchSubscriptions();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const currentTierIdx = TIER_ORDER.indexOf(data?.current?.tier || user?.subscriptionTier || 'free');
  const recommendedTier = 'gold';

  if (loading) {
    return (
      <div className="py-8 space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-6 w-32 bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const tiers = data?.availableTiers || [];

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
          <h1 className="text-xl font-bold text-white">Choose Your Plan</h1>
          <p className="text-xs text-gray-500">Unlock premium features</p>
        </div>
      </div>

      {/* Current Tier Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Current plan:</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          TIER_COLORS[data?.current?.tier || 'free']?.badge || 'bg-gray-600/20 text-gray-300'
        }`}>
          {(data?.current?.tier || user?.subscriptionTier || 'free').charAt(0).toUpperCase() +
            (data?.current?.tier || user?.subscriptionTier || 'free').slice(1)}
        </span>
        {data?.current?.endDate && data.current.tier !== 'free' && (
          <span className="text-xs text-gray-500">
            · Renews {new Date(data.current.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="space-y-4">
        {tiers.map((tier, index) => {
          const tierId = tier.id as keyof typeof TIER_COLORS;
          const colors = TIER_COLORS[tierId] || TIER_COLORS.free;
          const TierIcon = TIER_ICONS[tierId] || Shield;
          const tierIdx = TIER_ORDER.indexOf(tierId);
          const isCurrent = tier.isCurrent;
          const isRecommended = tierId === recommendedTier;
          const isHigher = tierIdx > currentTierIdx;

          return (
            <div
              key={tier.id}
              className={`glass-card rounded-2xl overflow-hidden animate-slide-up transition-all ${
                colors.glow
              } ${isRecommended ? 'ring-1 ring-yellow-400/30' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-1.5 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-yellow-900" />
                  <span className="text-xs font-bold text-yellow-900">RECOMMENDED</span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                      <TierIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{tier.name}</h3>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        {tier.price === 0 ? (
                          <span className="text-sm font-semibold text-gray-400">Free forever</span>
                        ) : (
                          <>
                            <span className="text-xl font-bold text-white">{formatCurrency(tier.price)}</span>
                            <span className="text-xs text-gray-500">/{tier.duration} days</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      Current Plan
                    </span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {tier.features.map((feature, fi) => (
                    <div key={fi} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent ? 'bg-purple-500/20' : 'bg-white/5'
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${isCurrent ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <span className={`text-sm ${isCurrent ? 'text-gray-300' : 'text-gray-400'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-gray-500 cursor-not-allowed border border-gray-700/30"
                  >
                    Current Plan
                  </button>
                ) : tier.price === 0 ? (
                  <button
                    onClick={() => handleSubscribe('free')}
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-gray-500 cursor-not-allowed border border-gray-700/30"
                  >
                    Free Tier
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(tierId)}
                    disabled={subscribing === tierId}
                    className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 ${
                      isHigher
                        ? `gradient-bg text-white`
                        : 'bg-white/5 text-gray-300 border border-gray-700/50 hover:bg-white/10'
                    }`}
                  >
                    {subscribing === tierId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isHigher ? <Zap className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {isHigher ? `Upgrade to ${tier.name}` : `Switch to ${tier.name}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
