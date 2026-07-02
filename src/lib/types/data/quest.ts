/**
 * Gamification types — XP, levels, tiers, achievements, and activity catalog.
 * Integrated with Bismuth's task and calendar systems.
 */

export interface QuestProfile {
  totalXp: number;
  todayXp: number;
  todayDate: string;
  streak: number;
  lastActiveDate: string;
  wordCountToday: number;
  wordCountPeak: number;
  sessionBonusClaimed: boolean;
  tasksCompletedToday: number;
  notesCreatedToday: number;
  activityLog: ActivityEntry[];
  achievements: string[];
  activeProjects: ProjectProgress[];
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  xp: number;
  label: string;
  timestamp: string;
}

export type ActivityType =
  | 'task_completed'
  | 'task_completed_high'
  | 'note_created'
  | 'note_developed'
  | 'writing_progress'
  | 'writing_session'
  | 'daily_presence'
  | 'streak_bonus'
  | 'calendar_event'
  | 'milestone'
  | 'manual';

export interface ProjectProgress {
  name: string;
  milestones: MilestoneEntry[];
}

export interface MilestoneEntry {
  id: string;
  label: string;
  xp: number;
  completed: boolean;
  completedAt: string | null;
}

/** Tier definition — 12 tiers, levels 1–60 */
export interface Tier {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  icon: string;
}

export const TIERS: Tier[] = [
  { id: 1, name: 'Dormant', minLevel: 1, maxLevel: 5, icon: 'circle' },
  { id: 2, name: 'Stirring', minLevel: 6, maxLevel: 10, icon: 'activity' },
  { id: 3, name: 'Kindling', minLevel: 11, maxLevel: 15, icon: 'zap' },
  { id: 4, name: 'Breaking', minLevel: 16, maxLevel: 20, icon: 'trending-up' },
  { id: 5, name: 'Wisp', minLevel: 21, maxLevel: 25, icon: 'star' },
  { id: 6, name: 'Flicker', minLevel: 26, maxLevel: 30, icon: 'star' },
  { id: 7, name: 'Blaze', minLevel: 31, maxLevel: 35, icon: 'sun' },
  { id: 8, name: 'Inferno', minLevel: 36, maxLevel: 40, icon: 'sun' },
  { id: 9, name: 'Drake', minLevel: 41, maxLevel: 45, icon: 'award' },
  { id: 10, name: 'Wyrm', minLevel: 46, maxLevel: 50, icon: 'award' },
  { id: 11, name: 'Dragon', minLevel: 51, maxLevel: 55, icon: 'shield' },
  { id: 12, name: 'Nova', minLevel: 56, maxLevel: 60, icon: 'crown' },
];

/** XP required for a given level (1-indexed). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 20) return level * 300;
  return 6000;
}

/** Calculate cumulative XP required to reach a level. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) total += xpForLevel(i);
  return total;
}

/** Get current level from total XP. */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (level < 60) {
    const needed = xpForLevel(level + 1);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return level;
}

/** Get the tier for a given level. */
export function getTierForLevel(level: number): Tier {
  return TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) || TIERS[0];
}

/** XP values for different activities */
export const XP_VALUES = {
  task_completed: 25,
  task_completed_high: 50,
  task_completed_critical: 75,
  note_created: 30,
  note_developed: 10,
  writing_per_100_words: 20,
  writing_session_bonus: 50,
  writing_session_threshold: 500,
  daily_presence: 5,
  streak_bonus_per_day: 2,
  calendar_event_completed: 15,
  milestone_small: 50,
  milestone_medium: 100,
  milestone_large: 200,
} as const;

