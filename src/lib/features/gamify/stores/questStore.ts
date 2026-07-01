/**
 * Quest store — XP, levels, streaks, achievements, and activity tracking.
 * Persists to localStorage. Integrates with task and calendar stores.
 */
import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import { generateId } from '@/utils/id';
import { showToast } from '@/stores/toast/toast';
import {
  type QuestProfile,
  type ActivityEntry,
  type ActivityType,
  getLevelFromXp,
  getTierForLevel,
  cumulativeXpForLevel,
  ACHIEVEMENTS,
  XP_VALUES,
} from '@/types/data/quest';

const STORAGE_KEY = 'bismuth-quest-profile';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultProfile(): QuestProfile {
  return {
    totalXp: 0,
    todayXp: 0,
    todayDate: todayStr(),
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
  };
}

function loadProfile(): QuestProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProfile();
    const parsed = JSON.parse(stored) as QuestProfile;
    // Reset daily counters if date changed
    if (parsed.todayDate !== todayStr()) {
      parsed.todayXp = 0;
      parsed.todayDate = todayStr();
      parsed.wordCountToday = 0;
      parsed.sessionBonusClaimed = false;
      parsed.tasksCompletedToday = 0;
      parsed.notesCreatedToday = 0;
    }
    return parsed;
  } catch {
    return defaultProfile();
  }
}

/** The reactive quest profile store */
export const questProfile = writable<QuestProfile>(loadProfile());

/** Derived: current level */
export const questLevel = derived(questProfile, ($p) => getLevelFromXp($p.totalXp));

/** Derived: current tier */
export const questTier = derived(questLevel, ($level) => getTierForLevel($level));

/** Derived: XP progress within current level */
export const questProgress = derived(questProfile, ($p) => {
  const level = getLevelFromXp($p.totalXp);
  const currentLevelXp = cumulativeXpForLevel(level);
  const nextLevelXp = cumulativeXpForLevel(level + 1);
  const xpInLevel = $p.totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return { xpInLevel, xpNeeded, percent: xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100 };
});

/** Derived: unlocked achievement IDs */
export const unlockedAchievements = derived(questProfile, ($p) => {
  return ACHIEVEMENTS.filter(a => a.condition($p)).map(a => a.id);
});

/** Derived: recent activity (last 20 entries) */
export const recentActivity = derived(questProfile, ($p) => {
  return [...$p.activityLog].reverse().slice(0, 20);
});

/** Award XP and log an activity */
export function awardXp(type: ActivityType, xp: number, label: string): void {
  questProfile.update(p => {
    const prevLevel = getLevelFromXp(p.totalXp);
    const entry: ActivityEntry = {
      id: generateId(),
      type,
      xp,
      label,
      timestamp: new Date().toISOString(),
    };

    const updated: QuestProfile = {
      ...p,
      totalXp: p.totalXp + xp,
      todayXp: p.todayXp + xp,
      todayDate: todayStr(),
      activityLog: [...p.activityLog.slice(-499), entry],
    };

    const newLevel = getLevelFromXp(updated.totalXp);
    if (newLevel > prevLevel) {
      const tier = getTierForLevel(newLevel);
      showToast(`Level up! You reached level ${newLevel} (${tier})`, 'success', 5000);
      log.info('Level up', { level: newLevel, tier });
    }

    // Check for new achievements
    const newAchievements = ACHIEVEMENTS
      .filter(a => a.condition(updated) && !updated.achievements.includes(a.id))
      .map(a => a.id);

    if (newAchievements.length > 0) {
      updated.achievements = [...updated.achievements, ...newAchievements];
      log.info('Achievements unlocked', { ids: newAchievements });
    }

    return updated;
  });
}

/** Record daily presence and update streak */
export function recordDailyPresence(): void {
  questProfile.update(p => {
    const today = todayStr();
    if (p.lastActiveDate === today) return p;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const newStreak = p.lastActiveDate === yesterdayStr ? p.streak + 1 : 1;
    const streakBonus = newStreak > 1 ? XP_VALUES.streak_bonus_per_day * newStreak : 0;
    const totalBonus = XP_VALUES.daily_presence + streakBonus;

    const updated: QuestProfile = {
      ...p,
      lastActiveDate: today,
      streak: newStreak,
      totalXp: p.totalXp + totalBonus,
      todayXp: (p.todayDate === today ? p.todayXp : 0) + totalBonus,
      todayDate: today,
    };

    if (streakBonus > 0) {
      log.info('Streak bonus', { streak: newStreak, bonus: streakBonus });
    }

    return updated;
  });
}

