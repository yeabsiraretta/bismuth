import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeConceptSuggestions } from '../conceptEvents';

vi.mock('@tauri-apps/api/event');

const { listen } = await import('@tauri-apps/api/event');

describe('subscribeConceptSuggestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls listen with the correct event name', async () => {
    const handler = vi.fn();
    subscribeConceptSuggestions(handler);
    expect(listen).toHaveBeenCalledWith('editor://concept-suggestions', expect.any(Function));
  });

  it('forwards a valid array payload to the handler', async () => {
    const handler = vi.fn();
    let capturedCallback: ((e: { payload: unknown }) => void) | null = null;

    vi.mocked(listen).mockImplementation(async (_event, cb) => {
      capturedCallback = cb as (e: { payload: unknown }) => void;
      return vi.fn() as unknown as () => void;
    });

    subscribeConceptSuggestions(handler);
    await Promise.resolve();

    const suggestions = [{ title: 'Note A', offset: 0, length: 6, matched_text: 'Note A', score: 0.9 }];
    capturedCallback!({ payload: suggestions });
    expect(handler).toHaveBeenCalledWith(suggestions);
  });

  it('discards malformed (non-array) payloads without calling handler', async () => {
    const handler = vi.fn();
    let capturedCallback: ((e: { payload: unknown }) => void) | null = null;

    vi.mocked(listen).mockImplementation(async (_event, cb) => {
      capturedCallback = cb as (e: { payload: unknown }) => void;
      return vi.fn() as unknown as () => void;
    });

    subscribeConceptSuggestions(handler);
    await Promise.resolve();

    capturedCallback!({ payload: { bad: 'data' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the returned unsubscribe function', async () => {
    const mockUnlisten = vi.fn();
    vi.mocked(listen).mockResolvedValue(mockUnlisten);

    const handler = vi.fn();
    const unsubscribe = subscribeConceptSuggestions(handler);
    await unsubscribe();
    expect(mockUnlisten).toHaveBeenCalled();
  });
});
