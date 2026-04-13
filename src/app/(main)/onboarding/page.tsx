'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,

  Dumbbell,
  HeartPulse,
  Bike,
  Flame,
  Ruler,
  Weight,
  Activity,
  Bell,
  BellOff,
  Check,
} from 'lucide-react';

const TOTAL_STEPS = 3;

const FITNESS_GOALS = [
  {
    id: 'lose_weight',
    label: 'Lose Weight',
    description: 'Burn fat & get lean',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'build_muscle',
    label: 'Build Muscle',
    description: 'Strength & hypertrophy',
    icon: Dumbbell,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'stay_fit',
    label: 'Stay Fit',
    description: 'Maintain & improve',
    icon: HeartPulse,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'endurance',
    label: 'Endurance',
    description: 'Cardio & stamina',
    icon: Bike,
    color: 'from-purple-500 to-pink-500',
  },
];

const AVATARS = [
  { id: 'avatar-1', emoji: '💪', label: 'Strong' },
  { id: 'avatar-2', emoji: '🏃', label: 'Runner' },
  { id: 'avatar-3', emoji: '🧘', label: 'Zen' },
  { id: 'avatar-4', emoji: '🥊', label: 'Fighter' },
  { id: 'avatar-5', emoji: '🏊', label: 'Swimmer' },
  { id: 'avatar-6', emoji: '🚴', label: 'Cyclist' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { id: 'light', label: 'Lightly Active', description: '1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
  { id: 'active', label: 'Very Active', description: '6-7 days/week' },
  { id: 'very_active', label: 'Professional', description: 'Intense daily training' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [step, setStep] = useState(1);
  const [fitnessGoal, setFitnessGoal] = useState<string>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('avatar-1');
  const [notifications, setNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canProceed = () => {
    if (step === 1) return fitnessGoal !== '';
    if (step === 2) return height !== '' && weight !== '';
    if (step === 3) return selectedAvatar !== '';
    return false;
  };

  const handleNext = () => {
    if (canProceed()) {
      setError('');
      if (step < TOTAL_STEPS) {
        setStep(step + 1);
      } else {
        handleFinish();
      }
    } else {
      if (step === 1) setError('Please select a fitness goal');
      else if (step === 2) setError('Please fill in your body info');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Update profile
      const profileRes = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fitnessGoal,
          height: parseFloat(height),
          weight: parseFloat(weight),
          activityLevel,
          avatar: selectedAvatar,
        }),
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.data?.user) {
          // Merge with onboardingCompleted
          const updatedUser = {
            ...profileData.data.user,
            onboardingCompleted: true,
          };
          setUser(updatedUser);
        }
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-4">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Nadya AI</span>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    i < step
                      ? 'gradient-bg'
                      : i === step
                      ? 'bg-gray-600'
                      : 'bg-gray-800'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto animate-fade-in" key={step}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
              {error}
            </div>
          )}

          {/* Step 1: Fitness Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  What&apos;s your fitness goal?
                </h2>
                <p className="text-gray-500 text-sm">
                  We&apos;ll personalize your experience based on this
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FITNESS_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = fitnessGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setFitnessGoal(goal.id)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {goal.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {goal.description}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Body Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Your body info
                </h2>
                <p className="text-gray-500 text-sm">
                  Help us calculate your daily needs
                </p>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-4 h-4 text-purple-400" />
                    <label className="text-sm font-medium text-gray-300">
                      Height
                    </label>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="170"
                      min="100"
                      max="250"
                      className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder:text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-gray-500 shrink-0">cm</span>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Weight className="w-4 h-4 text-green-400" />
                    <label className="text-sm font-medium text-gray-300">
                      Weight
                    </label>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="70"
                      min="30"
                      max="300"
                      className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder:text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-gray-500 shrink-0">kg</span>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Activity Level
                  </label>
                </div>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setActivityLevel(level.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        activityLevel === level.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full transition-all ${
                            activityLevel === level.id
                              ? 'bg-purple-500'
                              : 'bg-gray-700'
                          }`}
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">
                            {level.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {level.description}
                          </p>
                        </div>
                      </div>
                      {activityLevel === level.id && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Personalize */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Let&apos;s personalize
                </h2>
                <p className="text-gray-500 text-sm">
                  Choose your avatar & preferences
                </p>
              </div>

              {/* Avatar Selection */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">
                  Choose an avatar
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        selectedAvatar === avatar.id
                          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                          : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                      }`}
                    >
                      <span className="text-3xl">{avatar.emoji}</span>
                      <span className="text-xs text-gray-400">{avatar.label}</span>
                      {selectedAvatar === avatar.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Preference */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notifications ? (
                      <Bell className="w-5 h-5 text-purple-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        Notifications
                      </p>
                      <p className="text-xs text-gray-500">
                        Workout reminders & tips
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-12 h-7 rounded-full transition-all ${
                      notifications
                        ? 'bg-purple-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${
                        notifications
                          ? 'left-5.5 translate-x-0'
                          : 'left-0.5'
                      }`}
                      style={{
                        left: notifications ? '22px' : '2px',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 px-6 pb-8 safe-bottom">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-xl glass-card border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed() && step < TOTAL_STEPS}
            className={`flex-1 py-3.5 gradient-bg rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 1 ? '' : ''
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : step === TOTAL_STEPS ? (
              <>
                Start Your Journey
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
