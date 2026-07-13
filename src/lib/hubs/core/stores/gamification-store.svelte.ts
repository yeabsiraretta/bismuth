import { GAMIFICATION_KEY } from '@/constants/storage-keys';
import { getSettings } from '@/hubs/core/stores/settings-store.svelte';

import {
  type AchievementDef,
  ACHIEVEMENTS,
  BASE_XP_PER_LEVEL,
  DAILY_CHALLENGE_TEMPLATES,
  DAILY_XP_CAPS,
  type DailyChallenge,
  type DailyChallengeProgress,
  DEFAULT_STATE,
  type GamificationState,
  LEVEL_SCALE,
  MAX_HISTORY,
  MAX_LEVEL,
  STREAK_BONUS_THRESHOLD,
  TIER_RANGES,
  type TierInfo,
  XP_DAILY_LOGIN,
  XP_PER_100_WORDS,
  XP_PER_CARD,
  XP_PER_EDIT,
  XP_PER_NOTE_CREATE,
  XP_PER_TASK_COMPLETE,
  XP_STREAK_BONUS,
  type XpEvent,
  type XpEventType,
} from './gamification-data';

export type {
  
  AchievementDef,
  DailyChallenge,
  DailyChallengeProgress,
  GamificationState,
  TierInfo,
  XpEvent,
  
} from './gamification-data';
export { ACHIEVEMENTS, TIER_RANGES } from './gamification-data';

function cfg() {
  const s = getSettings().gamification;
  return {
    xpPerEdit: s?.xpPerEdit ?? XP_PER_EDIT,
    xpPerCard: s?.xpPerCard ?? XP_PER_CARD,
    xpPerNoteCreate: s?.xpPerNoteCreate ?? XP_PER_NOTE_CREATE,
    xpPerTaskComplete: s?.xpPerTaskComplete ?? XP_PER_TASK_COMPLETE,
    xpPer100Words: s?.xpPer100Words ?? XP_PER_100_WORDS,
    dailyLoginXp: s?.dailyLoginXp ?? XP_DAILY_LOGIN,
    streakBonusXp: s?.streakBonusXp ?? XP_STREAK_BONUS,
    streakBonusThreshold: s?.streakBonusThreshold ?? STREAK_BONUS_THRESHOLD,
    enableAchievements: s?.enableAchievements ?? true,
    enableDailyChallenges: s?.enableDailyChallenges ?? true,
  };
}

// ── State ───────────────────────────────────────────────────────────────────

let state = $state<GamificationState>({ ...DEFAULT_STATE });

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function xpForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.min(Math.floor(BASE_XP_PER_LEVEL * Math.pow(LEVEL_SCALE, level - 1)), 5000);
}

export function xpToNextLevel(
  currentXp: number,
  currentLevel: number
): { needed: number; progress: number } {
  const needed = xpForLevel(currentLevel);
  if (!isFinite(needed)) return { needed: 0, progress: 100 };
  let accumulated = 0;
  for (let l = 1; l < currentLevel; l++) accumulated += xpForLevel(l);
  const intoLevel = currentXp - accumulated;
  const progress = Math.min(100, Math.round((intoLevel / needed) * 100));
  return { needed, progress };
}

function recalcLevel(xp: number): number {
  let level = 1;
  let acc = 0;
  while (level < MAX_LEVEL && acc + xpForLevel(level) <= xp) {
    acc += xpForLevel(level);
    level++;
  }
  return level;
}

export function getTierForLevel(level: number): TierInfo {
  const idx = TIER_RANGES.findIndex((r) => level >= r.min && level <= r.max);
  const i = idx >= 0 ? idx : TIER_RANGES.length - 1;
  const tier = TIER_RANGES[i];
  return { index: i, name: tier.name, minLevel: tier.min, maxLevel: tier.max };
}

