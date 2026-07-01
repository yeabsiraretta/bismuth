/**
 * Gamified Tasks types — coin rewards, difficulty levels, counters, recurrence.
 */

export type TaskDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';

/** Coin reward per difficulty level. */
export const DIFFICULTY_COINS: Record<TaskDifficulty, number> = {
  trivial: 1,
  easy: 3,
  medium: 5,
  hard: 10,
  epic: 25,
};

/** Difficulty display metadata. */
export const DIFFICULTY_META: Record<TaskDifficulty, { label: string; color: string }> = {
  trivial: { label: 'Trivial', color: 'var(--text-faint)' },
  easy: { label: 'Easy', color: 'var(--status-added)' },
  medium: { label: 'Medium', color: 'var(--interactive-accent)' },
  hard: { label: 'Hard', color: 'var(--status-warning)' },
  epic: { label: 'Epic', color: 'var(--text-error)' },
};

/** Recurrence pattern for repeating tasks. */
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Recurrence {
  pattern: RecurrencePattern;
  /** For custom: number of days between occurrences. */
  intervalDays?: number;
  /** Next occurrence date (ISO string). */
  nextDue: string;
}

/** A counter to break a task into smaller segments. */
export interface TaskCounter {
  current: number;
  target: number;
}

/** A gamified task with difficulty, counter, and recurrence. */
export interface GamifiedTask {
  id: string;
  text: string;
  difficulty: TaskDifficulty;
  completed: boolean;
  counter?: TaskCounter;
  recurrence?: Recurrence;
  createdAt: string;
  completedAt?: string;
}

/** A reward that can be purchased with coins. */
export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  purchased: boolean;
}

/** A history entry (earning or spending). */
export interface HistoryEntry {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: string;
}

/** Full gamification state shape. */
export interface GamifyState {
  coins: number;
  tasks: GamifiedTask[];
  rewards: Reward[];
  history: HistoryEntry[];
}

// ─── Rewarder types (Obsidian Rewarder-inspired) ──────────────────────────────

/** Occurrence level controlling how often a reward is given. */
export type RewarderOccurrence = 'common' | 'rare' | 'legendary';

/** Default chance (%) for each occurrence level. */
export const DEFAULT_OCCURRENCE_CHANCES: Record<RewarderOccurrence, number> = {
  common: 50,
  rare: 20,
  legendary: 5,
};

/** A reward parsed from the rewards markdown file. */
export interface RewarderReward {
  name: string;
  occurrence: RewarderOccurrence;
  /** Remaining inventory (null = unlimited). */
  inventory: number | null;
  /** Optional image URL. */
  imageUrl?: string;
  /** Original line number in the file (for inventory updates). */
  lineIndex: number;
}

/** An awarded reward entry. */
export interface AwardedReward {
  id: string;
  name: string;
  occurrence: RewarderOccurrence;
  imageUrl?: string;
  timestamp: string;
  taskText?: string;
  skipped: boolean;
}

/** Rewarder configuration. */
export interface RewarderConfig {
  enabled: boolean;
  rewardsFile: string;
  showPopup: boolean;
  saveToDaily: boolean;
  dailySectionHeading: string;
  saveTaskToDaily: boolean;
  taskSectionHeading: string;
  quoteMode: boolean;
  metaStart: string;
  metaEnd: string;
  occurrenceChances: Record<RewarderOccurrence, number>;
  occurrenceLabels: Record<RewarderOccurrence, string>;
}

export const DEFAULT_REWARDER_CONFIG: RewarderConfig = {
  enabled: true,
  rewardsFile: 'Rewards.md',
  showPopup: true,
  saveToDaily: false,
  dailySectionHeading: '## Rewards',
  saveTaskToDaily: false,
  taskSectionHeading: '## Completed Tasks',
  quoteMode: false,
  metaStart: '{',
  metaEnd: '}',
  occurrenceChances: { ...DEFAULT_OCCURRENCE_CHANCES },
  occurrenceLabels: { common: 'common', rare: 'rare', legendary: 'legendary' },
};
