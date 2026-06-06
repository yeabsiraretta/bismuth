import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { toasts, showToast, dismissToast, clearToasts, toast } from '../toast';

describe('toast store', () => {
  beforeEach(() => {
    clearToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with no toasts', () => {
    expect(get(toasts)).toHaveLength(0);
  });

  it('should add a toast with showToast', () => {
    showToast('Hello', 'info', 4000);
    const all = get(toasts);
    expect(all).toHaveLength(1);
    expect(all[0].message).toBe('Hello');
    expect(all[0].type).toBe('info');
    expect(all[0].duration).toBe(4000);
  });

  it('should auto-dismiss after duration', () => {
    showToast('Temp', 'info', 2000);
    expect(get(toasts)).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(get(toasts)).toHaveLength(0);
  });

  it('should not auto-dismiss when duration is 0', () => {
    showToast('Persistent', 'error', 0);
    vi.advanceTimersByTime(10000);
    expect(get(toasts)).toHaveLength(1);
  });

  it('should dismiss a specific toast by ID', () => {
    const id1 = showToast('First', 'info', 0);
    showToast('Second', 'warning', 0);
    expect(get(toasts)).toHaveLength(2);
    dismissToast(id1);
    const remaining = get(toasts);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('Second');
  });

  it('should clear all toasts', () => {
    showToast('A', 'info', 0);
    showToast('B', 'warning', 0);
    showToast('C', 'error', 0);
    expect(get(toasts)).toHaveLength(3);
    clearToasts();
    expect(get(toasts)).toHaveLength(0);
  });

  it('should sort newest first', () => {
    showToast('First', 'info', 0);
    vi.advanceTimersByTime(100);
    showToast('Second', 'info', 0);
    const all = get(toasts);
    expect(all[0].message).toBe('Second');
    expect(all[1].message).toBe('First');
  });

  it('should provide convenience wrappers', () => {
    toast.info('Info msg');
    toast.success('Success msg');
    toast.warning('Warning msg');
    toast.error('Error msg');
    const all = get(toasts);
    expect(all).toHaveLength(4);
    expect(all.map((t: { type: string }) => t.type).sort()).toEqual(['error', 'info', 'success', 'warning']);
  });

  it('should return unique IDs', () => {
    const id1 = showToast('A', 'info', 0);
    const id2 = showToast('B', 'info', 0);
    expect(id1).not.toBe(id2);
  });
});
