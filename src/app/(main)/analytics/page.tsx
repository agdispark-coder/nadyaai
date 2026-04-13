'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownLeft,
  Dumbbell,
  Flame,
  UtensilsCrossed,
  Zap,
  TrendingUp,
  Loader2,
  Calendar,
  Target,
  Activity,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

interface DailyChart {
  date: string;
  day: string;
  workouts: number;
  caloriesBurned: number;
  duration: number;
  meals: number;
  caloriesConsumed: number;
}

interface AnalyticsData {
  period: number;
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
      totalProtein: number;
      totalCarbs: number;
      totalFats: number;
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
  dailyChart: DailyChart[];
  bodyMetrics: Array<{
    date: string;
    caloriesIn: number;
    caloriesOut: number;
    waterIntake: number;
    sleepHours: number;
    steps: number;
  }>;
  weightTrend: Array<{ date: string; weight: number }>;
}

type Period = 7 | 30 | 90;

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);

  const fetchAnalytics = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
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
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  // Derived data
  const maxWorkouts = data ? Math.max(...data.dailyChart.map((d) => d.workouts), 1) : 1;
  const maxCalories = data
    ? Math.max(...data.dailyChart.map((d) => Math.max(d.caloriesConsumed, d.caloriesBurned)), 1)
    : 1;
  const macros = data?.meals?.macros;
  const totalMacros = (macros?.avgProtein || 0) + (macros?.avgCarbs || 0) + (macros?.avgFats || 0);
  const proteinPct = totalMacros > 0 ? (macros?.avgProtein || 0) / totalMacros * 100 : 0;
  const carbsPct = totalMacros > 0 ? (macros?.avgCarbs || 0) / totalMacros * 100 : 0;
  const fatsPct = totalMacros > 0 ? (macros?.avgFats || 0) / totalMacros * 100 : 0;

  // Show limited daily chart points for readability
  const chartData = data?.dailyChart || [];
  const displayChart = period <= 7
    ? chartData
    : period <= 30
      ? chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1)
      : chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1);

  const periodLabels: Record<Period, string> = { 7: '7 Days', 30: '30 Days', 90: '90 Days' };

  if (loading && !data) {
    return (
      <div className="py-8 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-800/50 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-gray-800/50 animate-pulse mt-4" />
      </div>
    );
  }

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-xs text-gray-500">Track your fitness progress</p>
        </div>
        <BarChart3 className="w-5 h-5 text-purple-400" />
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {([7, 30, 90] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              period === p
                ? 'gradient-bg text-white'
                : 'glass-card text-gray-400 hover:bg-white/10 border border-gray-700/50'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Total Workouts"
          value={data?.workouts?.total ?? 0}
          sub={`${data?.workouts?.totalMinutes ?? 0} min`}
          gradient="from-purple-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          icon={Flame}
          label="Calories Burned"
          value={(data?.workouts?.totalCaloriesBurned ?? 0).toLocaleString()}
          sub="kcal total"
          gradient="from-orange-500 to-red-500"
          delay={1}
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Avg Meals/Day"
          value={data?.meals?.total ? (data.meals.total / period).toFixed(1) : '0'}
          sub={`${data?.meals?.total ?? 0} total meals`}
          gradient="from-green-500 to-emerald-500"
          delay={2}
        />
        <StatCard
          icon={Zap}
          label="Current Streak"
          value={`${data?.streaks?.currentStreak ?? 0} days`}
          sub={`Best: ${data?.streaks?.longestStreak ?? 0} days`}
          gradient="from-yellow-500 to-amber-500"
          delay={3}
        />
      </div>

      {/* Weekly Activity Chart */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Activity
          </h3>
          <span className="text-xs text-gray-500">{periodLabels[period]}</span>
        </div>
        <div className="flex items-end justify-between gap-1.5" style={{ height: '120px' }}>
          {displayChart.map((day, i) => {
            const workoutHeight = Math.max(day.workouts > 0 ? 8 : 2, (day.workouts / maxWorkouts) * 100);
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-gray-600 mb-0.5">
                  {day.workouts > 0 ? day.workouts : ''}
                </div>
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full max-w-[28px] rounded-t-md gradient-bg transition-all duration-500"
                    style={{ height: `${workoutHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-600 mt-1">
                  {period <= 7 ? day.day.slice(0, 2) : day.day.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm gradient-bg" />
            <span className="text-[10px] text-gray-500">Workouts</span>
          </div>
        </div>
      </div>

      {/* Calorie Chart — Consumed vs Burned */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Calories
          </h3>
          <span className="text-xs text-gray-500">Consumed vs Burned</span>
        </div>
        <div className="flex items-end justify-between gap-1" style={{ height: '130px' }}>
          {displayChart.map((day) => {
            const consumedHeight = maxCalories > 0 ? (day.caloriesConsumed / maxCalories) * 100 : 2;
            const burnedHeight = maxCalories > 0 ? (day.caloriesBurned / maxCalories) * 100 : 2;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-[2px]" style={{ height: '90px' }}>
                  <div
                    className="w-[10px] rounded-t-sm bg-green-500/70 transition-all duration-500"
                    style={{ height: `${Math.max(consumedHeight, day.caloriesConsumed > 0 ? 4 : 0)}%` }}
                  />
                  <div
                    className="w-[10px] rounded-t-sm bg-orange-500/70 transition-all duration-500"
                    style={{ height: `${Math.max(burnedHeight, day.caloriesBurned > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-600">
                  {period <= 7 ? day.day.slice(0, 2) : day.day.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-green-500/70" />
            <span className="text-[10px] text-gray-500">Consumed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-orange-500/70" />
            <span className="text-[10px] text-gray-500">Burned</span>
          </div>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            Macros
          </h3>
          <span className="text-xs text-gray-500">Avg per meal</span>
        </div>
        <div className="flex items-center gap-6">
          {/* CSS Donut */}
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
              {/* Protein */}
              <circle
                cx="18" cy="18" r="15.915" fill="none"
                stroke="#a855f7" strokeWidth="3.5"
                strokeDasharray={`${proteinPct} ${100 - proteinPct}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Carbs */}
              <circle
                cx="18" cy="18" r="15.915" fill="none"
                stroke="#22c55e" strokeWidth="3.5"
                strokeDasharray={`${carbsPct} ${100 - carbsPct}`}
                strokeDashoffset={`${-proteinPct}`}
                strokeLinecap="round"
              />
              {/* Fats */}
              <circle
                cx="18" cy="18" r="15.915" fill="none"
                stroke="#f59e0b" strokeWidth="3.5"
                strokeDasharray={`${fatsPct} ${100 - fatsPct}`}
                strokeDashoffset={`${-(proteinPct + carbsPct)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-white">{Math.round(totalMacros)}g</span>
              <span className="text-[8px] text-gray-500">total</span>
            </div>
          </div>

          {/* Macro details */}
          <div className="flex-1 space-y-3">
            <MacroBar
              label="Protein"
              value={macros?.avgProtein || 0}
              unit="g"
              color="bg-purple-500"
              textColor="text-purple-400"
              percentage={proteinPct}
            />
            <MacroBar
              label="Carbs"
              value={macros?.avgCarbs || 0}
              unit="g"
              color="bg-green-500"
              textColor="text-green-400"
              percentage={carbsPct}
            />
            <MacroBar
              label="Fats"
              value={macros?.avgFats || 0}
              unit="g"
              color="bg-amber-500"
              textColor="text-amber-400"
              percentage={fatsPct}
            />
          </div>
        </div>
      </div>

      {/* Body Metrics Trend */}
      {data?.bodyMetrics && data.bodyMetrics.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Daily Logs
            </h3>
            <span className="text-xs text-gray-500">{data.bodyMetrics.length} entries</span>
          </div>
          <div className="space-y-3">
            <MetricRow
              label="Avg Calories In"
              value={Math.round(data.bodyMetrics.reduce((s, m) => s + (m.caloriesIn || 0), 0) / data.bodyMetrics.length).toLocaleString()}
              unit="kcal"
            />
            <MetricRow
              label="Avg Calories Out"
              value={Math.round(data.bodyMetrics.reduce((s, m) => s + (m.caloriesOut || 0), 0) / data.bodyMetrics.length).toLocaleString()}
              unit="kcal"
            />
            <MetricRow
              label="Avg Water Intake"
              value={(data.bodyMetrics.reduce((s, m) => s + (m.waterIntake || 0), 0) / data.bodyMetrics.length).toFixed(1)}
              unit="glasses"
            />
            <MetricRow
              label="Avg Sleep"
              value={(data.bodyMetrics.reduce((s, m) => s + (m.sleepHours || 0), 0) / data.bodyMetrics.length).toFixed(1)}
              unit="hours"
            />
          </div>
        </div>
      )}

      {/* Weight Trend */}
      {data?.weightTrend && data.weightTrend.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Body Weight
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.weightTrend[0].weight} kg</p>
              <p className="text-xs text-gray-500">Current weight</p>
            </div>
          </div>
        </div>
      )}

      {/* XP Progress */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Level {data?.xp?.level ?? 1}</p>
              <p className="text-xs text-gray-500">
                {data?.xp?.current ?? 0} / {data?.xp?.needed ?? 100} XP
              </p>
            </div>
          </div>
          <span className="text-sm font-bold text-orange-400">{data?.xp?.percentage ?? 0}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full gradient-bg rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(data?.xp?.percentage ?? 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  gradient: string;
  delay: number;
}) {
  return (
    <div
      className="glass-card rounded-2xl p-4 animate-slide-up"
      style={{ animationDelay: `${delay * 75}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        {label}
      </p>
      <p className="text-[10px] text-gray-600">{sub}</p>
    </div>
  );
}

function MacroBar({
  label,
  value,
  unit,
  color,
  textColor,
  percentage,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  textColor: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-semibold ${textColor}`}>{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value} <span className="text-xs text-gray-500 font-normal">{unit}</span>
      </span>
    </div>
  );
}
