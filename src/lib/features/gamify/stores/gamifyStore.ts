/**
 * Gamified Tasks store — coin balance, task CRUD, rewards, history.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  GamifyState, GamifiedTask, Reward, HistoryEntry,
  TaskDifficulty, TaskCounter, Recurrence,
} from '../types';
import { DIFFICULTY_COINS } from '../types';
import { loadGamifyState, saveGamifyState, processRecurrence, generateId } from '../services/gamifyService';
import { recordTaskCompleted } from './questStore';
import { rollRewardForTask } from './rewarderStore';

const initial = loadGamifyState();

/** Core gamify state. */
export const gamifyCoins = writable(initial.coins);
export const gamifyTasks = writable<GamifiedTask[]>(processRecurrence(initial.tasks));
export const gamifyRewards = writable<Reward[]>(initial.rewards);
export const gamifyHistory = writable<HistoryEntry[]>(initial.history);

/** Derived: pending tasks. */
export const pendingTasks = derived(gamifyTasks, ($t) => $t.filter(t => !t.completed));

/** Derived: completed tasks. */
export const completedTasks = derived(gamifyTasks, ($t) => $t.filter(t => t.completed));

/** Derived: total earned. */
export const totalEarned = derived(gamifyHistory, ($h) =>
  $h.filter(e => e.type === 'earn').reduce((s, e) => s + e.amount, 0)
);

/** Persist state on every change. */
function persist(): void {
  const state: GamifyState = {
    coins: get(gamifyCoins),
    tasks: get(gamifyTasks),
    rewards: get(gamifyRewards),
    history: get(gamifyHistory),
  };
  saveGamifyState(state);
}

gamifyCoins.subscribe(persist);
gamifyTasks.subscribe(persist);
gamifyRewards.subscribe(persist);
gamifyHistory.subscribe(persist);

/** Add a new gamified task. */
export function addGamifiedTask(
  text: string,
  difficulty: TaskDifficulty,
  counter?: TaskCounter,
  recurrence?: Recurrence,
): void {
  const task: GamifiedTask = {
    id: generateId(),
    text,
    difficulty,
    completed: false,
    counter,
    recurrence,
    createdAt: new Date().toISOString(),
  };
  gamifyTasks.update(t => [...t, task]);
  log.info('Gamified task added', { text, difficulty });
}

/** Complete a gamified task and earn coins. */
export function completeGamifiedTask(taskId: string): void {
  const tasks = get(gamifyTasks);
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.completed) return;

  // If counter exists, check if target met
  if (task.counter && task.counter.current < task.counter.target) return;

  const reward = DIFFICULTY_COINS[task.difficulty];
  gamifyTasks.update(t => t.map(tk =>
    tk.id === taskId ? { ...tk, completed: true, completedAt: new Date().toISOString() } : tk
  ));
  gamifyCoins.update(c => c + reward);
  gamifyHistory.update(h => [...h, {
    id: generateId(),
    type: 'earn',
    amount: reward,
    description: `Completed: ${task.text}`,
    timestamp: new Date().toISOString(),
  }]);

  // Also award quest XP
  recordTaskCompleted(task.text, 'medium');

  // Roll for a rewarder reward
  rollRewardForTask(
    task.text,
    async (path) => {
      const { getNote } = await import('@/services/vault/vault');
      const note = await getNote(path);
      return note.content;
    },
    async (path, content) => {
      const { writeNote } = await import('@/services/vault/vault');
      await writeNote(path, content);
    },
  ).catch(e => log.warn('Rewarder roll failed', { error: String(e) }));

  log.info('Gamified task completed', { text: task.text, coins: reward });
}

/** Increment a task counter. */
export function incrementCounter(taskId: string): void {
  gamifyTasks.update(tasks => tasks.map(t => {
    if (t.id !== taskId || !t.counter) return t;
    const next = Math.min(t.counter.current + 1, t.counter.target);
    const updated = { ...t, counter: { ...t.counter, current: next } };
    // Auto-complete if counter target reached
    if (next >= t.counter.target && !t.completed) {
      setTimeout(() => completeGamifiedTask(taskId), 0);
    }
    return updated;
  }));
}

/** Delete a gamified task. */
export function deleteGamifiedTask(taskId: string): void {
  gamifyTasks.update(t => t.filter(tk => tk.id !== taskId));
}

/** Purchase a reward. */
export function purchaseReward(rewardId: string): boolean {
  const rewards = get(gamifyRewards);
  const reward = rewards.find(r => r.id === rewardId);
  if (!reward) return false;

  const coins = get(gamifyCoins);
  if (coins < reward.cost) return false;

  gamifyCoins.update(c => c - reward.cost);
  gamifyRewards.update(r => r.map(rw =>
    rw.id === rewardId ? { ...rw, purchased: true } : rw
  ));
  gamifyHistory.update(h => [...h, {
    id: generateId(),
    type: 'spend',
    amount: reward.cost,
    description: `Purchased: ${reward.name}`,
    timestamp: new Date().toISOString(),
  }]);

  log.info('Reward purchased', { name: reward.name, cost: reward.cost });
  return true;
}

/** Add a custom reward. */
export function addReward(name: string, description: string, cost: number, icon: string): void {
  const reward: Reward = { id: generateId(), name, description, cost, icon, purchased: false };
  gamifyRewards.update(r => [...r, reward]);
}

/** Reset a reward to unpurchased (so it can be bought again). */
export function resetReward(rewardId: string): void {
  gamifyRewards.update(r => r.map(rw =>
    rw.id === rewardId ? { ...rw, purchased: false } : rw
  ));
}
