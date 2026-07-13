import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it, vi } from 'vitest';

import { emitEvent, listenEvent, listenOnce } from '@/ipc/events';
import type { EventPayload } from '@/types/events';

describe('IPC Events', () => {
  describe('listenEvent', () => {
    it('should unwrap TauriEvent and pass EventPayload to handler', async () => {
      mockIPC(() => {}, { shouldMockEvents: true });

      const handler = vi.fn();
      await listenEvent<string>('test:channel', handler);

      const { emit } = await import('@tauri-apps/api/event');
      const payload: EventPayload<string> = { data: 'hello', timestamp: Date.now() };
      emit('test:channel', payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should return an unlisten function', async () => {
      mockIPC(() => {}, { shouldMockEvents: true });

      const unlisten = await listenEvent<string>('test:channel', vi.fn());

      expect(typeof unlisten).toBe('function');
    });
  });

  describe('listenOnce', () => {
    it('should delegate to tauri once() and unwrap payload to handler', async () => {
      mockIPC(() => {}, { shouldMockEvents: true });

      const handler = vi.fn();
      await listenOnce<number>('one-shot', handler);

      const { emit } = await import('@tauri-apps/api/event');
      const payload: EventPayload<number> = { data: 42, timestamp: Date.now() };
      emit('one-shot', payload);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  describe('emitEvent', () => {
    it('should emit to the given channel', async () => {
      mockIPC(() => {}, { shouldMockEvents: true });

      const handler = vi.fn();
      const { listen } = await import('@tauri-apps/api/event');
      listen('outgoing', handler);

      await emitEvent('outgoing', { key: 'value' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'outgoing',
          payload: { key: 'value' },
        })
      );
    });
  });
});
