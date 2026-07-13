import { randomFillSync, randomUUID } from 'node:crypto';

import { clearMocks } from '@tauri-apps/api/mocks';
import { afterEach, beforeAll } from 'vitest';

// jsdom lacks WebCrypto — required for Tauri IPC internals
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: <T extends ArrayBufferView>(buffer: T): T => {
        randomFillSync(buffer as unknown as Uint8Array);
        return buffer;
      },
      randomUUID,
    },
  });
});

// Reset all Tauri mocks between tests to prevent state leaking
afterEach(() => {
  clearMocks();
});
