import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  subscriptionTier: string;
  onboardingCompleted: boolean;
}

interface AppState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({ user: null, token: null, isLoading: false });
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/login';
      },
    }),
    {
      name: 'nadya-ai-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