function persist(): void {
  try {
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

function pushEvent(evt: XpEvent): void {
  state.history = [...state.history.slice(-(MAX_HISTORY - 1)), evt];
}

function updateStreak(): void {
  const today = todayStr();
  const yesterday = yesterdayStr();

  if (state.lastActiveDate === today) return;

  if (state.lastActiveDate === yesterday) {
    state.currentStreak++;
  } else {
    state.currentStreak = 1;
  }

  if (state.currentStreak > state.longestStreak) {
    state.longestStreak = state.currentStreak;
  }

  state.lastActiveDate = today;
}

function todayXpForType(eventType: XpEventType): number {
  const today = todayStr();
  return state.history
    .filter((e) => e.date === today && e.type === eventType)
    .reduce((sum, e) => sum + e.amount, 0);
}

function applyDailyCap(eventType: XpEventType, rawAmount: number): number {
  const cap = DAILY_XP_CAPS[eventType];
  if (cap === undefined) return rawAmount;
  const alreadyEarned = todayXpForType(eventType);
  const remaining = Math.max(0, cap - alreadyEarned);
  return Math.min(rawAmount, remaining);
}

// ── Achievements ────────────────────────────────────────────────────────────

export function checkAchievement(def: AchievementDef, s: GamificationState): boolean {
  const { condition } = def;
  switch (condition.type) {
    case 'totalXp':
      return s.xp >= condition.xp;
    case 'level':
      return s.level >= condition.level;
    case 'streak':
      return s.longestStreak >= condition.days;
    case 'totalEdits':
      return s.totalEdits >= condition.count;
    case 'totalCards':
      return s.totalCardsReviewed >= condition.count;
    case 'totalNotes':
      return s.totalNotesCreated >= condition.count;
    case 'totalTasks':
      return s.totalTasksCompleted >= condition.count;
    case 'totalWords':
      return s.totalWordsWritten >= condition.count;
  }
}

export function checkNewAchievements(s: GamificationState): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (def.id in s.unlockedAchievements) continue;
    if (checkAchievement(def, s)) {
      s.unlockedAchievements[def.id] = Date.now();
      unlocked.push(def);
    }
  }
  return unlocked;
}

function processAchievements(): AchievementDef[] {
  const newlyUnlocked = checkNewAchievements(state);
  for (const ach of newlyUnlocked) {
    state.xp += ach.xpReward;
    pushEvent({ type: 'achievement', amount: ach.xpReward, date: todayStr(), label: ach.name });
  }
  if (newlyUnlocked.length > 0) {
    state.level = recalcLevel(state.xp);
  }
  return newlyUnlocked;
}

// ── Daily Challenges ────────────────────────────────────────────────────────

