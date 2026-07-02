/**
 * flashcardStore unit tests — mocked AnkiConnect and vault services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('../services/ankiConnect', () => ({
  checkConnection: vi.fn().mockResolvedValue('connected'),
  syncCards: vi.fn().mockResolvedValue({
    syncedAt: '2026-01-01',
    created: 1,
    updated: 0,
    skipped: 0,
    errors: 0,
    results: [],
  }),
  getAnkiNoteIds: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('@/services/vault/vault', () => ({
  getNote: vi
    .fn()
    .mockResolvedValue({ path: 'test.md', content: 'Q :: A', title: 'test', frontmatter: {} }),
}));

import {
  scanActiveNote,
  clearCards,
  pingAnki,
  scannedCards,
  cardCount,
  connectionStatus,
  flashcardError,
} from '../stores/flashcardStore';

describe('flashcardStore', () => {
  beforeEach(() => {
    clearCards();
  });

  it('scanActiveNote populates scannedCards', () => {
    scanActiveNote('test.md', 'Front :: Back');
    expect(get(cardCount)).toBe(1);
    expect(get(scannedCards)[0].type).toBe('basic');
  });

  it('scanActiveNote with Study Vault syntax', () => {
    scanActiveNote('test.md', '## Q: What?\n**A:** This.');
    expect(get(cardCount)).toBe(1);
    expect(get(scannedCards)[0].front).toBe('What?');
  });

  it('clearCards resets state', () => {
    scanActiveNote('test.md', 'Q :: A');
    clearCards();
    expect(get(cardCount)).toBe(0);
    expect(get(flashcardError)).toBeNull();
  });

  it('pingAnki updates connectionStatus', async () => {
    await pingAnki();
    expect(get(connectionStatus)).toBe('connected');
  });

  it('empty note produces zero cards', () => {
    scanActiveNote('empty.md', '# Title\nJust prose with no cards.');
    expect(get(cardCount)).toBe(0);
  });
});
