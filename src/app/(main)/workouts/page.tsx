'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Dumbbell,
  Heart,
  Zap,
  Wind,
  TreePine,
  Trophy,
  Clock,
  Flame,
  DumbbellIcon,
} from 'lucide-react';

type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'yoga' | 'flexibility' | 'sports';

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
}

interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  duration: number;
  calories: number;
  difficulty: string;
  completedAt: string;
  exercises: Exercise[];
}

const WORKOUT_TYPES: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: 'all', label: 'All', icon: Dumbbell, color: 'text-gray-400' },
  { key: 'strength', label: 'Strength', icon: DumbbellIcon, color: 'text-purple-400' },
  { key: 'cardio', label: 'Cardio', icon: Heart, color: 'text-red-400' },
  { key: 'hiit', label: 'HIIT', icon: Zap, color: 'text-orange-400' },
  { key: 'yoga', label: 'Yoga', icon: Wind, color: 'text-teal-400' },
  { key: 'sports', label: 'Sports', icon: Trophy, color: 'text-yellow-400' },
];

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string; bg: string }> = {
  strength: { icon: DumbbellIcon, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500/10' },
  cardio: { icon: Heart, gradient: 'from-red-500 to-pink-500', bg: 'bg-red-500/10' },
  hiit: { icon: Zap, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10' },
  yoga: { icon: Wind, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/10' },
  flexibility: { icon: TreePine, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
  sports: { icon: Trophy, gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10' },
};

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  const fetchWorkouts = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (type && type !== 'all') params.set('type', type);
      const res = await fetch(`/api/workouts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data.workouts || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts(activeType);
  }, [activeType, fetchWorkouts]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {workouts.length > 0
              ? `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`
              : 'Track your fitness journey'}
          </p>
        </div>
        <Link
          href="/workouts/new"
          className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {WORKOUT_TYPES.map((type) => {
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
      {!loading && workouts.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
            <Dumbbell className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No workouts yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[240px] mx-auto">
            Start tracking your workouts to see your progress and earn XP!
          </p>
          <Link
            href="/workouts/new"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Your First Workout
          </Link>
        </div>
      )}

      {/* Workout Cards */}
      {!loading && workouts.length > 0 && (
        <div className="space-y-3">
          {workouts.map((workout, index) => {
            const config = TYPE_CONFIG[workout.type] || TYPE_CONFIG.strength;
            const TypeIcon = config.icon;
            return (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="glass-card rounded-2xl p-4 block hover:bg-white/[0.04] active:scale-[0.98] transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {/* Type Icon */}
                  <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${config.gradient.split(' ')[0].replace('from-', 'text-')}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{workout.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r ${config.gradient} text-white shrink-0`}>
                        {workout.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workout.duration} min
                      </span>
                      {workout.calories > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {workout.calories} cal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{formatDate(workout.completedAt)}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{workout.difficulty}</p>
                  </div>
                </div>

                {/* Exercises preview */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-gray-500">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} ·{' '}
                      {workout.exercises.slice(0, 3).map(e => e.name).join(', ')}
                      {workout.exercises.length > 3 ? '...' : ''}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
