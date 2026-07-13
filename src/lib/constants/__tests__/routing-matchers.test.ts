import { describe, expect, it } from 'vitest';

import { match as matchAppRoute } from '$params/appRoute';
import { match as matchCanvasFile } from '$params/canvasFile';
import { match as matchNoteFile } from '$params/noteFile';
import { match as matchSettingsTab } from '$params/settingsTab';

// ── appRoute ────────────────────────────────────────────────────────────────

describe('appRoute matcher', () => {
  const valid = [
    'editor',
    'graph',
    'canvas',
    'calendar',
    'settings',
    'import',
    'projects',
    'writing',
    'flashcards',
    'creative',
    'media',
    'pokemon',
    'gamification',
    'wellness',
  ];

  it.each(valid)('matches "%s"', (route) => {
    expect(matchAppRoute(route)).toBe(true);
  });

  it.each(['unknown', '', 'Editor', 'edit', 'GRAPH', 'home'])('rejects "%s"', (route) => {
    expect(matchAppRoute(route)).toBe(false);
  });
});

// ── settingsTab ─────────────────────────────────────────────────────────────

describe('settingsTab matcher', () => {
  const valid = [
    'general',
    'editor',
    'appearance',
    'vault',
    'hotkeys',
    'about',
    'ai',
    'media',
    'integration',
    'calendar',
    'typewriter',
    'vim',
    'changelog',
    'versioning',
    'updates',
    'performance',
    'window',
  ];

  it.each(valid)('matches "%s"', (tab) => {
    expect(matchSettingsTab(tab)).toBe(true);
  });

  it.each(['invalid', '', 'General', 'theme', 'plugins'])('rejects "%s"', (tab) => {
    expect(matchSettingsTab(tab)).toBe(false);
  });
});

// ── noteFile ────────────────────────────────────────────────────────────────

describe('noteFile matcher', () => {
  it('matches .md files', () => {
    expect(matchNoteFile('my-note.md')).toBe(true);
    expect(matchNoteFile('README.md')).toBe(true);
  });

  it('matches paths with slashes (folder paths)', () => {
    expect(matchNoteFile('folder/note')).toBe(true);
    expect(matchNoteFile('a/b/c.md')).toBe(true);
  });

  it('rejects plain names without .md or slashes', () => {
    expect(matchNoteFile('note')).toBe(false);
    expect(matchNoteFile('canvas')).toBe(false);
  });
});

// ── canvasFile ──────────────────────────────────────────────────────────────

describe('canvasFile matcher', () => {
  it('matches canvas names without dots', () => {
    expect(matchCanvasFile('my-canvas')).toBe(true);
    expect(matchCanvasFile('board-2024')).toBe(true);
    expect(matchCanvasFile('test')).toBe(true);
  });

  it('rejects names with file extensions', () => {
    expect(matchCanvasFile('file.canvas')).toBe(false);
    expect(matchCanvasFile('note.md')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(matchCanvasFile('')).toBe(false);
  });
});
