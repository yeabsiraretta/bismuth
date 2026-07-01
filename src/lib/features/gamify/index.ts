/**
 * Gamification feature module — coins, tasks, rewards, XP, quests, achievements.
 * Merges gamify + quest into a single feature module.
 * Public API barrel.
 */

// Types (gamify)
export type {
  TaskDifficulty,
  RecurrencePattern,
  Recurrence,
  TaskCounter,
  GamifiedTask,
  Reward,
  HistoryEntry,
  GamifyState,
  RewarderOccurrence,
  RewarderReward,
  AwardedReward,
  RewarderConfig,
} from './types';
export {
  DIFFICULTY_COINS,
  DIFFICULTY_META,
  DEFAULT_REWARDER_CONFIG,
  DEFAULT_OCCURRENCE_CHANCES,
} from './types';

// Stores (gamify)
export {
  gamifyCoins,
  gamifyTasks,
  gamifyRewards,
  gamifyHistory,
  pendingTasks,
  completedTasks,
  totalEarned,
  addGamifiedTask,
  completeGamifiedTask,
  incrementCounter,
  deleteGamifiedTask,
  purchaseReward,
  addReward,
  resetReward,
} from './stores/gamifyStore';

// Stores (quest)
export {
  questProfile,
  unlockedAchievements,
  recentActivity,
  awardXp,
  recordTaskCompleted,
  recordNoteCreated,
  recordWritingProgress,
  recordCalendarEventCompleted,
  recordDailyPresence,
  getXpSummary,
} from './stores/questStore';

// Stores (rewarder)
export {
  rewarderConfig,
  rewarderEnabled,
  updateRewarderConfig,
  resetRewarderConfig,
  getRewarderConfig,
  awardedRewards,
  recentAwards,
  awardedToday,
  pendingReward,
  acceptPendingReward,
  skipPendingReward,
  rollRewardForTask,
  clearAwardHistory,
} from './stores/rewarderStore';

// Services
export {
  loadGamifyState,
  saveGamifyState,
  processRecurrence,
  generateId,
} from './services/gamifyService';

export {
  parseRewardsFile,
  parseRewardLine,
  rollForReward,
  decrementInventory,
  generateSampleRewards,
} from './services/rewarderService';

// Components
export { default as TaskPanelUnified } from './components/TaskPanelUnified.svelte';
export { default as GamifiedTaskPanel } from './components/GamifiedTaskPanel.svelte';
export { default as QuestPanel } from './components/QuestPanel.svelte';
export { default as StatsView } from './components/StatsView.svelte';
export { default as TodayView } from './components/TodayView.svelte';
export { default as QuestsView } from './components/QuestsView.svelte';
export { default as RewardShop } from './components/RewardShop.svelte';
export { default as RewarderNotice } from './components/RewarderNotice.svelte';
