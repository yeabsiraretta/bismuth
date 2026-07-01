import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { lintText } from '../services/linting';
import { invoke } from '@tauri-apps/api/core';

describe('linting service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls invoke with text', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    await lintText('Hello world');
    expect(invoke).toHaveBeenCalledWith('lint_note_text', { text: 'Hello world' });
  });

  it('returns lint issues', async () => {
    const issues = [
      {
        rule: 'passive-voice',
        message: 'Passive detected',
        severity: 'warning',
        from: 0,
        to: 5,
        suggestion: 'Rewrite',
      },
    ];
    vi.mocked(invoke).mockResolvedValue(issues);
    const result = await lintText('It was done by the team');
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('passive-voice');
  });

  it('returns empty array for clean text', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    const result = await lintText('Clear and direct writing.');
    expect(result).toEqual([]);
  });
});
