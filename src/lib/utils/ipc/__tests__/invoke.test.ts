import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcCall } from '../invoke';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), interaction: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

const mockInvoke = vi.mocked(invoke);
const mockLog = log as unknown as {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  interaction: ReturnType<typeof vi.fn>;
};

describe('ipcCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns typed result on success', async () => {
    mockInvoke.mockResolvedValue({ id: 1, name: 'test' });
    const result = await ipcCall<{ id: number; name: string }>('get_item', { id: 1 });
    expect(result).toEqual({ id: 1, name: 'test' });
    expect(mockInvoke).toHaveBeenCalledWith('get_item', { id: 1 });
  });

  it('throws with context on failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));
    await expect(ipcCall('save_item', { data: 'x' })).rejects.toThrow(
      'Failed to save_item: Error: Network error'
    );
  });

  it('logs error on failure', async () => {
    mockInvoke.mockRejectedValue(new Error('fail'));
    try {
      await ipcCall('my_cmd', { a: 1 });
    } catch {
      /* expected */
    }
    expect(mockLog.error).toHaveBeenCalledWith('IPC failed: my_cmd', expect.any(Error), { a: 1 });
  });

  it('uses log.interaction on success', async () => {
    mockInvoke.mockResolvedValue('ok');
    const mockLogInteraction = mockLog.interaction;
    await ipcCall('do_thing', { x: 1 });
    expect(mockLogInteraction).toHaveBeenCalledWith(
      'ipc',
      'do_thing',
      expect.objectContaining({ durationMs: expect.any(Number) })
    );
  });

  it('uses custom label in error message', async () => {
    mockInvoke.mockRejectedValue(new Error('err'));
    await expect(ipcCall('cmd', {}, { label: 'create widget' })).rejects.toThrow(
      'Failed to create widget:'
    );
  });
});
