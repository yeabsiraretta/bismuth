/**
 * Rewarder store — config, awarded rewards, and task-completion hook.
 *
 * When a task is completed, the rewarder rolls for a random reward
 * from the user's rewards file, optionally shows a popup/notice,
 * and can log to the daily note.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { showToast } from '@/stores/toast/toast';
import type { RewarderConfig, AwardedReward } from '../types';
import { DEFAULT_REWARDER_CONFIG } from '../types';
import { parseRewardsFile, rollForReward, decrementInventory } from '../services/rewarderService';
import { generateId } from '../services/gamifyService';

const CONFIG_KEY = 'bismuth:rewarder-config';
const HISTORY_KEY = 'bismuth:rewarder-history';

// ─── Config ────────────────────────────────────────────────────────────────────

function loadConfig(): RewarderConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_REWARDER_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* use defaults */
  }
  return { ...DEFAULT_REWARDER_CONFIG };
}

function persistConfig(config: RewarderConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    log.warn('rewarder: config persist failed', { error: String(e) });
  }
}

const configStore = writable<RewarderConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const rewarderConfig = derived(configStore, ($c) => $c);
export const rewarderEnabled = derived(configStore, ($c) => $c.enabled);

export function updateRewarderConfig(partial: Partial<RewarderConfig>): void {
  configStore.update((c) => ({ ...c, ...partial }));
}

export function resetRewarderConfig(): void {
  configStore.set({ ...DEFAULT_REWARDER_CONFIG });
}

export function getRewarderConfig(): RewarderConfig {
  return get(configStore);
}

// ─── Award history ─────────────────────────────────────────────────────────────

function loadHistory(): AwardedReward[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return [];
}

function persistHistory(history: AwardedReward[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    log.warn('rewarder: history persist failed', { error: String(e) });
  }
}

export const awardedRewards = writable<AwardedReward[]>(loadHistory());
awardedRewards.subscribe(persistHistory);

export const recentAwards = derived(awardedRewards, ($h) => [...$h].reverse().slice(0, 20));

export const awardedToday = derived(awardedRewards, ($h) => {
  const today = new Date().toISOString().slice(0, 10);
  return $h.filter((a) => a.timestamp.startsWith(today) && !a.skipped);
});

// ─── Pending reward (for popup) ────────────────────────────────────────────────

export const pendingReward = writable<AwardedReward | null>(null);

/** Accept the currently pending reward. */
export function acceptPendingReward(): void {
  pendingReward.set(null);
}

/** Skip the currently pending reward (don't count inventory). */
export function skipPendingReward(): void {
  const reward = get(pendingReward);
  if (reward) {
    awardedRewards.update((h) => h.map((a) => (a.id === reward.id ? { ...a, skipped: true } : a)));
    // Note: inventory was already decremented in rollRewardForTask.
    // We could restore it here, but keep it simple — skipped just marks it.
  }
  pendingReward.set(null);
}

// ─── Core: roll reward on task completion ──────────────────────────────────────

/**
 * Called when a task checkbox is completed.
 * Reads the rewards file, rolls for a reward, and handles the result.
 *
 * @param taskText    The text of the completed task
 * @param readFile    Async function to read a vault file by path
 * @param writeFile   Async function to write content to a vault file
 * @param appendToDaily Async function to append text to today's daily note section
 */
export async function rollRewardForTask(
  taskText: string,
  readFile: (path: string) => Promise<string>,
  writeFile?: (path: string, content: string) => Promise<void>,
  appendToDaily?: (section: string, text: string) => Promise<void>
): Promise<void> {
  const config = get(configStore);
  if (!config.enabled) return;

  let fileContent: string;
  try {
    fileContent = await readFile(config.rewardsFile);
  } catch {
    log.debug('rewarder: rewards file not found', { path: config.rewardsFile });
    return;
  }

  const rewards = parseRewardsFile(fileContent, config);
  if (rewards.length === 0) return;

  const winner = rollForReward(rewards, config.occurrenceChances);
  if (!winner) return;

  // Create awarded entry
  const awarded: AwardedReward = {
    id: generateId(),
    name: winner.name,
    occurrence: winner.occurrence,
    imageUrl: winner.imageUrl,
    timestamp: new Date().toISOString(),
    taskText,
    skipped: false,
  };

  awardedRewards.update((h) => [...h, awarded]);

  // Decrement inventory in the file
  if (winner.inventory !== null && writeFile) {
    const updated = decrementInventory(fileContent, winner, config.metaStart, config.metaEnd);
    if (updated) {
      try {
        await writeFile(config.rewardsFile, updated);
      } catch (e) {
        log.warn('rewarder: failed to update inventory', { error: String(e) });
      }
    }
  }

  // Show notification
  if (config.showPopup) {
    pendingReward.set(awarded);
  } else {
    const prefix = config.quoteMode ? '' : '🎉 Reward: ';
    showToast(`${prefix}${winner.name}`, 'success', 5000);
  }

  // Save to daily note
  if (config.saveToDaily && appendToDaily) {
    const line = config.quoteMode
      ? `- ${winner.name}`
      : `- 🎁 ${winner.name} _(${winner.occurrence})_`;
    try {
      await appendToDaily(config.dailySectionHeading, line);
    } catch (e) {
      log.warn('rewarder: failed to write daily note reward', { error: String(e) });
    }
  }

  if (config.saveTaskToDaily && appendToDaily) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const line = `- [x] ${taskText} _(completed ${time})_`;
    try {
      await appendToDaily(config.taskSectionHeading, line);
    } catch (e) {
      log.warn('rewarder: failed to write daily note task', { error: String(e) });
    }
  }

  log.info('Reward given', { name: winner.name, occurrence: winner.occurrence, task: taskText });
}

/** Clear all award history. */
export function clearAwardHistory(): void {
  awardedRewards.set([]);
}
