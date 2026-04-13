'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Zap,
  Coins,
  Loader2,
  Share2,
  CheckCircle2,
  Dumbbell,
  UtensilsCrossed,
  CalendarCheck,
  Sparkles,
  Flame,
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  goalTarget: number;
  goalUnit: string | null;
  rewardXP: number;
  rewardCoins: number;
  startDate: string;
  endDate: string;
  participantCount: number;
  creator: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  } | null;
  userParticipation: {
    id: string;
    progress: number;
    completed: boolean;
    joinedAt: string;
  } | null;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  workout: { icon: Dumbbell, color: 'from-purple-500 to-indigo-600', label: 'Workout' },
  nutrition: { icon: UtensilsCrossed, color: 'from-green-500 to-emerald-600', label: 'Nutrition' },
  consistency: { icon: CalendarCheck, color: 'from-orange-500 to-red-500', label: 'Consistency' },
  special: { icon: Sparkles, color: 'from-yellow-400 to-amber-600', label: 'Special' },
};

const getTimeRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Ended';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges?type=daily&limit=50');
      if (res.ok) {
        const json = await res.json();
        const found = (json.challenges || []).find(
          (c: Challenge) => c.id === params.id
        );
        if (found) {
          setChallenge(found);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleJoin = async () => {
    if (!challenge) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/join`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchChallenge();
      }
    } catch {
      // silent
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    const text = `Join me in "${challenge?.title}" on Nadya AI! 🏆`;
    if (navigator.share) {
      try {
        await navigator.share({ title: challenge?.title, text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="py-12 text-center">
        <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Challenge not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs text-purple-400 hover:text-purple-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[challenge.category] || CATEGORY_CONFIG.special;
  const CatIcon = catConfig.icon;
  const progress = challenge.userParticipation?.progress || 0;
  const progressPct = challenge.goalTarget > 0 ? Math.min((progress / challenge.goalTarget) * 100, 100) : 0;
  const isJoined = challenge.userParticipation !== null;
  const isCompleted = challenge.userParticipation?.completed;

  // Circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{challenge.title}</h1>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded bg-gradient-to-br ${catConfig.color} flex items-center justify-center`}>
              <CatIcon className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{catConfig.label}</span>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Share2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Description Card */}
      <div className="glass-card rounded-2xl p-4">
        {challenge.description && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {challenge.description}
          </p>
        )}
        {!challenge.description && (
          <p className="text-sm text-gray-500 italic">No description provided.</p>
        )}

        {challenge.creator && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-[8px] font-bold text-white">
              {(challenge.creator.name || challenge.creator.username).substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500">
              Created by <span className="text-gray-300">@{challenge.creator.username}</span>
            </span>
          </div>
        )}
      </div>

      {/* Progress Circle */}
      {isJoined && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-8 h-8 text-green-400 mb-1" />
                ) : (
                  <span className="text-2xl font-bold text-white">{Math.round(progressPct)}%</span>
                )}
                <span className="text-[10px] text-gray-500">
                  {progress} / {challenge.goalTarget} {challenge.goalUnit}
                </span>
              </div>
            </div>
          </div>
          {isCompleted && (
            <div className="text-center mt-3">
              <span className="text-xs text-green-400 font-medium">🎉 Challenge Completed!</span>
            </div>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time Remaining */}
        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Time Left</span>
          </div>
          <p className="text-lg font-bold text-white">{getTimeRemaining(challenge.endDate)}</p>
        </div>

        {/* Participants */}
        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Participants</span>
          </div>
          <p className="text-lg font-bold text-white">{challenge.participantCount}</p>
        </div>

        {/* Reward XP */}
        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">XP Reward</span>
          </div>
          <p className="text-lg font-bold text-yellow-400">{challenge.rewardXP}</p>
        </div>

        {/* Reward Coins */}
        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Coins</span>
          </div>
          <p className="text-lg font-bold text-amber-400">{challenge.rewardCoins}</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 mb-1">Start</p>
            <p className="text-xs text-gray-300 font-medium">
              {new Date(challenge.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-px bg-gradient-to-r from-purple-500/50 to-indigo-500/50" />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 mb-1">End</p>
            <p className="text-xs text-gray-300 font-medium">
              {new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Join / Leave Button */}
      <div className="space-y-2">
        {isJoined ? (
          <div className="flex items-center gap-2 py-3.5 glass-card rounded-2xl text-green-400 font-semibold text-sm justify-center">
            <Flame className="w-4 h-4" />
            {isCompleted ? 'Challenge Completed!' : 'You\'re in this challenge'}
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {joining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            Join Challenge
          </button>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 glass-card rounded-2xl text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Copied!' : 'Share Challenge'}
        </button>
      </div>
    </div>
  );
}
