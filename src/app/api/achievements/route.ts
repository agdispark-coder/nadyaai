import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AchievementRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  requirement: number;
  users: { unlockedAt: Date }[];
}

// Default achievements to seed
const DEFAULT_ACHIEVEMENTS = [
  { name: 'First Workout', description: 'Complete your first workout', icon: 'Dumbbell', category: 'workout', xpReward: 50, requirement: 1 },
  { name: '10 Workouts', description: 'Complete 10 workouts', icon: 'Trophy', category: 'workout', xpReward: 200, requirement: 10 },
  { name: '50 Workouts', description: 'Complete 50 workouts', icon: 'Flame', category: 'workout', xpReward: 500, requirement: 50 },
  { name: '100 Workouts', description: 'Complete 100 workouts', icon: 'Crown', category: 'workout', xpReward: 1000, requirement: 100 },
  { name: 'First Meal', description: 'Log your first meal', icon: 'Salad', category: 'nutrition', xpReward: 30, requirement: 1 },
  { name: '7 Day Streak', description: 'Maintain a 7-day activity streak', icon: 'Calendar', category: 'streak', xpReward: 300, requirement: 7 },
  { name: '30 Day Streak', description: 'Maintain a 30-day activity streak', icon: 'Zap', category: 'streak', xpReward: 1000, requirement: 30 },
  { name: 'First Friend', description: 'Add your first friend', icon: 'Users', category: 'social', xpReward: 50, requirement: 1 },
  { name: 'Squad Leader', description: 'Create your first squad', icon: 'Shield', category: 'social', xpReward: 100, requirement: 1 },
  { name: 'Level 5', description: 'Reach level 5', icon: 'Star', category: 'special', xpReward: 250, requirement: 5 },
  { name: 'Level 10', description: 'Reach level 10', icon: 'Sparkles', category: 'special', xpReward: 500, requirement: 10 },
  { name: 'Level 25', description: 'Reach level 25', icon: 'Gem', category: 'special', xpReward: 1500, requirement: 25 },
  { name: 'Early Bird', description: 'Log an activity before 7 AM', icon: 'Sun', category: 'special', xpReward: 75, requirement: 1 },
  { name: 'Night Owl', description: 'Log an activity after 10 PM', icon: 'Moon', category: 'special', xpReward: 75, requirement: 1 },
];

// Seed achievements if none exist in DB
async function ensureAchievementsSeeded() {
  const count = await prisma.achievement.count();
  if (count === 0) {
    await prisma.achievement.createMany({ data: DEFAULT_ACHIEVEMENTS });
  }
}

// GET /api/achievements
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureAchievementsSeeded();

    const achievements: AchievementRecord[] = await prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
      include: {
        users: {
          where: { userId: session.userId },
          select: { unlockedAt: true },
        },
      },
    });

    const totalAchievements = achievements.length;
    const unlockedCount = achievements.filter((a: AchievementRecord) => a.users.length > 0).length;

    const achievementsWithStatus = achievements.map((a: AchievementRecord) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      xpReward: a.xpReward,
      requirement: a.requirement,
      unlocked: a.users.length > 0,
      unlockedAt: a.users[0]?.unlockedAt || null,
    }));

    const grouped = achievementsWithStatus.reduce(
      (acc: Record<string, typeof achievementsWithStatus>, a) => {
        if (!acc[a.category]) acc[a.category] = [];
        acc[a.category].push(a);
        return acc;
      },
      {} as Record<string, typeof achievementsWithStatus>
    );

    return NextResponse.json({
      achievements: achievementsWithStatus,
      grouped,
      total: totalAchievements,
      unlocked: unlockedCount,
      progress: totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0,
    });
  } catch (error) {
    console.error('GET /api/achievements error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
