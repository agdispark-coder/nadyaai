'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Trophy, Flame, Loader2, ChevronUp, Crown, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalWorkouts: number;
  subscriptionTier: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  period: string;
  total: number;
}

type Period = 'weekly' | 'monthly' | 'all';

const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All Time' },
];

const getInitials = (name?: string | null, username?: string) => {
  if (name) {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].substring(0, 2);
  }
  return username?.substring(0, 2).toUpperCase() || '??';
};

const formatXP = (xp: number) => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
};

export default function LeaderboardPage() {
  const { user } = useAppStore();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<Period>('weekly');

  const fetchLeaderboard = useCallback(async (period: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}&limit=50`);
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
    fetchLeaderboard(activePeriod);
  }, [activePeriod, fetchLeaderboard]);

  const top3 = data?.leaderboard.slice(0, 3) || [];
  const rest = data?.leaderboard.slice(3) || [];

  const getPodiumOrder = (): LeaderboardEntry[] => {
    if (top3.length === 0) return [];
    if (top3.length === 1) return [top3[0]];
    if (top3.length === 2) return [top3[1], top3[0], top3[2]]; // 2nd, 1st
    return [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  };

  const getPodiumColors = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          ring: 'ring-yellow-400',
          bg: 'bg-gradient-to-br from-yellow-400 to-amber-600',
          text: 'text-yellow-400',
          border: 'border-yellow-400/30',
        };
      case 2:
        return {
          ring: 'ring-gray-300',
          bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
          text: 'text-gray-300',
          border: 'border-gray-400/30',
        };
      case 3:
        return {
          ring: 'ring-amber-600',
          bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
          text: 'text-amber-600',
          border: 'border-amber-700/30',
        };
      default:
        return {
          ring: '',
          bg: 'gradient-bg',
          text: 'text-gray-400',
          border: 'border-gray-700/50',
        };
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-xs text-gray-500">Top athletes ranked by XP</p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 p-1 glass-card rounded-xl">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActivePeriod(tab.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === tab.value
                ? 'gradient-bg text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current User Rank Banner */}
      {data?.currentUserRank && data.currentUserRank > 3 && (
        <div className="glass-card rounded-2xl p-3 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-xs font-bold text-white">
                #{data.currentUserRank}
              </div>
              <div>
                <p className="text-xs text-gray-400">Your Rank</p>
                <p className="text-sm font-semibold text-white">
                  {user?.name || user?.username}
                </p>
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-green-400" />
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {getPodiumOrder().map((entry, index) => {
            const colors = getPodiumColors(entry.rank);
            const isFirst = entry.rank === 1;
            const podiumHeight = isFirst ? 'h-40' : 'h-28';

            return (
              <div key={entry.id} className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Avatar + Crown */}
                <div className="relative">
                  {isFirst && (
                    <Crown className="w-5 h-5 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-float" />
                  )}
                  <div
                    className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center text-sm font-bold text-white ring-2 ${colors.ring} shadow-lg`}
                  >
                    {entry.avatar && entry.avatar !== 'default' ? (
                      <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(entry.name, entry.username)
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center">
                  <p className={`text-xs font-semibold ${isFirst ? 'text-yellow-400' : 'text-white'} truncate max-w-[80px]`}>
                    {entry.name || entry.username}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Lvl {entry.level}
                  </p>
                </div>

                {/* Podium Base */}
                <div className={`w-20 ${podiumHeight} rounded-t-xl flex flex-col items-center justify-end pb-3 transition-all ${colors.border} border`}
                  style={{ background: isFirst ? 'linear-gradient(to top, rgba(234,179,8,0.15), rgba(234,179,8,0.05))' : 'rgba(255,255,255,0.03)' }}>
                  {entry.rank <= 3 && (
                    <Medal className={`w-4 h-4 mb-1 ${colors.text}`} />
                  )}
                  <span className={`text-lg font-bold ${isFirst ? 'text-yellow-400' : 'text-gray-400'}`}>
                    #{entry.rank}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatXP(entry.xp)} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranked List */}
      {rest.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-gray-400">
              Rankings #{rest[0].rank} – #{rest[rest.length - 1].rank}
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {rest.map((entry) => {
              const isCurrentUser = entry.id === user?.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isCurrentUser ? 'bg-purple-500/10 border-l-2 border-purple-500' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Rank */}
                  <span className={`text-sm font-bold w-7 text-center ${isCurrentUser ? 'text-purple-400' : 'text-gray-500'}`}>
                    {entry.rank}
                  </span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-300 shrink-0 overflow-hidden">
                    {entry.avatar && entry.avatar !== 'default' ? (
                      <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(entry.name, entry.username)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {entry.name || entry.username}
                      {isCurrentUser && (
                        <span className="text-[10px] text-purple-400 ml-1.5">(You)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-medium">
                        Lvl {entry.level}
                      </span>
                    </div>
                  </div>

                  {/* XP + Streak */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">{entry.streak}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatXP(entry.xp)} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && data?.leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No rankings yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Start working out to climb the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}
