// ── Types ───────────────────────────────────────────────────────────────────

export type XpEventType =
  | 'edit'
  | 'flashcard'
  | 'daily-login'
  | 'streak-bonus'
  | 'note-create'
  | 'task-complete'
  | 'writing-progress'
  | 'achievement';

export interface XpEvent {
  type: XpEventType;
  amount: number;
  date: string;
  label?: string;
  filePath?: string;
}

type AchievementCondition =
  | { type: 'totalXp'; xp: number }
  | { type: 'level'; level: number }
  | { type: 'streak'; days: number }
  | { type: 'totalEdits'; count: number }
  | { type: 'totalCards'; count: number }
  | { type: 'totalNotes'; count: number }
  | { type: 'totalTasks'; count: number }
  | { type: 'totalWords'; count: number };

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: AchievementCondition;
}

export interface DailyChallenge {
  id: string;
  description: string;
  target: number;
  eventType: XpEventType;
  xpReward: number;
}

export interface DailyChallengeProgress {
  challengeId: string;
  date: string;
  current: number;
  completed: boolean;
}

export interface GamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalEdits: number;
  totalCardsReviewed: number;
  totalNotesCreated: number;
  totalTasksCompleted: number;
  totalWordsWritten: number;
  history: XpEvent[];
  unlockedAchievements: Record<string, number>;
  dailyChallengeProgress: DailyChallengeProgress[];
}

export interface TierInfo {
  index: number;
  name: string;
  minLevel: number;
  maxLevel: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const XP_PER_EDIT = 2;
export const XP_PER_CARD = 5;
export const XP_DAILY_LOGIN = 10;
export const XP_STREAK_BONUS = 15;
export const XP_PER_NOTE_CREATE = 8;
export const XP_PER_TASK_COMPLETE = 10;
export const XP_PER_100_WORDS = 5;
export const BASE_XP_PER_LEVEL = 100;
export const LEVEL_SCALE = 1.5;
export const MAX_LEVEL = 50;
export const MAX_HISTORY = 500;
export const STREAK_BONUS_THRESHOLD = 3;

export const DAILY_XP_CAPS: Partial<Record<XpEventType, number>> = {
  edit: 100,
  'note-create': 80,
  'writing-progress': 150,
  'task-complete': 120,
  flashcard: 100,
};

export const TIER_RANGES: { name: string; min: number; max: number }[] = [
  { name: 'Novice', min: 1, max: 5 },
  { name: 'Apprentice', min: 6, max: 10 },
  { name: 'Journeyman', min: 11, max: 15 },
  { name: 'Adept', min: 16, max: 20 },
  { name: 'Scholar', min: 21, max: 25 },
  { name: 'Expert', min: 26, max: 30 },
  { name: 'Master', min: 31, max: 35 },
  { name: 'Sage', min: 36, max: 40 },
  { name: 'Luminary', min: 41, max: 45 },
  { name: 'Paragon', min: 46, max: 50 },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-edit',
    name: 'First Steps',
    description: 'Make your first edit',
    icon: '✏️',
    xpReward: 10,
    condition: { type: 'totalEdits', count: 1 },
  },
  {
    id: 'edits-100',
    name: 'Centurion',
    description: 'Make 100 edits',
    icon: '📝',
    xpReward: 50,
    condition: { type: 'totalEdits', count: 100 },
  },
  {
    id: 'edits-1000',
    name: 'Prolific Editor',
    description: 'Make 1,000 edits',
    icon: '🖊️',
    xpReward: 200,
    condition: { type: 'totalEdits', count: 1000 },
  },
  {
    id: 'first-note',
    name: 'First Idea',
    description: 'Create your first note',
    icon: '💡',
    xpReward: 10,
    condition: { type: 'totalNotes', count: 1 },
  },
  {
    id: 'notes-50',
    name: 'Note Collector',
    description: 'Create 50 notes',
    icon: '📚',
    xpReward: 100,
    condition: { type: 'totalNotes', count: 50 },
  },
  {
    id: 'notes-200',
    name: 'Knowledge Architect',
    description: 'Create 200 notes',
    icon: '🏛️',
    xpReward: 300,
    condition: { type: 'totalNotes', count: 200 },
  },
  {
    id: 'first-card',
    name: 'Student',
    description: 'Review your first flashcard',
    icon: '🎴',
    xpReward: 10,
    condition: { type: 'totalCards', count: 1 },
  },
  {
    id: 'cards-100',
    name: 'Dedicated Learner',
    description: 'Review 100 flashcards',
    icon: '🧠',
    xpReward: 75,
    condition: { type: 'totalCards', count: 100 },
  },
  {
    id: 'cards-500',
    name: 'Memory Master',
    description: 'Review 500 flashcards',
    icon: '🎓',
    xpReward: 250,
    condition: { type: 'totalCards', count: 500 },
  },
  {
    id: 'first-task',
    name: 'Task Starter',
    description: 'Complete your first task',
    icon: '✅',
    xpReward: 10,
    condition: { type: 'totalTasks', count: 1 },
  },
  {
    id: 'tasks-50',
    name: 'Achiever',
    description: 'Complete 50 tasks',
    icon: '🏆',
    xpReward: 100,
    condition: { type: 'totalTasks', count: 50 },
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpReward: 50,
    condition: { type: 'streak', days: 7 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Champion',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    xpReward: 200,
    condition: { type: 'streak', days: 30 },
  },
  {
    id: 'level-10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    xpReward: 100,
    condition: { type: 'level', level: 10 },
  },
  {
    id: 'level-25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: '🌟',
    xpReward: 250,
    condition: { type: 'level', level: 25 },
  },
  {
    id: 'words-10k',
    name: 'Wordsmith',
    description: 'Write 10,000 words',
    icon: '✍️',
    xpReward: 150,
    condition: { type: 'totalWords', count: 10000 },
  },
  {
    id: 'words-50k',
    name: 'Author',
    description: 'Write 50,000 words',
    icon: '📖',
    xpReward: 500,
    condition: { type: 'totalWords', count: 50000 },
  },
];

export const DAILY_CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  { description: 'Write 500 words', target: 500, eventType: 'writing-progress', xpReward: 25 },
  { description: 'Review 10 flashcards', target: 10, eventType: 'flashcard', xpReward: 20 },
  { description: 'Create 3 notes', target: 3, eventType: 'note-create', xpReward: 20 },
  { description: 'Make 20 edits', target: 20, eventType: 'edit', xpReward: 15 },
  { description: 'Complete 5 tasks', target: 5, eventType: 'task-complete', xpReward: 25 },
  { description: 'Write 1,000 words', target: 1000, eventType: 'writing-progress', xpReward: 40 },
  { description: 'Review 20 flashcards', target: 20, eventType: 'flashcard', xpReward: 35 },
];

export const DEFAULT_STATE: GamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalEdits: 0,
  totalCardsReviewed: 0,
  totalNotesCreated: 0,
  totalTasksCompleted: 0,
  totalWordsWritten: 0,
  history: [],
  unlockedAchievements: {},
  dailyChallengeProgress: [],
};
