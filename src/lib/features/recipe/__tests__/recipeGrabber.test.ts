import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { recipeToFilename } from '../services/recipeGrabber';

describe('recipeToFilename', () => {
  it('returns name stripped of unsafe chars', () => {
    expect(recipeToFilename('My Great Recipe!')).toBe('My Great Recipe!');
  });

  it('strips filesystem-unsafe characters', () => {
    expect(recipeToFilename('Pasta / Bolognese: A "Classic"')).toBe('Pasta Bolognese A Classic');
  });

  it('truncates to 100 chars', () => {
    const long = 'A'.repeat(200);
    expect(recipeToFilename(long).length).toBe(100);
  });

  it('returns fallback for empty name', () => {
    expect(recipeToFilename('')).toBe('Untitled Recipe');
  });

  it('collapses multiple spaces', () => {
    expect(recipeToFilename('Too   Many    Spaces')).toBe('Too Many Spaces');
  });

  it('trims whitespace', () => {
    expect(recipeToFilename('  Hello  ')).toBe('Hello');
  });
});
