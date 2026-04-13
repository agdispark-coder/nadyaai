'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  Flame,
  Loader2,
  Plus,
  X,
  Trophy,
  Users,
  Clock,
  Zap,
  Coins,
  Dumbbell,
  UtensilsCrossed,
  CalendarCheck,
  Sparkles,
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

type FilterTab = 'active' | 'all' | 'mine';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'My Challenges' },
];

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  workout: { icon: Dumbbell, color: 'bg-purple-500/10 text-purple-400', label: 'Workout' },
  nutrition: { icon: UtensilsCrossed, color: 'bg-green-500/10 text-green-400', label: 'Nutrition' },
  consistency: { icon: CalendarCheck, color: 'bg-orange-500/10 text-orange-400', label: 'Consistency' },
  special: { icon: Sparkles, color: 'bg-yellow-500/10 text-yellow-400', label: 'Special' },
};

const getTimeRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Ended';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('active');
  const [joining, setJoining] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'daily',
    category: 'workout',
    goalTarget: '7',
    goalUnit: 'times',
    rewardXP: '50',
    rewardCoins: '10',
    duration: '7',
  });
  const [creating, setCreating] = useState(false);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges?type=daily&limit=50');
      if (res.ok) {
        const json = await res.json();
        setChallenges(json.challenges || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = challenges.filter((c) => {
    if (activeFilter === 'mine') return c.userParticipation !== null;
    return true;
  });

  const handleJoin = async (challengeId: string) => {
    setJoining(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, { method: 'POST' });
      if (res.ok) {
        fetchChallenges();
      }
    } catch {
      // silent
    } finally {
      setJoining(null);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(createForm.duration || '7', 10));

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          type: createForm.type,
          category: createForm.category,
          goalTarget: parseInt(createForm.goalTarget || '7', 10),
          goalUnit: createForm.goalUnit,
          rewardXP: parseInt(createForm.rewardXP || '50', 10),
          rewardCoins: parseInt(createForm.rewardCoins || '10', 10),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          type: 'daily',
          category: 'workout',
          goalTarget: '7',
          goalUnit: 'times',
          rewardXP: '50',
          rewardCoins: '10',
          duration: '7',
        });
        fetchChallenges();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Challenges</h1>
            <p className="text-xs text-gray-500">Compete & earn rewards</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 glass-card rounded-xl">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === tab.value
                ? 'gradient-bg text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenge Cards */}
      {filteredChallenges.length > 0 ? (
        <div className="space-y-3">
          {filteredChallenges.map((challenge, index) => {
            const catConfig = CATEGORY_CONFIG[challenge.category] || CATEGORY_CONFIG.special;
            const CatIcon = catConfig.icon;
            const progress = challenge.userParticipation?.progress || 0;
            const progressPct = challenge.goalTarget > 0 ? Math.min((progress / challenge.goalTarget) * 100, 100) : 0;
            const isJoined = challenge.userParticipation !== null;
            const isCompleted = challenge.userParticipation?.completed;

            return (
              <div
                key={challenge.id}
                className="glass-card rounded-2xl p-4 animate-slide-up cursor-pointer hover:border-purple-500/20 transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => router.push(`/challenges/${challenge.id}`)}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catConfig.color}`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {challenge.title}
                      </h3>
                      {challenge.creator && (
                        <p className="text-[10px] text-gray-500">
                          by @{challenge.creator.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isCompleted
                      ? 'bg-green-500/10 text-green-400'
                      : isJoined
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isCompleted ? 'Completed' : isJoined ? 'Joined' : 'Open'}
                  </span>
                </div>

                {/* Description */}
                {challenge.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {challenge.description}
                  </p>
                )}

                {/* Progress Bar (if joined) */}
                {isJoined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">
                        {progress} / {challenge.goalTarget} {challenge.goalUnit}
                      </span>
                      <span className="text-[10px] text-purple-400 font-medium">
                        {Math.round(progressPct)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-bg rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">{challenge.participantCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400">{challenge.rewardXP}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400">{challenge.rewardCoins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">{getTimeRemaining(challenge.endDate)}</span>
                    </div>
                  </div>

                  {!isJoined && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoin(challenge.id);
                      }}
                      disabled={joining === challenge.id}
                      className="text-[10px] font-semibold px-3 py-1.5 rounded-lg gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {joining === challenge.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Join'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Flame className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No challenges found</p>
          <p className="text-xs text-gray-600 mt-1">
            {activeFilter === 'mine'
              ? 'Join a challenge to get started!'
              : 'Create one to get started!'}
          </p>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Create Challenge</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="30 Day Push-up Challenge"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe your challenge..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setCreateForm({ ...createForm, category: key })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        createForm.category === key
                          ? config.color + ' border border-current/20'
                          : 'bg-gray-900/80 border border-gray-800 text-gray-500'
                      }`}
                    >
                      <config.icon className="w-3.5 h-3.5" />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Goal Target</label>
                  <input
                    value={createForm.goalTarget}
                    onChange={(e) => setCreateForm({ ...createForm, goalTarget: e.target.value })}
                    type="number"
                    placeholder="7"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Goal Unit</label>
                  <select
                    value={createForm.goalUnit}
                    onChange={(e) => setCreateForm({ ...createForm, goalUnit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    <option value="times">Times</option>
                    <option value="calories">Calories</option>
                    <option value="minutes">Minutes</option>
                    <option value="km">Km</option>
                    <option value="workouts">Workouts</option>
                  </select>
                </div>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reward XP</label>
                  <input
                    value={createForm.rewardXP}
                    onChange={(e) => setCreateForm({ ...createForm, rewardXP: e.target.value })}
                    type="number"
                    placeholder="50"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reward Coins</label>
                  <input
                    value={createForm.rewardCoins}
                    onChange={(e) => setCreateForm({ ...createForm, rewardCoins: e.target.value })}
                    type="number"
                    placeholder="10"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Duration (days)</label>
                <input
                  value={createForm.duration}
                  onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                  type="number"
                  placeholder="7"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={!createForm.title.trim() || creating}
              className="w-full mt-6 py-3 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4" />
              )}
              Create Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
