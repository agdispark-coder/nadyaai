'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Droplets,
  Zap,
  TrendingUp,
  Trophy,
  ChevronRight,
  Loader2,
  Sparkles,
  CalendarDays,
  Play,
  Plus,
  Clock,
} from 'lucide-react';

interface AnalyticsData {
  workouts: {
    total: number;
    totalMinutes: number;
    totalCaloriesBurned: number;
  };
  meals: {
    total: number;
    totalCaloriesConsumed: number;
    macros: {
      avgProtein: number;
      avgCarbs: number;
      avgFats: number;
    };
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastActive: string | null;
  };
  xp: {
    level: number;
    current: number;
    needed: number;
    percentage: number;
  };
  dailyChart: Array<{
    date: string;
    day: string;
    workouts: number;
    caloriesBurned: number;
    meals: number;
    caloriesConsumed: number;
  }>;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDateString = () => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
};

export default function DashboardPage() {
  const { user } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<
    Array<{ type: 'workout' | 'meal'; name: string; date: string; calories?: number }>
  >([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics?period=7');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Build activity feed from dailyChart (most recent first)
  useEffect(() => {
    if (!analytics?.dailyChart) return;
    const feed: typeof activityFeed = [];
    for (const day of [...analytics.dailyChart].reverse()) {
      if (day.workouts > 0) {
        feed.push({
          type: 'workout',
          name: `${day.workouts} workout${day.workouts > 1 ? 's' : ''} completed`,
          date: day.date,
          calories: day.caloriesBurned,
        });
      }
      if (day.meals > 0) {
        feed.push({
          type: 'meal',
          name: `${day.meals} meal${day.meals > 1 ? 's' : ''} logged`,
          date: day.date,
          calories: day.caloriesConsumed,
        });
      }
    }
    setActivityFeed(feed.slice(0, 5));
  }, [analytics]);

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const displayName = user?.name || user?.username || 'Athlete';
  const xp = analytics?.xp || { level: 1, current: 0, needed: 100, percentage: 0 };
  const streak = analytics?.streaks?.currentStreak || user?.streak || 0;

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()},{' '}
          <span className="gradient-text">{displayName.split(' ')[0]}</span>! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {getDateString()}
        </p>
      </div>

      {/* XP Progress */}
      <div className="glass-card rounded-2xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Level {xp.level}
              </p>
              <p className="text-xs text-gray-500">
                {xp.current} / {xp.needed} XP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-orange-400">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-bold">{streak}</span>
            <span className="text-xs text-gray-500">day streak</span>
          </div>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full gradient-bg rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(xp.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Workouts"
          value={analytics?.workouts?.total ?? 0}
          unit="this week"
          color="from-purple-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          icon={Flame}
          label="Calories"
          value={analytics?.workouts?.totalCaloriesBurned ?? 0}
          unit="burned"
          color="from-orange-500 to-red-500"
          delay={1}
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Meals"
          value={analytics?.meals?.total ?? 0}
          unit="logged"
          color="from-green-500 to-emerald-500"
          delay={2}
        />
        <StatCard
          icon={Droplets}
          label="Water"
          value={0}
          unit="glasses"
          color="from-cyan-500 to-blue-500"
          delay={3}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
          <Play className="w-4 h-4" />
          Start Workout
        </button>
        <button className="flex-1 py-3.5 glass-card rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all border border-gray-700/50">
          <Plus className="w-4 h-4" />
          Log Meal
        </button>
      </div>

      {/* Weekly Overview */}
      {(analytics?.workouts?.total ?? 0) > 0 && (
        <div className="glass-card rounded-2xl p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Weekly Overview
            </h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="flex items-end justify-between gap-1 h-24">
            {analytics?.dailyChart?.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '64px' }}>
                  <div
                    className="w-full max-w-[20px] rounded-t-sm gradient-bg transition-all duration-500"
                    style={{
                      height: `${Math.max(day.workouts > 0 ? 8 : 2, (day.workouts / 4) * 64)}px`,
                      opacity: i === analytics.dailyChart.length - 1 ? 1 : 0.5,
                    }}
                  />
                  {day.meals > 0 && (
                    <div
                      className="w-full max-w-[20px] rounded-t-sm bg-green-500/50 transition-all duration-500"
                      style={{
                        height: `${Math.max(day.meals > 0 ? 4 : 0, (day.meals / 6) * 32)}px`,
                        opacity: i === analytics.dailyChart.length - 1 ? 1 : 0.3,
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-gray-600">{day.day.charAt(0)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm gradient-bg" />
              <span className="text-[10px] text-gray-500">Workouts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-green-500/50" />
              <span className="text-[10px] text-gray-500">Meals</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Challenges */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Active Challenges
          </h3>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="text-center py-6">
          <Sparkles className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No active challenges</p>
          <p className="text-xs text-gray-600 mt-1">
            Join a challenge to earn bonus XP!
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      {activityFeed.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Recent Activity
            </h3>
          </div>
          <div className="space-y-3">
            {activityFeed.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'workout'
                      ? 'bg-purple-500/10'
                      : 'bg-green-500/10'
                  }`}
                >
                  {item.type === 'workout' ? (
                    <Dumbbell className="w-4 h-4 text-purple-400" />
                  ) : (
                    <UtensilsCrossed className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {item.calories ? ` · ${item.calories} cal` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="glass-card rounded-2xl p-4 animate-slide-up"
      style={{ animationDelay: `${delay * 75}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        {label}{' '}
        <span className="text-gray-600">· {unit}</span>
      </p>
    </div>
  );
}
