import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/utils/logger', () => ({ log: { info: vi.fn(), debug: vi.fn(), error: vi.fn() } }));
vi.mock('@/stores/vault/vault', () => ({
  currentVault: {
    subscribe: vi.fn((cb: (v: unknown) => void) => {
      cb({ root_path: '/vault' });
      return () => {};
    }),
  },
}));

import { invoke } from '@tauri-apps/api/core';
import {
  openOrCreatePeriodicNote,
  getPeriodicNotesForRange,
  getPeriodicNotePath,
} from '../services/periodic';

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('Periodic Notes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens or creates a periodic note', async () => {
    mockInvoke.mockResolvedValue({ path: 'Periodic Notes/daily/2025-01-15.md', created: false });
    const result = await openOrCreatePeriodicNote('2025-01-15', 'daily');
    expect(result.path).toBe('Periodic Notes/daily/2025-01-15.md');
    expect(mockInvoke).toHaveBeenCalledWith('open_or_create_periodic_note', {
      vaultRoot: '/vault',
      periodType: 'daily',
      dateStr: '2025-01-15',
    });
  });

  it('throws on IPC error', async () => {
    mockInvoke.mockRejectedValue(new Error('backend error'));
    await expect(openOrCreatePeriodicNote('2025-01-15', 'daily')).rejects.toThrow(
      'Failed to open periodic note'
    );
  });

  it('fetches notes for a date range', async () => {
    mockInvoke.mockResolvedValue([
      'Periodic Notes/daily/2025-01-01.md',
      'Periodic Notes/daily/2025-01-02.md',
    ]);
    const result = await getPeriodicNotesForRange('2025-01-01', '2025-01-31', 'daily');
    expect(result).toHaveLength(2);
    expect(mockInvoke).toHaveBeenCalledWith('get_periodic_notes_for_range', {
      vaultRoot: '/vault',
      periodType: 'daily',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
  });

  it('computes periodic note path', () => {
    const path = getPeriodicNotePath('2025-06-15', 'daily');
    expect(path).toBe('Periodic Notes/daily/2025-06-15.md');
  });

  it('computes monthly path correctly', () => {
    const path = getPeriodicNotePath('2025-03-10', 'monthly');
    expect(path).toBe('Periodic Notes/monthly/2025-03-10.md');
  });
});
