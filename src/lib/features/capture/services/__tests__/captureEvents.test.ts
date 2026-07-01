import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeVaultEvent } from '../captureEvents';

vi.mock('@tauri-apps/api/event');

const { listen } = await import('@tauri-apps/api/event');

describe('subscribeVaultEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls listen with the correct event name', async () => {
    const handler = vi.fn();
    subscribeVaultEvent('vault://file-created', handler);
    expect(listen).toHaveBeenCalledWith('vault://file-created', expect.any(Function));
  });

  it('forwards a valid payload to the handler', async () => {
    const handler = vi.fn();
    let capturedCallback: ((e: { payload: unknown }) => void) | null = null;

    vi.mocked(listen).mockImplementation(async (_event, cb) => {
      capturedCallback = cb as (e: { payload: unknown }) => void;
      return vi.fn() as unknown as () => void;
    });

    subscribeVaultEvent('vault://file-modified', handler);
    await Promise.resolve();

    capturedCallback!({ payload: { path: '/vault/note.md' } });
    expect(handler).toHaveBeenCalledWith({ path: '/vault/note.md' });
  });

  it('discards malformed (missing path) payloads without calling handler', async () => {
    const handler = vi.fn();
    let capturedCallback: ((e: { payload: unknown }) => void) | null = null;

    vi.mocked(listen).mockImplementation(async (_event, cb) => {
      capturedCallback = cb as (e: { payload: unknown }) => void;
      return vi.fn() as unknown as () => void;
    });

    subscribeVaultEvent('vault://file-deleted', handler);
    await Promise.resolve();

    capturedCallback!({ payload: { wrongKey: 'bad' } });
    capturedCallback!({ payload: null });
    capturedCallback!({ payload: 'stringpayload' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the returned unsubscribe function', async () => {
    const mockUnlisten = vi.fn();
    vi.mocked(listen).mockResolvedValue(mockUnlisten);

    const handler = vi.fn();
    const unsubscribe = subscribeVaultEvent('vault://file-created', handler);
    await unsubscribe();
    expect(mockUnlisten).toHaveBeenCalled();
  });
});
