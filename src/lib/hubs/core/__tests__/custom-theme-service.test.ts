import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/ipc/invoke', () => ({
  invokeCommand: vi.fn(),
}));
vi.mock('@/utils/log/logger', () => ({
  log: { child: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }) },
}));

import { applyCustomTheme, removeCustomTheme } from '@/hubs/core/services/custom-theme-service';

describe('custom-theme-service', () => {
  afterEach(() => {
    const el = document.getElementById('bismuth-custom-theme');
    if (el) el.remove();
  });

  describe('applyCustomTheme', () => {
    it('removes theme when path is empty', async () => {
      const style = document.createElement('style');
      style.id = 'bismuth-custom-theme';
      document.head.appendChild(style);

      await applyCustomTheme('');
      expect(document.getElementById('bismuth-custom-theme')).toBeNull();
    });

    it('removes theme when css content is empty (non-Tauri)', async () => {
      await applyCustomTheme('some/path.css');
      expect(document.getElementById('bismuth-custom-theme')).toBeNull();
    });
  });

  describe('removeCustomTheme', () => {
    it('removes the custom theme style element', () => {
      const style = document.createElement('style');
      style.id = 'bismuth-custom-theme';
      document.head.appendChild(style);

      removeCustomTheme();
      expect(document.getElementById('bismuth-custom-theme')).toBeNull();
    });

    it('is safe to call when no theme is applied', () => {
      expect(() => removeCustomTheme()).not.toThrow();
    });
  });
});
