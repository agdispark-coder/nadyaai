'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownLeft,
  User,
  Mail,
  Bell,
  Moon,
  Globe,
  Lock,
  Edit3,
  Shield,
  CreditCard,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Loader2,
  LogOut,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { SUBSCRIPTION_TIERS } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayName = user?.name || user?.username || 'User';
  const displayEmail = user?.email || '';
  const currentTier = user?.subscriptionTier || 'free';
  const tierInfo = SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS];

  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'DELETE',
      });
      if (res.ok) {
        logout();
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-gray-500">Manage your account</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-lg font-bold text-white shrink-0">
            {getInitials(user?.name, user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{displayName}</h2>
            <p className="text-sm text-gray-400 truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {displayEmail}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 shrink-0" />
              @{user?.username}
            </p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            Preferences
          </h3>
        </div>

        {/* Notifications Toggle */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-white">Notifications</p>
              <p className="text-xs text-gray-500">Push & email alerts</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
              notifications ? 'bg-purple-500' : 'bg-gray-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${
              notifications ? 'left-6' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Dark Mode */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-white">Dark Mode</p>
              <p className="text-xs text-gray-500">Always on</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full bg-purple-500 relative">
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-6" />
          </div>
        </div>

        {/* Language */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-white">Language</p>
              <p className="text-xs text-gray-500">App language</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Account
          </h3>
        </div>

        <SettingsRow
          icon={Lock}
          label="Change Password"
          desc="Update your password"
          onClick={() => {}}
        />
        <SettingsRow
          icon={Edit3}
          label="Edit Profile"
          desc="Name, bio, avatar"
          onClick={() => router.push('/profile')}
        />
        <SettingsRow
          icon={Shield}
          label="Privacy Settings"
          desc="Visibility & data"
          onClick={() => {}}
        />
      </div>

      {/* Subscription */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            Subscription
          </h3>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                {tierInfo?.name || 'Free'} Plan
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {tierInfo?.price ? `${tierInfo.price} MAD/month` : 'Free forever'}
              </p>
            </div>
            <button
              onClick={() => router.push('/subscriptions')}
              className="px-4 py-2 rounded-xl text-xs font-semibold gradient-bg text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              {currentTier === 'free' ? 'Upgrade' : 'Manage'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl overflow-hidden border border-red-500/10">
        <div className="px-5 py-3 border-b border-red-500/10">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
        </div>

        <div className="px-5 py-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Delete Account</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently delete your account and data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98] transition-all"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-red-500/10 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">
                  This action is irreversible. All your data, workouts, meals, and progress will be permanently deleted. Are you sure?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-gray-300 border border-gray-700/50 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            About
          </h3>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Version</span>
            <span className="text-sm text-gray-300 font-mono">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={logout}
        className="w-full py-3.5 glass-card rounded-2xl text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all border border-red-500/10"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <div className="text-left">
          <p className="text-sm text-white">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600" />
    </button>
  );
}
