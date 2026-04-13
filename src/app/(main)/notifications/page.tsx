'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  Bell,
  Users,
  Trophy,
  Award,
  Info,
  Loader2,
  CheckCheck,
  X,
} from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  friend_request: { icon: Users, color: 'text-blue-400 bg-blue-500/10' },
  challenge: { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10' },
  squad: { icon: Users, color: 'text-cyan-400 bg-cyan-500/10' },
  achievement: { icon: Award, color: 'text-purple-400 bg-purple-500/10' },
  subscription: { icon: Award, color: 'text-emerald-400 bg-emerald-500/10' },
  system: { icon: Info, color: 'text-gray-400 bg-gray-500/10' },
  workout_reminder: { icon: Info, color: 'text-orange-400 bg-orange-500/10' },
  referral: { icon: Award, color: 'text-amber-400 bg-amber-500/10' },
};

const DEFAULT_ICON = { icon: Info, color: 'text-gray-400 bg-gray-500/10' };

const groupNotifications = (notifications: Notification[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: { label: string; items: Notification[] }[] = [];

  const todayItems = notifications.filter(
    (n) => new Date(n.createdAt) >= today
  );
  const yesterdayItems = notifications.filter((n) => {
    const d = new Date(n.createdAt);
    return d >= yesterday && d < today;
  });
  const earlierItems = notifications.filter((n) => new Date(n.createdAt) < yesterday);

  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (earlierItems.length > 0) groups.push({ label: 'Earlier', items: earlierItems });

  return groups;
};

const formatTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
  useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissing(id);
    try {
      // Optimistic removal
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silent
    } finally {
      setDismissing(null);
    }
  };

  const groups = groupNotifications(notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Notification Groups */}
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Group Label */}
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h2>

              <div className="space-y-2">
                {group.items.map((notification, index) => {
                  const config = TYPE_CONFIG[notification.type] || DEFAULT_ICON;
                  const Icon = config.icon;
                  const isDismissing = dismissing === notification.id;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleDismiss(notification.id)}
                      className={`glass-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition-all animate-slide-up relative overflow-hidden ${
                        !notification.read ? 'border border-purple-500/20' : ''
                      } ${isDismissing ? 'opacity-0 scale-95' : ''}`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Unread dot */}
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500" />
                      )}

                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Dismiss hint */}
                      <div className="shrink-0 mt-1 opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No notifications</p>
          <p className="text-xs text-gray-600 mt-1">
            You&apos;re all caught up! 🎉
          </p>
        </div>
      )}
    </div>
  );
}
