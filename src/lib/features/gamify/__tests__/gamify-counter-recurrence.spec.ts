/**
 * Unit tests for gamification: counter task increment and recurring task reset.
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
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
});

vi.mock('date-fns', () => ({
  addDays: (date: Date, n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  },
  addWeeks: (date: Date, n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n * 7);
    return d;
  },
  addMonths: (date: Date, n: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  },
}));

import { gamifyTasks, gamifyCoins, addGamifiedTask, incrementCounter } from '../stores/gamifyStore';
import { processRecurrence } from '../services/gamifyService';
import type { GamifiedTask } from '../types';

describe('Counter task increment', () => {
  beforeEach(() => {
    gamifyTasks.set([]);
    gamifyCoins.set(0);
  });

  it('increments counter.current by 1 on incrementCounter', () => {
    addGamifiedTask('Counter task', 'medium', { current: 0, target: 5 });
    const [task] = get(gamifyTasks);
    incrementCounter(task.id);
    const updated = get(gamifyTasks).find((t) => t.id === task.id)!;
    expect(updated.counter!.current).toBe(1);
  });

  it('does not exceed counter target', () => {
    addGamifiedTask('Counter task at cap', 'easy', { current: 3, target: 3 });
    const [task] = get(gamifyTasks);
    incrementCounter(task.id);
    const updated = get(gamifyTasks).find((t) => t.id === task.id)!;
    expect(updated.counter!.current).toBe(3);
  });

  it('no-ops incrementCounter on task without counter', () => {
    addGamifiedTask('Plain task', 'medium');
    const [task] = get(gamifyTasks);
    incrementCounter(task.id);
    const after = get(gamifyTasks).find((t) => t.id === task.id)!;
    expect(after.counter).toBeUndefined();
    expect(after.completed).toBe(false);
  });

  it('increments counter multiple times up to target', () => {
    addGamifiedTask('Multi counter', 'hard', { current: 0, target: 3 });
    const [task] = get(gamifyTasks);
    incrementCounter(task.id);
    incrementCounter(task.id);
    const updated = get(gamifyTasks).find((t) => t.id === task.id)!;
    expect(updated.counter!.current).toBe(2);
  });
});

describe('Recurring task reset', () => {
  it('resets a completed daily task when nextDue is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks: GamifiedTask[] = [
      {
        id: 'rt-1',
        text: 'Daily task',
        difficulty: 'easy',
        completed: true,
        completedAt: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        recurrence: {
          pattern: 'daily',
          nextDue: yesterday.toISOString(),
        },
      },
    ];

    const result = processRecurrence(tasks);
    expect(result[0].completed).toBe(false);
    expect(result[0].completedAt).toBeUndefined();
  });

  it('does not reset a completed task whose nextDue is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks: GamifiedTask[] = [
      {
        id: 'rt-2',
        text: 'Weekly task',
        difficulty: 'medium',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        recurrence: {
          pattern: 'weekly',
          nextDue: tomorrow.toISOString(),
        },
      },
    ];

    const result = processRecurrence(tasks);
    expect(result[0].completed).toBe(true);
  });

  it('resets counter to 0 on recurring task reset', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks: GamifiedTask[] = [
      {
        id: 'rt-3',
        text: 'Counter daily',
        difficulty: 'hard',
        completed: true,
        completedAt: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        counter: { current: 5, target: 5 },
        recurrence: {
          pattern: 'daily',
          nextDue: yesterday.toISOString(),
        },
      },
    ];

    const result = processRecurrence(tasks);
    expect(result[0].completed).toBe(false);
    expect(result[0].counter!.current).toBe(0);
  });

  it('does not reset a non-recurring completed task', () => {
    const tasks: GamifiedTask[] = [
      {
        id: 'rt-4',
        text: 'One-time task',
        difficulty: 'trivial',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    const result = processRecurrence(tasks);
    expect(result[0].completed).toBe(true);
  });
});
