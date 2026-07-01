import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../services/template', () => ({
  listTemplates: vi.fn().mockResolvedValue([]),
  renderTemplate: vi.fn().mockRejectedValue(new Error('IPC unavailable in test')),
  buildTemplateContext: (notePath: string, noteTitle: string) => {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      datetime: now.toISOString().slice(0, 16).replace('T', ' '),
      'file.title': noteTitle,
      'file.path': notePath,
    };
  },
}));

import {
  favoriteTemplates,
  toggleFavorite,
  expandTemplateVariables,
} from '../stores/template';

describe('Template Store Enhancements', () => {
  beforeEach(() => {
    favoriteTemplates.set([]);
  });

  describe('Favorites', () => {
    it('adds a template to favorites', () => {
      toggleFavorite('daily-note');
      expect(get(favoriteTemplates)).toContain('daily-note');
    });

    it('removes a template from favorites on second toggle', () => {
      toggleFavorite('daily-note');
      toggleFavorite('daily-note');
      expect(get(favoriteTemplates)).not.toContain('daily-note');
    });

    it('manages multiple favorites', () => {
      toggleFavorite('daily-note');
      toggleFavorite('meeting');
      toggleFavorite('project');
      expect(get(favoriteTemplates)).toEqual(['daily-note', 'meeting', 'project']);
    });
  });

  describe('Variable Expansion', () => {
    it('expands {{date}} to current date', async () => {
      const result = await expandTemplateVariables('Today: {{date}}', 'notes/test.md', 'Test');
      const today = new Date().toISOString().slice(0, 10);
      expect(result).toContain(today);
    });

    it('expands {{title}} to note title', async () => {
      const result = await expandTemplateVariables('Note: {{title}}', 'notes/test.md', 'My Title');
      expect(result).toContain('My Title');
    });

    it('expands {{time}} to current time', async () => {
      const result = await expandTemplateVariables('At: {{time}}', 'notes/test.md', 'Test');
      expect(result).toMatch(/At: \d{2}:\d{2}/);
    });

    it('preserves unknown variables unchanged', async () => {
      const result = await expandTemplateVariables('Hello {{unknown_var}}', 'notes/test.md', 'Test');
      expect(result).toBe('Hello {{unknown_var}}');
    });
  });
});
