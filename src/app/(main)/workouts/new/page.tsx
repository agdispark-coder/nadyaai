'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Dumbbell,
  Heart,
  Zap,
  Wind,
  TreePine,
  Trophy,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Save,
} from 'lucide-react';

type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'yoga' | 'flexibility' | 'sports';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  duration: string;
}

const WORKOUT_TYPES: { key: WorkoutType; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string; bg: string }[] = [
  { key: 'strength', label: 'Strength', icon: Dumbbell, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500/10' },
  { key: 'cardio', label: 'Cardio', icon: Heart, gradient: 'from-red-500 to-pink-500', bg: 'bg-red-500/10' },
  { key: 'hiit', label: 'HIIT', icon: Zap, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10' },
  { key: 'yoga', label: 'Yoga', icon: Wind, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/10' },
  { key: 'flexibility', label: 'Flexibility', icon: TreePine, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
  { key: 'sports', label: 'Sports', icon: Trophy, gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10' },
];

const DIFFICULTY_LEVELS = [
  { key: 'beginner', label: 'Beginner', color: 'text-green-400', bg: 'bg-green-500/10' },
  { key: 'easy', label: 'Easy', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { key: 'medium', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { key: 'hard', label: 'Hard', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { key: 'expert', label: 'Expert', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const emptyExercise = (): Exercise => ({
  name: '',
  sets: '',
  reps: '',
  weight: '',
  duration: '',
});

export default function NewWorkoutPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType | ''>('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addExercise = () => {
    setExercises(prev => [...prev, emptyExercise()]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) return;
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !duration) {
      setError('Please fill in the required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        type,
        duration: parseInt(duration, 10),
        difficulty,
        notes: notes.trim() || undefined,
        calories: calories ? parseInt(calories, 10) : 0,
        exercises: exercises
          .filter(ex => ex.name.trim())
          .map((ex, i) => ({
            name: ex.name.trim(),
            sets: ex.sets ? parseInt(ex.sets, 10) : undefined,
            reps: ex.reps ? parseInt(ex.reps, 10) : undefined,
            weight: ex.weight ? parseFloat(ex.weight) : undefined,
            duration: ex.duration ? parseInt(ex.duration, 10) : undefined,
            order: i,
          })),
      };

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/workouts');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save workout');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-white">New Workout</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Workout Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Morning Push Day"
            className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {WORKOUT_TYPES.map(t => {
              const Icon = t.icon;
              const isActive = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                    isActive
                      ? `${t.bg} border border-purple-500/40 shadow-lg shadow-purple-500/10`
                      : 'glass-card hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Calories */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Duration (min) *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="45"
                min="1"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Calories
            </label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                placeholder="350"
                min="0"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Difficulty
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DIFFICULTY_LEVELS.map(level => (
              <button
                key={level.key}
                type="button"
                onClick={() => setDifficulty(level.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  difficulty === level.key
                    ? `${level.bg} ${level.color} border border-current/20`
                    : 'glass-card text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Exercises
            </label>
            <span className="text-xs text-gray-600">
              {exercises.filter(e => e.name.trim()).length} added
            </span>
          </div>

          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-4 space-y-3 animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Exercise {index + 1}
                  </span>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Exercise Name */}
                <input
                  type="text"
                  value={exercise.name}
                  onChange={e => updateExercise(index, 'name', e.target.value)}
                  placeholder="Exercise name"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />

                {/* Sets / Reps / Weight / Duration */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">Sets</label>
                    <input
                      type="number"
                      value={exercise.sets}
                      onChange={e => updateExercise(index, 'sets', e.target.value)}
                      placeholder="3"
                      min="0"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">Reps</label>
                    <input
                      type="number"
                      value={exercise.reps}
                      onChange={e => updateExercise(index, 'reps', e.target.value)}
                      placeholder="12"
                      min="0"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">Weight</label>
                    <input
                      type="number"
                      value={exercise.weight}
                      onChange={e => updateExercise(index, 'weight', e.target.value)}
                      placeholder="20"
                      min="0"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">Dur (s)</label>
                    <input
                      type="number"
                      value={exercise.duration}
                      onChange={e => updateExercise(index, 'duration', e.target.value)}
                      placeholder="60"
                      min="0"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise Button */}
          <button
            type="button"
            onClick={addExercise}
            className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-purple-500/40 hover:text-purple-400 hover:bg-purple-500/5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did the workout feel? Any observations..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-slide-down">
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Workout
            </>
          )}
        </button>

        <div className="h-4" />
      </form>
    </div>
  );
}
