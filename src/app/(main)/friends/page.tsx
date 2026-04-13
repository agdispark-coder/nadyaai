'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  Check,
  X,
  ChevronRight,
  Send,
} from 'lucide-react';

interface FriendUser {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  xp: number;
  level: number;
  streak: number;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: FriendUser;
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend: FriendUser;
}

export default function FriendsPage() {
  const { user } = useAppStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchSent, setSearchSent] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends');
      if (res.ok) {
        const json = await res.json();
        setFriends(json.friends || []);
        setPendingRequests(json.pendingRequests || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Search users
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/friends?search=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.users || []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  const handleSendRequest = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setSearchSent(friendId);
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/${requestId}/accept`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/friends?action=reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
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

  // IDs of current friends for filtering search
  const friendIds = new Set(friends.map((f) => f.friend.id));
  const requestSenderIds = new Set(pendingRequests.map((r) => r.sender.id));

  const filteredSearch = searchResults.filter(
    (u) => u.id !== user?.id && !friendIds.has(u.id) && !requestSenderIds.has(u.id)
  );

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Friends</h1>
            <p className="text-xs text-gray-500">{friends.length} friends</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchSent(null);
          }}
          placeholder="Search users by username..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card border border-white/5 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-purple-500" />
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && filteredSearch.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-down">
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Search Results</span>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
            {filteredSearch.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-300 shrink-0">
                  {getInitials(u.name, u.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {u.name || u.username}
                  </p>
                  <p className="text-[10px] text-gray-500">@{u.username} · Lvl {u.level}</p>
                </div>
                {searchSent === u.id ? (
                  <span className="text-[10px] text-green-400 font-medium">Sent</span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(u.id)}
                    disabled={actionLoading === u.id}
                    className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {actionLoading === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery.trim() && !searching && filteredSearch.length === 0 && (
        <div className="glass-card rounded-2xl p-6 text-center animate-fade-in">
          <p className="text-xs text-gray-500">No users found for &quot;{searchQuery}&quot;</p>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            Requests
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
              {pendingRequests.length}
            </span>
          </h2>

          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="glass-card rounded-2xl p-3 flex items-center gap-3 animate-slide-up"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-300 shrink-0">
                  {getInitials(request.sender.name, request.sender.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {request.sender.name || request.sender.username}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    @{request.sender.username} · Lvl {request.sender.level}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={actionLoading === request.id}
                    className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === request.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-green-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={actionLoading === request.id}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Friends
        </h2>

        {friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map((friendship, index) => (
              <div
                key={friendship.id}
                className="glass-card rounded-2xl p-3 flex items-center gap-3 animate-slide-up cursor-pointer hover:border-purple-500/20 transition-all"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-300">
                    {getInitials(friendship.friend.name, friendship.friend.username)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#030712]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {friendship.friend.name || friendship.friend.username}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-medium">
                      Lvl {friendship.friend.level}
                    </span>
                    {friendship.friend.streak > 0 && (
                      <span className="text-[10px] text-orange-400">🔥 {friendship.friend.streak}d</span>
                    )}
                  </div>
                </div>

                {/* View Profile */}
                <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No friends yet</p>
            <p className="text-xs text-gray-600">
              Search for users above to add friends
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
