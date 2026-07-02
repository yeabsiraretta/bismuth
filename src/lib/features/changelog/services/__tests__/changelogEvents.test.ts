/**
 * Tests for changelogEvents service.
 * Covers subscribe/unsubscribe lifecycle and malformed payload handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeChangelogEvent } from '../changelogEvents';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

import { listen } from '@tauri-apps/api/event';
import { log } from '@/utils/logger';

describe('subscribeChangelogEvent', () => {
  let mockUnlisten: ReturnType<typeof vi.fn>;
  let capturedHandler: ((event: { payload: unknown }) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler = null;
    mockUnlisten = vi.fn();
    (listen as ReturnType<typeof vi.fn>).mockImplementation((_event, handler) => {
      capturedHandler = handler;
      return Promise.resolve(mockUnlisten);
    });
  });

  it('subscribes to the given event name', () => {
    subscribeChangelogEvent('vault://file-created', vi.fn());
    expect(listen).toHaveBeenCalledWith('vault://file-created', expect.any(Function));
  });

  it('calls handler with valid payload', async () => {
    const handler = vi.fn();
    subscribeChangelogEvent('vault://file-modified', handler);
    await Promise.resolve();
    capturedHandler!({ payload: { path: 'notes/test.md' } });
    expect(handler).toHaveBeenCalledWith({ path: 'notes/test.md' });
  });

  it('ignores null payload and logs warning', async () => {
    const handler = vi.fn();
    subscribeChangelogEvent('vault://file-deleted', handler);
    await Promise.resolve();
    capturedHandler!({ payload: null });
    expect(handler).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      'changelogEvents: unexpected payload, discarding',
      expect.objectContaining({ eventName: 'vault://file-deleted' })
    );
  });

  it('ignores payload with non-string path and logs warning', async () => {
    const handler = vi.fn();
    subscribeChangelogEvent('vault://file-created', handler);
    await Promise.resolve();
    capturedHandler!({ payload: { path: 42 } });
    expect(handler).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it('ignores payload missing path field', async () => {
    const handler = vi.fn();
    subscribeChangelogEvent('vault://file-modified', handler);
    await Promise.resolve();
    capturedHandler!({ payload: { other: 'value' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns async unsubscribe that calls unlisten', async () => {
    const unsub = subscribeChangelogEvent('vault://file-created', vi.fn());
    await Promise.resolve();
    await unsub();
    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('unsubscribe is safe to call before listen resolves', async () => {
    let resolvePromise!: (fn: () => void) => void;
    (listen as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((res) => {
          resolvePromise = res;
        })
    );
    const unsub = subscribeChangelogEvent('vault://file-created', vi.fn());
    const unsubPromise = unsub();
    resolvePromise(mockUnlisten as unknown as () => void);
    await unsubPromise;
    expect(mockUnlisten).toHaveBeenCalled();
  });
});