/** Achievement definitions */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (profile: QuestProfile) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // XP milestones
  {
    id: 'xp_100',
    name: 'Getting Started',
    description: 'Earn 100 XP',
    icon: 'target',
    condition: (p) => p.totalXp >= 100,
  },
  {
    id: 'xp_500',
    name: 'Getting Warmed Up',
    description: 'Earn 500 XP',
    icon: 'zap',
    condition: (p) => p.totalXp >= 500,
  },
  {
    id: 'xp_2000',
    name: 'In the Zone',
    description: 'Earn 2,000 XP',
    icon: 'zap',
    condition: (p) => p.totalXp >= 2000,
  },
  {
    id: 'xp_5000',
    name: 'Veteran',
    description: 'Earn 5,000 XP',
    icon: 'award',
    condition: (p) => p.totalXp >= 5000,
  },
  {
    id: 'xp_10000',
    name: 'Established',
    description: 'Earn 10,000 XP',
    icon: 'star',
    condition: (p) => p.totalXp >= 10000,
  },
  {
    id: 'xp_25000',
    name: 'Distinguished',
    description: 'Earn 25,000 XP',
    icon: 'shield',
    condition: (p) => p.totalXp >= 25000,
  },
  {
    id: 'xp_50000',
    name: 'Eminent',
    description: 'Earn 50,000 XP',
    icon: 'crown',
    condition: (p) => p.totalXp >= 50000,
  },

  // Activity counts
  {
    id: 'tasks_10',
    name: 'Task Slayer',
    description: 'Complete 10 tasks',
    icon: 'check-square',
    condition: (p) => countActivities(p, 'task_completed') >= 10,
  },
  {
    id: 'tasks_50',
    name: 'Completionist',
    description: 'Complete 50 tasks',
    icon: 'award',
    condition: (p) => countActivities(p, 'task_completed') >= 50,
  },
  {
    id: 'tasks_200',
    name: 'Relentless',
    description: 'Complete 200 tasks',
    icon: 'trending-up',
    condition: (p) => countActivities(p, 'task_completed') >= 200,
  },
  {
    id: 'notes_10',
    name: 'First Ideas',
    description: 'Create 10 notes',
    icon: 'file-text',
    condition: (p) => countActivities(p, 'note_created') >= 10,
  },
  {
    id: 'notes_50',
    name: 'Zettelkasten',
    description: 'Create 50 notes',
    icon: 'layers',
    condition: (p) => countActivities(p, 'note_created') >= 50,
  },
  {
    id: 'notes_200',
    name: 'Grand Archive',
    description: 'Create 200 notes',
    icon: 'book',
    condition: (p) => countActivities(p, 'note_created') >= 200,
  },
  {
    id: 'writing_5k',
    name: 'Wordsmith',
    description: 'Write 5,000 words',
    icon: 'edit-3',
    condition: (p) => p.wordCountPeak >= 5000,
  },
  {
    id: 'writing_25k',
    name: 'Marathon Writer',
    description: 'Write 25,000 words',
    icon: 'edit-3',
    condition: (p) => p.wordCountPeak >= 25000,
  },

  // Streaks
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: '3-day streak',
    icon: 'activity',
    condition: (p) => p.streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day streak',
    icon: 'star',
    condition: (p) => p.streak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day streak',
    icon: 'shield',
    condition: (p) => p.streak >= 30,
  },
  {
    id: 'streak_100',
    name: 'Centurion',
    description: '100-day streak',
    icon: 'crown',
    condition: (p) => p.streak >= 100,
  },

  // First actions
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: 'play',
    condition: (p) => countActivities(p, 'task_completed') >= 1,
  },
  {
    id: 'first_note',
    name: 'First Idea',
    description: 'Create your first note',
    icon: 'file-plus',
    condition: (p) => countActivities(p, 'note_created') >= 1,
  },
  {
    id: 'first_milestone',
    name: 'Milestone Unlocked',
    description: 'Complete a milestone',
    icon: 'flag',
    condition: (p) => countActivities(p, 'milestone') >= 1,
  },
  {
    id: 'first_session',
    name: 'Deep Focus',
    description: 'Earn a writing session bonus',
    icon: 'eye',
    condition: (p) => countActivities(p, 'writing_session') >= 1,
  },

  // Level-based
  {
    id: 'level_5',
    name: 'Awakened',
    description: 'Reach Level 5',
    icon: 'activity',
    condition: (p) => getLevelFromXp(p.totalXp) >= 5,
  },
  {
    id: 'level_10',
    name: 'Kindled',
    description: 'Reach Level 10',
    icon: 'zap',
    condition: (p) => getLevelFromXp(p.totalXp) >= 10,
  },
  {
    id: 'level_20',
    name: 'Risen',
    description: 'Reach Level 20',
    icon: 'trending-up',
    condition: (p) => getLevelFromXp(p.totalXp) >= 20,
  },
  {
    id: 'level_30',
    name: 'Luminary',
    description: 'Reach Level 30',
    icon: 'sun',
    condition: (p) => getLevelFromXp(p.totalXp) >= 30,
  },
  {
    id: 'level_50',
    name: 'Dragon',
    description: 'Reach Level 50',
    icon: 'shield',
    condition: (p) => getLevelFromXp(p.totalXp) >= 50,
  },
  {
    id: 'level_60',
    name: 'Nova',
    description: 'Reach Level 60',
    icon: 'crown',
    condition: (p) => getLevelFromXp(p.totalXp) >= 60,
  },
];

function countActivities(profile: QuestProfile, type: ActivityType): number {
  return profile.activityLog.filter((a) => a.type === type).length;
}
