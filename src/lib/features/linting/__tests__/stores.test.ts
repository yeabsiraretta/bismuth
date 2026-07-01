import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('../services/linting', () => ({
  lintText: vi.fn(),
}));

import { lintIssues, lintLoading, lintImmediate, lintDebounced, clearLintIssues } from '../stores/linting';
import { lintText } from '../services/linting';
import type { LintIssue } from '../services/linting';

const mockIssue: LintIssue = {
  rule: 'passive-voice',
  message: 'Passive voice detected',
  severity: 'warning',
  from: 0,
  to: 10,
  suggestion: 'Use active voice',
};

describe('linting store', () => {
  beforeEach(() => {
    lintIssues.set([]);
    lintLoading.set(false);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('lintImmediate', () => {
    it('calls lintText and sets issues', async () => {
      vi.mocked(lintText).mockResolvedValue([mockIssue]);
      await lintImmediate('test text');
      expect(lintText).toHaveBeenCalledWith('test text');
      expect(get(lintIssues)).toHaveLength(1);
      expect(get(lintIssues)[0].rule).toBe('passive-voice');
    });

    it('sets loading false after completion', async () => {
      vi.mocked(lintText).mockResolvedValue([]);
      await lintImmediate('clean text');
      expect(get(lintLoading)).toBe(false);
    });

    it('clears issues on error', async () => {
      lintIssues.set([mockIssue]);
      vi.mocked(lintText).mockRejectedValue(new Error('fail'));
      await lintImmediate('error text');
      expect(get(lintIssues)).toEqual([]);
      expect(get(lintLoading)).toBe(false);
    });
  });

  describe('lintDebounced', () => {
    it('does not call lintText before delay', () => {
      vi.mocked(lintText).mockResolvedValue([]);
      lintDebounced('text', 500);
      expect(lintText).not.toHaveBeenCalled();
    });

    it('calls lintText after delay', async () => {
      vi.mocked(lintText).mockResolvedValue([mockIssue]);
      lintDebounced('text', 100);
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(lintText).toHaveBeenCalledWith('text');
    });

    it('cancels previous debounce on rapid calls', async () => {
      vi.mocked(lintText).mockResolvedValue([]);
      lintDebounced('first', 200);
      vi.advanceTimersByTime(100);
      lintDebounced('second', 200);
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
      expect(lintText).toHaveBeenCalledTimes(1);
      expect(lintText).toHaveBeenCalledWith('second');
    });
  });

  describe('clearLintIssues', () => {
    it('empties the issues store', () => {
      lintIssues.set([mockIssue]);
      clearLintIssues();
      expect(get(lintIssues)).toEqual([]);
    });
  });
});
