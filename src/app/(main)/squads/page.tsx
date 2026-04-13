'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  Users,
  Loader2,
  Plus,
  X,
  ArrowRight,
  UserPlus,
  MessageSquare,
  Shield,
  Globe,
  Lock,
  Sparkles,
} from 'lucide-react';

interface Squad {
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

export default function SquadsPage() {
  const router = useRouter();
  useAppStore();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [creating, setCreating] = useState(false);

  const fetchSquads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/squads');
      if (res.ok) {
        const json = await res.json();
        setSquads(json.squads || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch('/api/squads/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (res.ok) {
        setInviteCode('');
        fetchSquads();
      } else {
        const json = await res.json();
        setJoinError(json.error || 'Failed to join squad');
      }
    } catch {
      setJoinError('Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          isPublic: createForm.isPublic,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: '', description: '', isPublic: true });
        fetchSquads();
      } else {
        const json = await res.json();
        setJoinError(json.error || 'Failed to create squad');
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Squads</h1>
            <p className="text-xs text-gray-500">Train together, grow together</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* My Squads */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          My Squads
        </h2>

        {squads.length > 0 ? (
          <div className="space-y-3">
            {squads.map((squad, index) => (
              <div
                key={squad.id}
                onClick={() => router.push(`/squads/${squad.id}`)}
                className="glass-card rounded-2xl p-4 cursor-pointer hover:border-purple-500/20 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Squad Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {squad.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate">{squad.name}</h3>
                      {squad.isPublic ? (
                        <Globe className="w-3 h-3 text-gray-500 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-500 shrink-0" />
                      )}
                    </div>
                    {squad.description && (
                      <p className="text-xs text-gray-500 truncate">{squad.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500">{squad.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500">{squad.postsCount} posts</span>
                      </div>
                      {squad.role === 'owner' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 font-medium">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No squads yet</p>
            <p className="text-xs text-gray-600">
              Create a squad or join one with an invite code
            </p>
          </div>
        )}
      </div>

      {/* Join Squad */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5" />
          Join Squad
        </h2>

        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase());
              setJoinError('');
            }}
            placeholder="Enter invite code"
            maxLength={8}
            className="flex-1 px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors font-mono tracking-wider"
          />
          <button
            onClick={handleJoin}
            disabled={joining || !inviteCode.trim()}
            className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
          </button>
        </div>

        {joinError && (
          <p className="text-xs text-red-400 mt-2">{joinError}</p>
        )}
      </div>

      {/* Create Squad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Create Squad</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Squad Name *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Power Lifters United"
                  maxLength={50}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="What's your squad about?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Public/Private Toggle */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Visibility</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreateForm({ ...createForm, isPublic: true })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                      createForm.isPublic
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-gray-900/80 border border-gray-800 text-gray-500'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </button>
                  <button
                    onClick={() => setCreateForm({ ...createForm, isPublic: false })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                      !createForm.isPublic
                        ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                        : 'bg-gray-900/80 border border-gray-800 text-gray-500'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  {createForm.isPublic
                    ? 'Anyone can discover and join your squad'
                    : 'Only people with the invite code can join'}
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={!createForm.name.trim() || creating}
              className="w-full mt-6 py-3 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Create Squad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
