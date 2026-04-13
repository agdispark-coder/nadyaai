'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  MessageSquare,
  Crown,
  UserCog,
  User,
  LogOut,
  Loader2,
  Globe,
  Lock,
} from 'lucide-react';

interface SquadData {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  isPublic: boolean;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  postsCount: number;
  role: string;
  creator: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  } | null;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
}

interface SquadPost {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
}

export default function SquadDetailPage() {
  const params = useParams();
  const router = useRouter();
  useAppStore();
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<SquadPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'feed'>('members');

  const fetchSquad = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/squads');
      if (res.ok) {
        const json = await res.json();
        const found = (json.squads || []).find(
          (s: SquadData) => s.id === params.id
        );
        if (found) {
          setSquad(found);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/squads?getMembers=${params.id}`);
      if (res.ok) {
        const json = await res.json();
        // Members might come from squads list with details
        // Fallback: if the endpoint doesn't support this, use empty array
        setMembers(json.members || []);
      }
    } catch {
      // Members will be populated from squad data if available
    }
  }, [params.id]);

  useEffect(() => {
    fetchSquad();
    fetchMembers();
  }, [fetchSquad, fetchMembers]);

  const handleCopyCode = async () => {
    if (!squad) return;
    try {
      await navigator.clipboard.writeText(squad.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Owner' };
      case 'admin':
        return { icon: UserCog, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Admin' };
      default:
        return { icon: User, color: 'text-gray-400', bg: 'bg-gray-800', label: 'Member' };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="py-12 text-center">
        <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Squad not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs text-purple-400 hover:text-purple-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = squad.role === 'owner';

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{squad.name}</h1>
          <div className="flex items-center gap-2">
            {squad.isPublic ? (
              <Globe className="w-3 h-3 text-gray-500" />
            ) : (
              <Lock className="w-3 h-3 text-gray-500" />
            )}
            <span className="text-[10px] text-gray-500">
              {squad.memberCount} members
            </span>
          </div>
        </div>
      </div>

      {/* Squad Info Card */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        {squad.description && (
          <p className="text-sm text-gray-300 leading-relaxed">{squad.description}</p>
        )}

        {/* Invite Code */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Invite Code</p>
            <p className="text-sm font-mono font-bold text-white tracking-widest">
              {squad.inviteCode}
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-gray-900/40">
            <p className="text-lg font-bold text-white">{squad.memberCount}</p>
            <p className="text-[10px] text-gray-500">Members</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gray-900/40">
            <p className="text-lg font-bold text-white">{squad.postsCount}</p>
            <p className="text-[10px] text-gray-500">Posts</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gray-900/40">
            <p className="text-lg font-bold text-white">
              {new Date(squad.createdAt).toLocaleDateString('en-US', { month: 'short' })}
            </p>
            <p className="text-[10px] text-gray-500">Created</p>
          </div>
        </div>
      </div>

      {/* Tabs: Members / Feed */}
      <div className="flex gap-2 p-1 glass-card rounded-xl">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'members'
              ? 'gradient-bg text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Members
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'feed'
              ? 'gradient-bg text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Feed
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Owner (creator) always first */}
          {squad.creator && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-yellow-500/[0.02]">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-sm font-bold text-white">
                  {getInitials(squad.creator.name, squad.creator.username)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {squad.creator.name || squad.creator.username}
                </p>
                <p className="text-[10px] text-gray-500">@{squad.creator.username}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-yellow-400 font-medium">Owner</span>
              </div>
            </div>
          )}

          {/* Other members */}
          {members
            .filter((m) => m.user.id !== squad.creator?.id)
            .map((member) => {
              const roleBadge = getRoleBadge(member.role);
              const RoleIcon = roleBadge.icon;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-300">
                    {getInitials(member.user.name, member.user.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user.name || member.user.username}
                    </p>
                    <p className="text-[10px] text-gray-500">@{member.user.username}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${roleBadge.bg}`}>
                    <RoleIcon className={`w-3 h-3 ${roleBadge.color}`} />
                    <span className={`text-[10px] font-medium ${roleBadge.color}`}>{roleBadge.label}</span>
                  </div>
                </div>
              );
            })}

          {/* No other members */}
          {members.length <= 1 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-500">Only the owner is in this squad</p>
              <p className="text-[10px] text-gray-600 mt-1">Share the invite code to add members!</p>
            </div>
          )}
        </div>
      )}

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {posts.length > 0 ? (
            <div className="divide-y divide-white/5">
              {posts.map((post) => (
                <div key={post.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-300">
                      {getInitials(post.user.name, post.user.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {post.user.name || post.user.username}
                      </p>
                      <p className="text-[10px] text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No posts yet</p>
              <p className="text-[10px] text-gray-600 mt-1">Be the first to share something!</p>
            </div>
          )}
        </div>
      )}

      {/* Leave Squad Button */}
      {!isOwner && (
        <button className="w-full py-3.5 rounded-2xl border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all">
          <LogOut className="w-4 h-4" />
          Leave Squad
        </button>
      )}
    </div>
  );
}
