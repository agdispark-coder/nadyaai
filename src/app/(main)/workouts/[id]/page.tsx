'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Flame,
  Zap,
  Dumbbell,
  Heart,
  Wind,
  TreePine,
  Trophy,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Weight,
  RotateCcw,
  Timer,
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  order: number;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  calories: number;
  difficulty: string;
  notes?: string;
  completedAt: string;
  isPublic: boolean;
  exercises: Exercise[];
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string; bg: string; label: string }> = {
  strength: { icon: Dumbbell, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500/10', label: 'Strength' },
  cardio: { icon: Heart, gradient: 'from-red-500 to-pink-500', bg: 'bg-red-500/10', label: 'Cardio' },
  hiit: { icon: Zap, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', label: 'HIIT' },
  yoga: { icon: Wind, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/10', label: 'Yoga' },
  flexibility: { icon: TreePine, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', label: 'Flexibility' },
  sports: { icon: Trophy, gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10', label: 'Sports' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/10',
  easy: 'text-teal-400 bg-teal-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  hard: 'text-orange-400 bg-orange-500/10',
  expert: 'text-red-400 bg-red-500/10',
};

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const res = await fetch(`/api/workouts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkout(data.workout);
        } else if (res.status === 404) {
          setError('Workout not found');
        } else {
          setError('Failed to load workout');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchWorkout();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/workouts');
      } else {
        setError('Failed to delete workout');
        setDeleting(false);
      }
    } catch {
      setError('Something went wrong');
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error && !workout) {
    return (
      <div className="py-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-gray-400 text-sm">{error}</p>
        <Link
          href="/workouts"
          className="px-5 py-2.5 glass-card rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all"
        >
          Back to Workouts
        </Link>
      </div>
    );
  }

  if (!workout) return null;

  const config = TYPE_CONFIG[workout.type] || TYPE_CONFIG.strength;
  const TypeIcon = config.icon;
  const diffColor = DIFFICULTY_COLORS[workout.difficulty] || DIFFICULTY_COLORS.medium;

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/workouts"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workout Info Card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
            <TypeIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight">{workout.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg bg-gradient-to-r ${config.gradient} text-white`}>
                {config.label}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${diffColor}`}>
                {workout.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center py-2.5 rounded-xl bg-white/[0.03]">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{workout.duration}</p>
            <p className="text-[10px] text-gray-500">minutes</p>
          </div>
          <div className="text-center py-2.5 rounded-xl bg-white/[0.03]">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{workout.calories || 0}</p>
            <p className="text-[10px] text-gray-500">calories</p>
          </div>
          <div className="text-center py-2.5 rounded-xl bg-white/[0.03]">
            <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{workout.exercises.length}</p>
            <p className="text-[10px] text-gray-500">exercises</p>
          </div>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {formatDate(workout.completedAt)}
        </p>
      </div>

      {/* Exercises */}
      {workout.exercises.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-purple-400" />
            Exercises
          </h3>
          <div className="space-y-2">
            {workout.exercises.map((exercise, index) => (
              <div
                key={exercise.id || index}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {exercise.sets && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                        <RotateCcw className="w-3 h-3" />
                        {exercise.sets} sets
                      </span>
                    )}
                    {exercise.reps && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                        <Weight className="w-3 h-3" />
                        {exercise.reps} reps
                      </span>
                    )}
                    {exercise.weight && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                        <Dumbbell className="w-3 h-3" />
                        {exercise.weight} kg
                      </span>
                    )}
                    {exercise.duration && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                        <Timer className="w-3 h-3" />
                        {exercise.duration}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {workout.notes && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Notes
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{workout.notes}</p>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-slide-down">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Delete Workout?</h3>
            <p className="text-sm text-gray-400 text-center mb-5">
              This action cannot be undone. This workout and all its exercises will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl glass-card text-sm font-medium text-gray-300 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
