'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[Login] Attempting login for:', email);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Login] Response status:', res.status);

      const data = await res.json();
      console.log('[Login] Response data:', data);

      if (!data.success) {
        const errorMsg = data.error || 'Login failed';
        console.error('[Login] Login failed:', errorMsg);
        setError(errorMsg);
        return;
      }

      const { user, token } = data.data;
      console.log('[Login] Login successful, user:', user.username);

      setUser(user);
      setToken(token);

      if (!user.onboardingCompleted) {
        console.log('[Login] Redirecting to /onboarding');
        router.push('/onboarding');
      } else {
        console.log('[Login] Redirecting to /dashboard');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('[Login] Error during login:', err);
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
          Your Smart Fitness Companion
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
        <p className="text-gray-400 text-sm mb-6">
          Sign in to continue your fitness journey
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
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
                placeholder="Enter your password"
                required
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
                Sign In
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

        {/* Register Link */}
        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs text-gray-600 mt-6">
        By signing in, you agree to our Terms of Service & Privacy Policy
      </p>
    </div>
  );
}
