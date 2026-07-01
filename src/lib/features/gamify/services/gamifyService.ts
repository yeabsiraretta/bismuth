/**
 * Gamified Tasks service — persistence and recurrence logic.
 * Uses date-fns (already in project deps) for correct date arithmetic.
 */
import { log } from '@/utils/logger';
import { addDays, addWeeks, addMonths } from 'date-fns';
import type { GamifyState, GamifiedTask, Reward, Recurrence } from '../types';

const STORAGE_KEY = 'bismuth-gamify-state';

/** Load state from localStorage. */
export function loadGamifyState(): GamifyState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (err) {
    log.warn('Failed to load gamify state', { err });
  }
  return { coins: 0, tasks: [], rewards: defaultRewards(), history: [] };
}

/** Save state to localStorage. */
export function saveGamifyState(state: GamifyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    log.warn('Failed to save gamify state', { err });
  }
}

/** Check and reset recurring tasks that are due. */
export function processRecurrence(tasks: GamifiedTask[]): GamifiedTask[] {
  const now = new Date();
  return tasks.map(task => {
    if (!task.recurrence || !task.completed) return task;
    const nextDue = new Date(task.recurrence.nextDue);
    if (now >= nextDue) {
      return {
        ...task,
        completed: false,
        completedAt: undefined,
        counter: task.counter ? { ...task.counter, current: 0 } : undefined,
        recurrence: { ...task.recurrence, nextDue: computeNextDue(task.recurrence).toISOString() },
      };
    }
    return task;
  });
}

/** Compute the next due date using date-fns for correct date arithmetic. */
function computeNextDue(rec: Recurrence): Date {
  const base = new Date(rec.nextDue);
  switch (rec.pattern) {
    case 'daily': return addDays(base, 1);
    case 'weekly': return addWeeks(base, 1);
    case 'monthly': return addMonths(base, 1);
    case 'custom': return addDays(base, rec.intervalDays ?? 1);
  }
}

/** Generate a unique ID. */
export function generateId(): string {
  return `g-${crypto.randomUUID().slice(0, 12)}`;
}

/** Default rewards. */
function defaultRewards(): Reward[] {
  return [
    { id: 'r1', name: '15 min break', description: 'Take a guilt-free 15 minute break', cost: 10, icon: 'coffee', purchased: false },
    { id: 'r2', name: 'Snack time', description: 'Treat yourself to a snack', cost: 15, icon: 'cookie', purchased: false },
    { id: 'r3', name: 'Short walk', description: 'Go for a refreshing walk', cost: 20, icon: 'sun', purchased: false },
    { id: 'r4', name: 'Gaming session', description: '30 minutes of your favorite game', cost: 50, icon: 'gamepad-2', purchased: false },
    { id: 'r5', name: 'Movie night', description: 'Watch a movie of your choice', cost: 100, icon: 'tv', purchased: false },
  ];
}