export function getDailyChallenge(dateStr?: string): DailyChallenge {
  const d = dateStr ?? todayStr();
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = ((hash << 5) - hash + d.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % DAILY_CHALLENGE_TEMPLATES.length;
  const tmpl = DAILY_CHALLENGE_TEMPLATES[idx];
  return { ...tmpl, id: `daily-${d}` };
}

function getDailyChallengeProgress(): DailyChallengeProgress {
  const today = todayStr();
  const challenge = getDailyChallenge(today);
  const existing = state.dailyChallengeProgress.find(
    (p) => p.challengeId === challenge.id && p.date === today
  );
  if (existing) return existing;
  return { challengeId: challenge.id, date: today, current: 0, completed: false };
}

function ensureDailyChallengeProgress(): DailyChallengeProgress {
  const today = todayStr();
  const challenge = getDailyChallenge(today);
  const existing = state.dailyChallengeProgress.find(
    (p) => p.challengeId === challenge.id && p.date === today
  );
  if (existing) return existing;
  const fresh: DailyChallengeProgress = {
    challengeId: challenge.id,
    date: today,
    current: 0,
    completed: false,
  };
  state.dailyChallengeProgress = [
    ...state.dailyChallengeProgress.filter((p) => p.date === today),
    fresh,
  ];
  return fresh;
}

function advanceDailyChallenge(eventType: XpEventType, count: number): void {
  const today = todayStr();
  const challenge = getDailyChallenge(today);
  if (challenge.eventType !== eventType) return;

  const progress = ensureDailyChallengeProgress();
  if (progress.completed) return;

  progress.current += count;
  if (progress.current >= challenge.target) {
    progress.completed = true;
    state.xp += challenge.xpReward;
    pushEvent({
      type: 'achievement',
      amount: challenge.xpReward,
      date: today,
      label: `Daily: ${challenge.description}`,
    });
    state.level = recalcLevel(state.xp);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function initGamification(): void {
  try {
    const raw = localStorage.getItem(GAMIFICATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GamificationState>;
      state = { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    /* corrupt data */
  }

  // Daily login XP
  const today = todayStr();
  if (state.lastActiveDate !== today) {
    const c = cfg();
    updateStreak();
    state.xp += c.dailyLoginXp;
    pushEvent({ type: 'daily-login', amount: c.dailyLoginXp, date: today });

    if (state.currentStreak >= c.streakBonusThreshold) {
      state.xp += c.streakBonusXp;
      pushEvent({ type: 'streak-bonus', amount: c.streakBonusXp, date: today });
    }

    state.level = recalcLevel(state.xp);
    processAchievements();
    // Clean old daily challenge progress (keep only last 7 days)
    state.dailyChallengeProgress = state.dailyChallengeProgress.filter((p) => {
      const diff = (new Date(today).getTime() - new Date(p.date).getTime()) / 86400000;
      return diff < 7;
    });
    persist();
  }
}

export function awardEditXp(edits: number = 1): void {
  if (!getSettings().gamification?.gamificationEnabled) return;
  const c = cfg();
  const raw = edits * c.xpPerEdit;
  const amount = applyDailyCap('edit', raw);
  if (amount <= 0) return;
  state.xp += amount;
  state.totalEdits += edits;
  state.level = recalcLevel(state.xp);
  updateStreak();
  pushEvent({ type: 'edit', amount, date: todayStr() });
  if (c.enableDailyChallenges) advanceDailyChallenge('edit', edits);
  if (c.enableAchievements) processAchievements();
  persist();
}

export function awardFlashcardXp(cardsReviewed: number): void {
  if (!getSettings().gamification?.gamificationEnabled) return;
  const c = cfg();
  const raw = cardsReviewed * c.xpPerCard;
  const amount = applyDailyCap('flashcard', raw);
  if (amount <= 0) return;
  state.xp += amount;
  state.totalCardsReviewed += cardsReviewed;
  state.level = recalcLevel(state.xp);
  updateStreak();
  pushEvent({ type: 'flashcard', amount, date: todayStr() });
  if (c.enableDailyChallenges) advanceDailyChallenge('flashcard', cardsReviewed);
  if (c.enableAchievements) processAchievements();
  persist();
}

export function awardNoteCreateXp(label?: string, filePath?: string): void {
  if (!getSettings().gamification?.gamificationEnabled) return;
  const c = cfg();
  const amount = applyDailyCap('note-create', c.xpPerNoteCreate);
  if (amount <= 0) return;
  state.xp += amount;
  state.totalNotesCreated++;
  state.level = recalcLevel(state.xp);
  updateStreak();
  pushEvent({ type: 'note-create', amount, date: todayStr(), label, filePath });
  if (c.enableDailyChallenges) advanceDailyChallenge('note-create', 1);
  if (c.enableAchievements) processAchievements();
  persist();
}

export function awardTaskCompleteXp(label?: string): void {
  if (!getSettings().gamification?.gamificationEnabled) return;
  const c = cfg();
  const amount = applyDailyCap('task-complete', c.xpPerTaskComplete);
  if (amount <= 0) return;
  state.xp += amount;
  state.totalTasksCompleted++;
  state.level = recalcLevel(state.xp);
  updateStreak();
  pushEvent({ type: 'task-complete', amount, date: todayStr(), label });
  if (c.enableDailyChallenges) advanceDailyChallenge('task-complete', 1);
  if (c.enableAchievements) processAchievements();
  persist();
}

export function awardWritingXp(wordCount: number, label?: string, filePath?: string): void {
  if (!getSettings().gamification?.gamificationEnabled) return;
  if (wordCount <= 0) return;
  const c = cfg();
  const raw = Math.floor(wordCount / 100) * c.xpPer100Words;
  if (raw <= 0) return;
  const amount = applyDailyCap('writing-progress', raw);
  if (amount <= 0) return;
  state.xp += amount;
  state.totalWordsWritten += wordCount;
  state.level = recalcLevel(state.xp);
  updateStreak();
  pushEvent({ type: 'writing-progress', amount, date: todayStr(), label, filePath });
  if (c.enableDailyChallenges) advanceDailyChallenge('writing-progress', wordCount);
  if (c.enableAchievements) processAchievements();
  persist();
}

export function getGamification(): GamificationState {
  return state;
}

export function getTodayXp(): number {
  const today = todayStr();
  return state.history.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0);
}

export function getUnlockedAchievements(): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.id in state.unlockedAchievements);
}

export function getLockedAchievements(): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !(a.id in state.unlockedAchievements));
}

export function getTodayChallenge(): {
  challenge: DailyChallenge;
  progress: DailyChallengeProgress;
} {
  const challenge = getDailyChallenge();
  const progress = getDailyChallengeProgress();
  return { challenge, progress };
}

export function destroyGamification(): void {
  state = { ...DEFAULT_STATE };
}
