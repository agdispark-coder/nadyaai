'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Sun,
  UtensilsCrossed,
  Moon,
  Apple,
  Flame,
  ChevronLeft,
  ChevronRight,
  Beef,
  Wheat,
  Droplets,
  Sparkles,
} from 'lucide-react';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface Meal {
  id: string;
  type: MealType;
  name?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  loggedAt: string;
  aiScanned: boolean;
  items: MealItem[];
}

const MEAL_TYPES: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }[] = [
  { key: 'all', label: 'All', icon: UtensilsCrossed, color: 'text-gray-400', bg: '' },
  { key: 'breakfast', label: 'Breakfast', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'lunch', label: 'Lunch', icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { key: 'dinner', label: 'Dinner', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'snack', label: 'Snack', icon: Apple, color: 'text-green-400', bg: 'bg-green-500/10' },
];

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string }> = {
  breakfast: { icon: Sun, bg: 'bg-amber-500/10', color: 'text-amber-400' },
  lunch: { icon: UtensilsCrossed, bg: 'bg-orange-500/10', color: 'text-orange-400' },
  dinner: { icon: Moon, bg: 'bg-indigo-500/10', color: 'text-indigo-400' },
  snack: { icon: Apple, bg: 'bg-green-500/10', color: 'text-green-400' },
};

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Generate last 7 days
function getLast7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dates = useMemo(() => getLast7Days(), []);

  const fetchMeals = useCallback(async (type?: string, date?: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (type && type !== 'all') params.set('type', type);
      if (date) params.set('date', formatDateStr(date));
      const res = await fetch(`/api/meals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeals(data.meals || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals(activeType, selectedDate);
  }, [activeType, selectedDate, fetchMeals]);

  // Daily summary
  const summary = useMemo(() => {
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    return totals;
  }, [meals]);

  const maxMacro = Math.max(summary.protein, summary.carbs, summary.fats, 1);

  const scrollDateRef = useCallback((direction: 'left' | 'right') => {
    const idx = dates.findIndex(
      d => formatDateStr(d) === formatDateStr(selectedDate)
    );
    if (direction === 'left' && idx > 0) setSelectedDate(dates[idx - 1]);
    if (direction === 'right' && idx < dates.length - 1) setSelectedDate(dates[idx + 1]);
  }, [dates, selectedDate]);

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your nutrition
          </p>
        </div>
        <Link
          href="/meals/new"
          className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Date Selector */}
      <div className="glass-card rounded-2xl p-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollDateRef('left')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide" ref={(el) => {
            if (el) {
              const activeBtn = el.querySelector('[data-active="true"]');
              if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }
          }}>
            {dates.map(d => {
              const isActive = formatDateStr(d) === formatDateStr(selectedDate);
              const dayLabel = getDayLabel(d);
              const dayNum = d.getDate();
              return (
                <button
                  key={formatDateStr(d)}
                  data-active={isActive}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[52px] transition-all ${
                    isActive
                      ? 'gradient-bg text-white shadow-md shadow-purple-500/20'
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <span className="text-[10px] font-medium">{dayLabel}</span>
                  <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => scrollDateRef('right')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Daily Summary
          </h3>
          <span className="text-xs text-gray-500">{getDayLabel(selectedDate)}</span>
        </div>

        {/* Calories */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-white">{summary.calories.toLocaleString()}</p>
            <p className="text-xs text-gray-500">calories consumed</p>
          </div>
        </div>

        {/* Macros */}
        <div className="space-y-2.5">
          <MacroBar label="Protein" value={summary.protein} max={maxMacro} unit="g" color="bg-purple-500" icon={Beef} textColor="text-purple-400" />
          <MacroBar label="Carbs" value={summary.carbs} max={maxMacro} unit="g" color="bg-amber-500" icon={Wheat} textColor="text-amber-400" />
          <MacroBar label="Fats" value={summary.fats} max={maxMacro} unit="g" color="bg-green-500" icon={Droplets} textColor="text-green-400" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {MEAL_TYPES.map(type => {
          const Icon = type.icon;
          const isActive = activeType === type.key;
          return (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'gradient-bg text-white shadow-md shadow-purple-500/20'
                  : 'glass-card text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-800 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && meals.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
            <UtensilsCrossed className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No meals logged</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[240px] mx-auto">
            Start tracking your meals to monitor your nutrition and reach your goals!
          </p>
          <Link
            href="/meals/new"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Log Your First Meal
          </Link>
        </div>
      )}

      {/* Meal Cards */}
      {!loading && meals.length > 0 && (
        <div className="space-y-3">
          {meals.map((meal, index) => {
            const config = TYPE_CONFIG[meal.type] || TYPE_CONFIG.snack;
            const MealIcon = config.icon;
            return (
              <div
                key={meal.id}
                className="glass-card rounded-2xl p-4 hover:bg-white/[0.04] active:scale-[0.98] transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {/* Type Icon */}
                  <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <MealIcon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {meal.name || meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                      </h3>
                      {meal.aiScanned && (
                        <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {meal.calories} cal
                      </span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{formatTime(meal.loggedAt)}</span>
                    </div>
                  </div>

                  {/* Macros mini */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-500 space-x-1">
                      <span className="text-purple-400">P:{Math.round(meal.protein || 0)}g</span>
                      <span className="text-amber-400">C:{Math.round(meal.carbs || 0)}g</span>
                      <span className="text-green-400">F:{Math.round(meal.fats || 0)}g</span>
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                {meal.items && meal.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-gray-500">
                      {meal.items.length} item{meal.items.length !== 1 ? 's' : ''} ·{' '}
                      {meal.items.slice(0, 3).map(it => it.name).join(', ')}
                      {meal.items.length > 3 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MacroBar({
  label,
  value,
  max,
  unit,
  color,
  icon: Icon,
  textColor,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  textColor: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${textColor} shrink-0`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className={`text-xs font-semibold ${textColor}`}>
            {Math.round(value)}{unit}
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
