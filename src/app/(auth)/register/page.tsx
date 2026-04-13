'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Tag,
  Target,
  Dumbbell,
  HeartPulse,
  Bike,
  Flame,
} from 'lucide-react';

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

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Register] Attempting registration for:', username, email);

      const body: Record<string, string> = {
        username,
        email,
        password,
      };

      if (referralCode.trim()) {
        body.referralCode = referralCode.trim();
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('[Register] Response status:', res.status);

      const data = await res.json();
      console.log('[Register] Response data:', data);

      if (!data.success) {
        const errorMsg = data.error || 'Registration failed';
        console.error('[Register] Registration failed:', errorMsg);
        setError(errorMsg);
        return;
      }

      const { user, token } = data.data;
      console.log('[Register] Registration successful, user:', user.username);

      setUser(user);
      setToken(token);

      // If a fitness goal was selected, update profile
      if (selectedGoal) {
        try {
          await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Cookie: `token=${token}`,
            },
            body: JSON.stringify({ fitnessGoal: selectedGoal }),
          });
        } catch {
          // non-critical, proceed anyway
        }
      }

      console.log('[Register] Redirecting to /onboarding');
      router.push('/onboarding');
    } catch (err) {
      console.error('[Register] Error during registration:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4 animate-pulse-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">Nadya AI</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Start your fitness journey today
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
        <p className="text-gray-400 text-sm mb-6">
          Join thousands crushing their goals
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="fitness_pro"
                required
                minLength={3}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Referral Code (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Referral Code{' '}
              <span className="text-gray-600">(optional)</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Fitness Goal Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Fitness Goal
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FITNESS_GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">
                      {goal.label}
                    </span>
                    <span className="text-[10px] text-gray-500 leading-tight">
                      {goal.description}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 gradient-bg rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs text-gray-600 mt-6">
        By creating an account, you agree to our Terms of Service & Privacy
        Policy
      </p>
    </div>
  );
}
