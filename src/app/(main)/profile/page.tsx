'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  User,
  Loader2,
  ChevronRight,
  Zap,
  Flame,
  Users,
  Trophy,
  Award,
  BarChart3,
  Wallet,
  Crown,
  Gem,
  Gift,
  Settings,
  LogOut,
  Star,
  Camera,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalMeals: number;
  totalCaloriesBurned: number;
  subscriptionTier: string;
  referralCode: string;
  createdAt: string;
}

interface AchievementData {
  total: number;
  unlocked: number;
  progress: number;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  free: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Free', icon: User },
  bronze: { color: 'text-amber-700', bg: 'bg-amber-700/10', label: 'Bronze', icon: ShieldCheck },
  silver: { color: 'text-gray-300', bg: 'bg-gray-300/10', label: 'Silver', icon: ShieldCheck },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Gold', icon: Crown },
  platinum: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Platinum', icon: Gem },
};

export default function ProfilePage() {
  const { user: storeUser, logout } = useAppStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, achievementsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/achievements'),
      ]);

      if (profileRes.ok) {
        const json = await profileRes.json();
        setProfile(json.data?.user || null);
      }

      if (achievementsRes.ok) {
        const json = await achievementsRes.json();
        setAchievements({
          total: json.total || 0,
          unlocked: json.unlocked || 0,
          progress: json.progress || 0,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const user = profile || storeUser;
  const tier = user?.subscriptionTier || 'free';
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const menuItems = [
    { icon: Pencil, label: 'Edit Profile', href: '/profile' },
    { icon: Trophy, label: 'My Achievements', href: '/profile', badge: achievements ? `${achievements.unlocked}/${achievements.total}` : undefined },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard' },
    { icon: Wallet, label: 'Wallet', href: '/profile' },
    { icon: Crown, label: 'Subscriptions', href: '/profile', badge: tierConfig.label },
    { icon: Gift, label: 'Referral Program', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/profile' },
  ];

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        {/* Avatar with Edit Overlay */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
            {user?.avatar && user.avatar !== 'default' ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              getInitials(user?.name, user?.username)
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gray-800 border-2 border-[#030712] flex items-center justify-center hover:bg-gray-700 transition-colors">
            <Camera className="w-3.5 h-3.5 text-gray-300" />
          </button>
        </div>

        {/* Name & Username */}
        <h1 className="text-xl font-bold text-white">
          {user?.name || user?.username || 'Athlete'}
        </h1>
        <p className="text-sm text-gray-500">@{user?.username}</p>

        {/* Bio */}
        {(user as UserProfile)?.bio && (
          <p className="text-xs text-gray-400 mt-2 max-w-xs">{(user as UserProfile)?.bio}</p>
        )}

        {/* Subscription Badge */}
        <div className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full ${tierConfig.bg}`}>
          <TierIcon className={`w-3.5 h-3.5 ${tierConfig.color}`} />
          <span className={`text-[11px] font-semibold ${tierConfig.color}`}>{tierConfig.label}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="glass-card rounded-xl p-3 text-center">
          <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{user?.level || 1}</p>
          <p className="text-[9px] text-gray-500">Level</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">
            {user?.xp ? (user.xp >= 1000 ? `${Math.floor(user.xp / 1000)}K` : user.xp) : 0}
          </p>
          <p className="text-[9px] text-gray-500">XP</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{user?.streak || 0}</p>
          <p className="text-[9px] text-gray-500">Streak</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">--</p>
          <p className="text-[9px] text-gray-500">Friends</p>
        </div>
      </div>

      {/* Quick Achievements Progress */}
      {achievements && achievements.total > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Achievements</h3>
            </div>
            <span className="text-xs text-gray-500">
              {achievements.unlocked} / {achievements.total}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${achievements.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {achievements.progress}% complete — keep going! 🚀
          </p>
        </div>
      )}

      {/* Menu Items */}
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {}}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <span className="flex-1 text-sm text-white font-medium">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full py-3.5 rounded-2xl border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      {/* App Version */}
      <div className="text-center pb-2">
        <p className="text-[10px] text-gray-700">Nadya AI v1.0.0</p>
      </div>
    </div>
  );
}
