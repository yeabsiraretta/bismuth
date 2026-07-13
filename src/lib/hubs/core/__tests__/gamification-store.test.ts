import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GamificationState } from '@/hubs/core/stores/gamification-store.svelte';
import {
  ACHIEVEMENTS,
  awardEditXp,
  awardFlashcardXp,
  awardNoteCreateXp,
  awardTaskCompleteXp,
  awardWritingXp,
  checkAchievement,
  checkNewAchievements,
  destroyGamification,
  getDailyChallenge,
  getGamification,
  getLockedAchievements,
  getTierForLevel,
  getTodayChallenge,
  getTodayXp,
  getUnlockedAchievements,
  initGamification,
  TIER_RANGES,
  xpForLevel,
  xpToNextLevel,
} from '@/hubs/core/stores/gamification-store.svelte';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
});

describe('gamification-store', () => {
  beforeEach(() => {
    for (const k in mockStorage) delete mockStorage[k];
    destroyGamification();
  });

  // ── XP & Levels ──────────────────────────────────────────────────────────

  describe('xpForLevel', () => {
    it('returns 100 for level 1', () => {
      expect(xpForLevel(1)).toBe(100);
    });

    it('scales exponentially', () => {
      expect(xpForLevel(2)).toBe(150);
      expect(xpForLevel(3)).toBeGreaterThan(xpForLevel(2));
    });

    it('caps XP requirement at 5000', () => {
      expect(xpForLevel(40)).toBeLessThanOrEqual(5000);
    });

    it('returns Infinity at max level', () => {
      expect(xpForLevel(50)).toBe(Infinity);
    });
  });

  describe('xpToNextLevel', () => {
    it('returns 0 progress for 0 xp at level 1', () => {
      const result = xpToNextLevel(0, 1);
      expect(result.progress).toBe(0);
      expect(result.needed).toBe(100);
    });

    it('returns 50 progress at half XP for level 1', () => {
      const result = xpToNextLevel(50, 1);
      expect(result.progress).toBe(50);
    });

    it('returns 100% progress at max level', () => {
      const result = xpToNextLevel(999999, 50);
      expect(result.progress).toBe(100);
      expect(result.needed).toBe(0);
    });
  });

  // ── Tier System ──────────────────────────────────────────────────────────

  describe('getTierForLevel', () => {
    it('returns Novice for level 1', () => {
      const tier = getTierForLevel(1);
      expect(tier.name).toBe('Novice');
      expect(tier.index).toBe(0);
    });

    it('returns Scholar for level 21', () => {
      const tier = getTierForLevel(21);
      expect(tier.name).toBe('Scholar');
      expect(tier.index).toBe(4);
    });

    it('returns Paragon for level 50', () => {
      const tier = getTierForLevel(50);
      expect(tier.name).toBe('Paragon');
      expect(tier.index).toBe(9);
    });

    it('has 10 tier ranges', () => {
      expect(TIER_RANGES).toHaveLength(10);
    });
  });

  // ── Init & State ─────────────────────────────────────────────────────────

  describe('initGamification', () => {
    it('initializes with default state', () => {
      initGamification();
      const state = getGamification();
      expect(state.xp).toBeGreaterThanOrEqual(10);
      expect(state.level).toBe(1);
      expect(state.currentStreak).toBe(1);
    });

    it('loads from localStorage with backward compat', () => {
      mockStorage['bismuth:gamification'] = JSON.stringify({
        xp: 500,
        level: 3,
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        totalEdits: 100,
        totalCardsReviewed: 50,
        history: [],
      });
      initGamification();
      const state = getGamification();
      expect(state.xp).toBe(500);
      expect(state.currentStreak).toBe(5);
      // New fields get defaults
      expect(state.totalNotesCreated).toBe(0);
      expect(state.totalTasksCompleted).toBe(0);
      expect(state.totalWordsWritten).toBe(0);
      expect(state.unlockedAchievements).toEqual({});
      expect(state.dailyChallengeProgress).toEqual([]);
    });
  });

  // ── Award Functions ──────────────────────────────────────────────────────

  describe('awardEditXp', () => {
    it('increments XP by 2 per edit (after first-edit achievement consumed)', () => {
      initGamification();
      awardEditXp(1); // triggers first-edit achievement
      const before = getGamification().xp;
      awardEditXp(1); // pure edit, no new achievement
      expect(getGamification().xp).toBe(before + 2);
    });

    it('increments totalEdits', () => {
      initGamification();
      const before = getGamification().totalEdits;
      awardEditXp(3);
      expect(getGamification().totalEdits).toBe(before + 3);
    });

    it('persists to localStorage', () => {
      initGamification();
      awardEditXp();
      expect(mockStorage['bismuth:gamification']).toBeDefined();
      const parsed = JSON.parse(mockStorage['bismuth:gamification']);
      expect(parsed.totalEdits).toBeGreaterThan(0);
    });

    it('respects daily XP cap of 100', () => {
      initGamification();
      // Fill up to the daily edit cap (100 XP = 50 edits)
      awardEditXp(50);
      const afterCap = getGamification().xp;
      // Additional edits beyond cap should give 0 edit XP
      awardEditXp(10);
      expect(getGamification().xp).toBe(afterCap);
    });
  });

  describe('awardFlashcardXp', () => {
    it('awards 5 XP per card (after first-card achievement consumed)', () => {
      initGamification();
      awardFlashcardXp(1); // triggers first-card achievement
      const before = getGamification().xp;
      awardFlashcardXp(4);
      expect(getGamification().xp).toBe(before + 20);
    });

    it('increments totalCardsReviewed', () => {
      initGamification();
      awardFlashcardXp(7);
      expect(getGamification().totalCardsReviewed).toBe(7);
    });
  });

  describe('awardNoteCreateXp', () => {
    it('awards 8 XP per note (after first-note achievement consumed)', () => {
      initGamification();
      awardNoteCreateXp('First'); // triggers first-note achievement
      const before = getGamification().xp;
      awardNoteCreateXp('Second');
      expect(getGamification().xp).toBe(before + 8);
    });

    it('awards 8 XP + 10 achievement XP on first note', () => {
      initGamification();
      const before = getGamification().xp;
      awardNoteCreateXp('First Note', '/test.md');
      // 8 note-create + 10 first-note achievement
      expect(getGamification().xp).toBe(before + 18);
    });

    it('increments totalNotesCreated', () => {
      initGamification();
      awardNoteCreateXp();
      awardNoteCreateXp();
      expect(getGamification().totalNotesCreated).toBe(2);
    });

    it('stores label and filePath in event history', () => {
      initGamification();
      awardNoteCreateXp('My Note', '/notes/my-note.md');
      const events = getGamification().history;
      const noteEvt = events.find((e) => e.type === 'note-create');
      expect(noteEvt).toBeDefined();
      expect(noteEvt!.label).toBe('My Note');
      expect(noteEvt!.filePath).toBe('/notes/my-note.md');
    });
  });

  describe('awardTaskCompleteXp', () => {
    it('awards 10 XP per task (after first-task achievement consumed)', () => {
      initGamification();
      awardTaskCompleteXp('First'); // triggers first-task achievement
      const before = getGamification().xp;
      awardTaskCompleteXp('Second');
      expect(getGamification().xp).toBe(before + 10);
    });

    it('awards 10 XP + 10 achievement XP on first task', () => {
      initGamification();
      const before = getGamification().xp;
      awardTaskCompleteXp('Fix bug');
      // 10 task-complete + 10 first-task achievement
      expect(getGamification().xp).toBe(before + 20);
    });

    it('increments totalTasksCompleted', () => {
      initGamification();
      awardTaskCompleteXp();
      awardTaskCompleteXp();
      awardTaskCompleteXp();
      expect(getGamification().totalTasksCompleted).toBe(3);
    });
  });

  describe('awardWritingXp', () => {
    it('awards 5 XP per 100 words', () => {
      initGamification();
      const before = getGamification().xp;
      awardWritingXp(250);
      // floor(250/100) * 5 = 10
      expect(getGamification().xp).toBe(before + 10);
    });

    it('awards nothing for < 100 words', () => {
      initGamification();
      const before = getGamification().xp;
      awardWritingXp(50);
      expect(getGamification().xp).toBe(before);
    });

    it('awards nothing for 0 or negative words', () => {
      initGamification();
      const before = getGamification().xp;
      awardWritingXp(0);
      awardWritingXp(-100);
      expect(getGamification().xp).toBe(before);
    });

    it('increments totalWordsWritten', () => {
      initGamification();
      awardWritingXp(500);
      expect(getGamification().totalWordsWritten).toBe(500);
    });
  });

  // ── Streaks ──────────────────────────────────────────────────────────────

  describe('streak logic', () => {
    it('starts streak at 1 on first init', () => {
      initGamification();
      expect(getGamification().currentStreak).toBe(1);
    });

    it('awards streak bonus when streak >= 3', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockStorage['bismuth:gamification'] = JSON.stringify({
        xp: 100,
        level: 1,
        currentStreak: 2,
        longestStreak: 2,
        lastActiveDate: yesterday.toISOString().slice(0, 10),
        totalEdits: 0,
        totalCardsReviewed: 0,
        totalNotesCreated: 0,
        totalTasksCompleted: 0,
        totalWordsWritten: 0,
        history: [],
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      });
      initGamification();
      expect(getGamification().currentStreak).toBe(3);
      expect(getGamification().xp).toBeGreaterThanOrEqual(100 + 10 + 15);
    });

    it('resets streak when gap > 1 day', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      mockStorage['bismuth:gamification'] = JSON.stringify({
        ...getGamification(),
        xp: 100,
        currentStreak: 10,
        longestStreak: 10,
        lastActiveDate: twoDaysAgo.toISOString().slice(0, 10),
        totalNotesCreated: 0,
        totalTasksCompleted: 0,
        totalWordsWritten: 0,
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      });
      initGamification();
      expect(getGamification().currentStreak).toBe(1);
      expect(getGamification().longestStreak).toBe(10);
    });
  });

  // ── Today XP ─────────────────────────────────────────────────────────────

  describe('getTodayXp', () => {
    it('returns XP earned today', () => {
      initGamification();
      const todayXp = getTodayXp();
      expect(todayXp).toBeGreaterThanOrEqual(10);
    });

    it('includes edit XP (and achievement XP)', () => {
      initGamification();
      const before = getTodayXp();
      awardEditXp(5);
      // 5*2=10 edit XP + 10 first-edit achievement XP
      expect(getTodayXp()).toBe(before + 20);
    });
  });

  // ── Achievements ─────────────────────────────────────────────────────────

  describe('achievements', () => {
    it('has 17 built-in achievement definitions', () => {
      expect(ACHIEVEMENTS.length).toBe(17);
    });

    it('checkAchievement returns true when condition met', () => {
      const def = ACHIEVEMENTS.find((a) => a.id === 'first-edit')!;
      const s: GamificationState = {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        totalEdits: 1,
        totalCardsReviewed: 0,
        totalNotesCreated: 0,
        totalTasksCompleted: 0,
        totalWordsWritten: 0,
        history: [],
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      };
      expect(checkAchievement(def, s)).toBe(true);
    });

    it('checkAchievement returns false when condition not met', () => {
      const def = ACHIEVEMENTS.find((a) => a.id === 'edits-100')!;
      const s: GamificationState = {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        totalEdits: 50,
        totalCardsReviewed: 0,
        totalNotesCreated: 0,
        totalTasksCompleted: 0,
        totalWordsWritten: 0,
        history: [],
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      };
      expect(checkAchievement(def, s)).toBe(false);
    });

    it('checkNewAchievements unlocks eligible and skips already-unlocked', () => {
      const s: GamificationState = {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        totalEdits: 1,
        totalCardsReviewed: 0,
        totalNotesCreated: 1,
        totalTasksCompleted: 0,
        totalWordsWritten: 0,
        history: [],
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      };
      const first = checkNewAchievements(s);
      expect(first.some((a) => a.id === 'first-edit')).toBe(true);
      expect(first.some((a) => a.id === 'first-note')).toBe(true);
      expect(s.unlockedAchievements['first-edit']).toBeDefined();
      // Call again — should not re-unlock
      const second = checkNewAchievements(s);
      expect(second.some((a) => a.id === 'first-edit')).toBe(false);
    });

    it('unlocks first-edit achievement after editing', () => {
      initGamification();
      awardEditXp(1);
      expect(getGamification().unlockedAchievements['first-edit']).toBeDefined();
    });

    it('achievement XP reward is added to total', () => {
      initGamification();
      const before = getGamification().xp;
      awardEditXp(1); // triggers first-edit (10 XP reward)
      const after = getGamification().xp;
      // edit XP (2) + achievement reward (10)
      expect(after - before).toBe(12);
    });

    it('getUnlockedAchievements / getLockedAchievements partition correctly', () => {
      initGamification();
      awardEditXp(1);
      const unlocked = getUnlockedAchievements();
      const locked = getLockedAchievements();
      expect(unlocked.length + locked.length).toBe(ACHIEVEMENTS.length);
      expect(unlocked.some((a) => a.id === 'first-edit')).toBe(true);
      expect(locked.some((a) => a.id === 'first-edit')).toBe(false);
    });

    it('checks all condition types', () => {
      const s: GamificationState = {
        xp: 10000,
        level: 25,
        currentStreak: 30,
        longestStreak: 30,
        lastActiveDate: '',
        totalEdits: 1000,
        totalCardsReviewed: 500,
        totalNotesCreated: 200,
        totalTasksCompleted: 50,
        totalWordsWritten: 50000,
        history: [],
        unlockedAchievements: {},
        dailyChallengeProgress: [],
      };
      // Every achievement should be unlockable with these stats
      const unlocked = checkNewAchievements(s);
      expect(unlocked.length).toBe(ACHIEVEMENTS.length);
    });
  });

  // ── Daily Challenges ─────────────────────────────────────────────────────

  describe('daily challenges', () => {
    it('getDailyChallenge returns a challenge with id based on date', () => {
      const ch = getDailyChallenge('2024-01-15');
      expect(ch.id).toBe('daily-2024-01-15');
      expect(ch.description).toBeDefined();
      expect(ch.target).toBeGreaterThan(0);
      expect(ch.xpReward).toBeGreaterThan(0);
    });

    it('same date always produces the same challenge', () => {
      const a = getDailyChallenge('2024-06-01');
      const b = getDailyChallenge('2024-06-01');
      expect(a.id).toBe(b.id);
      expect(a.description).toBe(b.description);
    });

    it('different dates may produce different challenges', () => {
      const dates = [
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-05',
        '2024-01-06',
        '2024-01-07',
      ];
      const ids = new Set(dates.map((d) => getDailyChallenge(d).description));
      // Should have some variety (at least 2 unique across 7 days)
      expect(ids.size).toBeGreaterThanOrEqual(2);
    });

    it('getTodayChallenge returns challenge and progress', () => {
      initGamification();
      const { challenge, progress } = getTodayChallenge();
      expect(challenge.id).toContain('daily-');
      expect(progress.current).toBe(0);
      expect(progress.completed).toBe(false);
    });
  });

  // ── Destroy ──────────────────────────────────────────────────────────────

  describe('destroyGamification', () => {
    it('resets state to defaults', () => {
      initGamification();
      awardEditXp(10);
      awardNoteCreateXp();
      awardTaskCompleteXp();
      destroyGamification();
      expect(getGamification().xp).toBe(0);
      expect(getGamification().totalEdits).toBe(0);
      expect(getGamification().totalNotesCreated).toBe(0);
      expect(getGamification().totalTasksCompleted).toBe(0);
      expect(getGamification().totalWordsWritten).toBe(0);
      expect(getGamification().unlockedAchievements).toEqual({});
    });
  });
});
