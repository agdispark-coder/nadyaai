'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!confirmed) {
      setError('Please confirm by checking the box above');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to request account deletion');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#030712] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-100px] w-[400px] h-[400px] rounded-full bg-red-600/5 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-red-900/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Delete Account</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Permanently remove your account and all data
          </p>
        </div>

        {/* Warning card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Deletion Requested
                </h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  If an account exists with{' '}
                  <span className="text-white font-medium">{email}</span>, it
                  will be permanently deleted along with all associated data
                  including workouts, meals, and activity history.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                This action is irreversible once processed.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mt-4"
              >
                Return to login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Warning banner */}
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">
                  This action is <strong>permanent and irreversible</strong>. All
                  your data including profile, workouts, meals, progress, and
                  activity history will be completely erased.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirm your email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your account email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Enter the email associated with your account
                  </p>
                </div>

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        confirmed
                          ? 'bg-red-500 border-red-500'
                          : 'border-gray-600 group-hover:border-gray-500'
                      }`}
                    >
                      {confirmed && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I understand that deleting my account is permanent and cannot
                    be undone. All my data will be lost forever.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !confirmed}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 bg-red-500"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
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

              {/* Login link */}
              <p className="text-center text-sm text-gray-400">
                Changed your mind?{' '}
                <Link
                  href="/login"
                  className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Account deletion requests are processed immediately.
        </p>
      </div>
    </div>
  );
}
