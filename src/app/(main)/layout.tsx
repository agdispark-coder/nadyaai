'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Users,
  User,
  Sparkles,
  Bell,
  Loader2,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard', icon: Dumbbell, label: 'Workouts' },
  { href: '/dashboard', icon: UtensilsCrossed, label: 'Meals' },
  { href: '/dashboard', icon: Users, label: 'Social' },
  { href: '/dashboard', icon: User, label: 'Profile' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAppStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="glass-strong border-b border-white/5">
          <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
            {/* App Name */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Nadya AI</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#030712]" />
              </button>

              {/* Avatar */}
              <button
                onClick={logout}
                className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                {getInitials(user.name, user.username)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-md mx-auto px-4">{children}</div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
        <div className="glass-strong border-t border-white/5">
          <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-purple-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