/** Track writing progress and award XP */
export function recordWritingProgress(wordCount: number): void {
  questProfile.update(p => {
    const today = todayStr();
    const newDayTotal = (p.todayDate === today ? p.wordCountToday : 0) + wordCount;
    let xpGained = 0;

    // Per 100 words
    const previousHundreds = Math.floor((p.todayDate === today ? p.wordCountToday : 0) / 100);
    const newHundreds = Math.floor(newDayTotal / 100);
    if (newHundreds > previousHundreds) {
      xpGained += (newHundreds - previousHundreds) * XP_VALUES.writing_per_100_words;
    }

    // Session bonus
    let sessionClaimed = p.todayDate === today ? p.sessionBonusClaimed : false;
    if (!sessionClaimed && newDayTotal >= XP_VALUES.writing_session_threshold) {
      xpGained += XP_VALUES.writing_session_bonus;
      sessionClaimed = true;
    }

    const updated: QuestProfile = {
      ...p,
      todayDate: today,
      wordCountToday: newDayTotal,
      wordCountPeak: Math.max(p.wordCountPeak, newDayTotal),
      sessionBonusClaimed: sessionClaimed,
      totalXp: p.totalXp + xpGained,
      todayXp: (p.todayDate === today ? p.todayXp : 0) + xpGained,
    };

    if (xpGained > 0) {
      updated.activityLog = [
        ...updated.activityLog.slice(-499),
        {
          id: `${Date.now()}-wrt`,
          type: 'writing_progress' as ActivityType,
          xp: xpGained,
          label: `+${wordCount} words`,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    return updated;
  });
}

/** Record a task completion — called from task store integration */
export function recordTaskCompleted(taskText: string, priority: string): void {
  const xp = priority === 'critical'
    ? XP_VALUES.task_completed_critical
    : priority === 'high'
      ? XP_VALUES.task_completed_high
      : XP_VALUES.task_completed;

  questProfile.update(p => {
    const today = todayStr();
    return {
      ...p,
      tasksCompletedToday: (p.todayDate === today ? p.tasksCompletedToday : 0) + 1,
      todayDate: today,
    };
  });

  awardXp('task_completed', xp, taskText);
}

/** Record a note creation */
export function recordNoteCreated(title: string): void {
  let noteXp = 30;
  questProfile.update(p => {
    const today = todayStr();
    const count = (p.todayDate === today ? p.notesCreatedToday : 0) + 1;
    // Diminishing returns: 30 for first 10, 15 for next 20, 5 after
    noteXp = count <= 10 ? 30 : count <= 30 ? 15 : 5;
    return {
      ...p,
      notesCreatedToday: count,
      todayDate: today,
    };
  });

  awardXp('note_created', noteXp, title);
}

/** Record a calendar event completion */
export function recordCalendarEventCompleted(title: string): void {
  awardXp('calendar_event', XP_VALUES.calendar_event_completed, title);
}

/** Record a milestone completion */
export function completeMilestone(projectName: string, milestoneLabel: string, xp: number): void {
  questProfile.update(p => {
    const projects = [...p.activeProjects];
    const proj = projects.find(pr => pr.name === projectName);
    if (proj) {
      const ms = proj.milestones.find(m => m.label === milestoneLabel);
      if (ms && !ms.completed) {
        ms.completed = true;
        ms.completedAt = new Date().toISOString();
      }
    }
    return { ...p, activeProjects: projects };
  });

  awardXp('milestone', xp, `${projectName}: ${milestoneLabel}`);
}

/** Get an XP summary for display */
export function getXpSummary(): { level: number; totalXp: number; todayXp: number; streak: number } {
  let result = { level: 1, totalXp: 0, todayXp: 0, streak: 0 };
  questProfile.subscribe(p => {
    result = {
      level: getLevelFromXp(p.totalXp),
      totalXp: p.totalXp,
      todayXp: p.todayXp,
      streak: p.streak,
    };
  })();
  return result;
}

/** Persist profile to localStorage on change */
questProfile.subscribe(profile => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) { log.warn('Failed to persist quest profile to localStorage', { error: String(e) }); }
});
