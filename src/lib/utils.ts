import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  return level;
}

export function getXPProgress(xp: number): { level: number; current: number; needed: number; percentage: number } {
  const level = getLevelFromXP(xp);
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += calculateXPForLevel(i);
  }
  const currentLevelXP = xp - totalXP;
  const neededXP = calculateXPForLevel(level);
  return {
    level,
    current: currentLevelXP,
    needed: neededXP,
    percentage: Math.floor((currentLevelXP / neededXP) * 100),
  };
}

// 7-tier referral commission percentages
export const REFERRAL_COMMISSIONS = [10, 5, 3, 2, 1.5, 1, 0.5];

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    color: 'from-gray-500 to-gray-600',
    features: [
      'Basic workout logging',
      '5 meals per day',
      '3 AI food scans per day',
      'Join 1 squad',
      'Basic analytics',
      'Community feed',
    ],
    maxSquads: 1,
    aiScans: 3,
    maxMeals: 5,
  },
  bronze: {
    name: 'Bronze',
    price: 29,
    color: 'from-amber-700 to-amber-800',
    features: [
      'Everything in Free',
      'Unlimited meal logging',
      '10 AI food scans per day',
      'Join 3 squads',
      'Advanced analytics',
      'Custom challenges',
      'Priority support',
    ],
    maxSquads: 3,
    aiScans: 10,
    maxMeals: null,
  },
  silver: {
    name: 'Silver',
    price: 59,
    color: 'from-gray-300 to-gray-400',
    features: [
      'Everything in Bronze',
      '50 AI food scans per day',
      'Join 10 squads',
      'Create squads',
      'Full analytics suite',
      'AI workout recommendations',
      'Referral program access',
      'Achievement badges',
    ],
    maxSquads: 10,
    aiScans: 50,
    maxMeals: null,
  },
  gold: {
    name: 'Gold',
    price: 99,
    color: 'from-yellow-400 to-yellow-600',
    features: [
      'Everything in Silver',
      'Unlimited AI food scans',
      'Unlimited squads',
      'Coach access',
      'Custom workout plans',
      'Nutrition planning',
      'Full referral earnings',
      'Exclusive challenges',
      'Early access features',
    ],
    maxSquads: null,
    aiScans: null,
    maxMeals: null,
  },
  platinum: {
    name: 'Platinum',
    price: 199,
    color: 'from-purple-400 to-indigo-600',
    features: [
      'Everything in Gold',
      '1-on-1 coaching sessions',
      'Personal nutritionist',
      'VIP community',
      'White-label features',
      'Maximum referral earnings',
      'Exclusive events',
      'Priority everything',
      'API access',
    ],
    maxSquads: null,
    aiScans: null,
    maxMeals: null,
  },
} as const;

export type TierName = keyof typeof SUBSCRIPTION_TIERS;
