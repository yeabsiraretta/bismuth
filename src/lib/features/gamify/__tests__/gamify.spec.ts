/**
 * Unit tests for gamification: toggle behavior, XP increments, and level-up logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/utils/id', () => ({
  generateId: () => `test-id-${Math.random().toString(36).slice(2, 8)}`,
}));

vi.mock('@/stores/toast/toast', () => ({
  showToast: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
});

// Mock date-fns
vi.mock('date-fns', () => ({
  addDays: (date: Date, n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; },
  addWeeks: (date: Date, n: number) => { const d = new Date(date); d.setDate(d.getDate() + n * 7); return d; },
  addMonths: (date: Date, n: number) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; },
}));

import { featureFlags } from '@/stores/settings/features';
import {
  gamifyTasks,
  gamifyCoins,
  addGamifiedTask as _addGamifiedTask,
  completeGamifiedTask as _completeGamifiedTask,
  deleteGamifiedTask as _deleteGamifiedTask,
} from '../stores/gamifyStore';
import {
  questProfile,
  awardXp,
  recordTaskCompleted,
} from '../stores/questStore';
import { getLevelFromXp, cumulativeXpForLevel, XP_VALUES } from '@/types/data/quest';

describe('Gamification feature flag toggle', () => {
  beforeEach(() => {
    featureFlags.reset();
  });

  it('defaults gamification to disabled', () => {
    expect(get(featureFlags)['gamify']).toBe(false);
  });

  it('enables gamification when toggled', () => {
    featureFlags.toggle('gamify');
    expect(get(featureFlags)['gamify']).toBe(true);
  });

  it('disables gamification on second toggle', () => {
    featureFlags.toggle('gamify');
    featureFlags.toggle('gamify');
    expect(get(featureFlags)['gamify']).toBe(false);
  });

  it('persists gamification flag independently of other flags', () => {
    featureFlags.setFlag('gamify', true);
    featureFlags.setFlag('calendar', true);
    const flags = get(featureFlags);
    expect(flags['gamify']).toBe(true);
    expect(flags['calendar']).toBe(true);
    featureFlags.toggle('gamify');
    const after = get(featureFlags);
    expect(after['gamify']).toBe(false);
    expect(after['calendar']).toBe(true);
  });
});

describe('XP increment on task completion', () => {
  beforeEach(() => {
    gamifyTasks.set([]);
    gamifyCoins.set(0);
    questProfile.set({
      totalXp: 0,
      todayXp: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      streak: 0,
      lastActiveDate: '',
      wordCountToday: 0,
      wordCountPeak: 0,
      sessionBonusClaimed: false,
      tasksCompletedToday: 0,
      notesCreatedToday: 0,
      activityLog: [],
      achievements: [],
      activeProjects: [],
    });
  });

  it('awards XP when awardXp is called', () => {
    const before = get(questProfile).totalXp;
    awardXp('task_completed', 25, 'Test task');
    expect(get(questProfile).totalXp).toBe(before + 25);
  });

  it('accumulates todayXp correctly across multiple awards', () => {
    awardXp('task_completed', 25, 'Task 1');
    awardXp('task_completed', 50, 'Task 2');
    expect(get(questProfile).todayXp).toBe(75);
  });

  it('recordTaskCompleted awards XP for medium priority', () => {
    recordTaskCompleted('A task', 'medium');
    expect(get(questProfile).totalXp).toBe(XP_VALUES.task_completed);
  });

  it('recordTaskCompleted awards higher XP for high priority', () => {
    recordTaskCompleted('A high task', 'high');
    expect(get(questProfile).totalXp).toBe(XP_VALUES.task_completed_high);
  });

  it('recordTaskCompleted awards highest XP for critical priority', () => {
    recordTaskCompleted('A critical task', 'critical');
    expect(get(questProfile).totalXp).toBe(XP_VALUES.task_completed_critical);
  });

  it('increments tasksCompletedToday on recordTaskCompleted', () => {
    recordTaskCompleted('Task A', 'medium');
    recordTaskCompleted('Task B', 'medium');
    expect(get(questProfile).tasksCompletedToday).toBe(2);
  });

  it('logs activity entry on awardXp', () => {
    awardXp('note_created', 30, 'My note');
    const log = get(questProfile).activityLog;
    expect(log.length).toBeGreaterThan(0);
    const entry = log[log.length - 1];
    expect(entry.type).toBe('note_created');
    expect(entry.xp).toBe(30);
    expect(entry.label).toBe('My note');
  });
});

describe('Level-up logic', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(getLevelFromXp(0)).toBe(1);
  });

  it('advances to level 2 after crossing XP threshold', () => {
    const xpForLevel2 = cumulativeXpForLevel(2);
    expect(getLevelFromXp(xpForLevel2)).toBe(2);
  });

  it('stays at level 1 just below threshold', () => {
    const xpForLevel2 = cumulativeXpForLevel(2);
    expect(getLevelFromXp(xpForLevel2 - 1)).toBe(1);
  });

  it('advances multiple levels with sufficient XP', () => {
    const xpForLevel5 = cumulativeXpForLevel(5);
    expect(getLevelFromXp(xpForLevel5)).toBe(5);
  });

  it('caps at level 60', () => {
    expect(getLevelFromXp(99_999_999)).toBe(60);
  });

  it('unlocks achievement at level 5', () => {
    const xpForLevel5 = cumulativeXpForLevel(5);
    questProfile.set({
      totalXp: xpForLevel5,
      todayXp: xpForLevel5,
      todayDate: new Date().toISOString().slice(0, 10),
      streak: 0,
      lastActiveDate: '',
      wordCountToday: 0,
      wordCountPeak: 0,
      sessionBonusClaimed: false,
      tasksCompletedToday: 0,
      notesCreatedToday: 0,
      activityLog: [],
      achievements: [],
      activeProjects: [],
    });
    awardXp('task_completed', 1, 'trigger check');
    const profile = get(questProfile);
    expect(getLevelFromXp(profile.totalXp)).toBeGreaterThanOrEqual(5);
    expect(profile.achievements).toContain('level_5');
  });

  it('awardXp updates totalXp and triggers new achievements', () => {
    questProfile.set({
      totalXp: 0,
      todayXp: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      streak: 0,
      lastActiveDate: '',
      wordCountToday: 0,
      wordCountPeak: 0,
      sessionBonusClaimed: false,
      tasksCompletedToday: 0,
      notesCreatedToday: 0,
      activityLog: [],
      achievements: [],
      activeProjects: [],
    });
    const xpForLevel5 = cumulativeXpForLevel(5);
    awardXp('milestone', xpForLevel5 + 10, 'Big milestone');
    const profile = get(questProfile);
    expect(getLevelFromXp(profile.totalXp)).toBeGreaterThanOrEqual(5);
  });
});
