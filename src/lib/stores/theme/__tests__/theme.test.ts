import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); }),
  length: 0,
  key: vi.fn(() => null),
});

vi.stubGlobal('crypto', { randomUUID: () => 'test-session' });

// Mock matchMedia
vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})));

/** Helper: parse the version envelope written to localStorage and return .data */
function getPersistedTheme(): string | undefined {
  const raw = mockStorage['bismuth-theme'];
  if (!raw) return undefined;
  try {
    const envelope = JSON.parse(raw);
    return typeof envelope === 'object' && 'data' in envelope ? envelope.data : raw;
  } catch {
    return raw;
  }
}

/** Helper: seed localStorage with a versioned envelope for the theme key */
function seedTheme(value: string) {
  mockStorage['bismuth-theme'] = JSON.stringify({
    schemaId: 'bismuth-theme',
    schemaVersion: 1,
    writerVersion: '0.3.0',
    minReaderVersion: '0.3.0',
    writtenAt: new Date().toISOString(),
    data: value,
  });
}

describe('theme store', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  async function importTheme() {
    const mod = await import('../theme');
    return mod.theme;
  }

  it('defaults to auto when no stored theme', async () => {
    const theme = await importTheme();
    const selected = get(theme.selectedTheme);
    expect(selected).toBe('auto');
  });

  it('resolves auto to system preference (dark)', async () => {
    const theme = await importTheme();
    // matchMedia returns dark
    const active = get(theme);
    expect(active).toBe('dark');
  });

  it('loads stored theme from localStorage', async () => {
    seedTheme('light');
    const theme = await importTheme();
    expect(get(theme.selectedTheme)).toBe('light');
  });

  it('setTheme updates selectedTheme and persists', async () => {
    const theme = await importTheme();
    theme.setTheme('dark');
    expect(get(theme.selectedTheme)).toBe('dark');
    expect(getPersistedTheme()).toBe('dark');
  });

  it('toggleTheme cycles through light -> auto -> dark', async () => {
    seedTheme('light');
    const theme = await importTheme();
    theme.toggleTheme();
    expect(get(theme.selectedTheme)).toBe('auto');
    theme.toggleTheme();
    expect(get(theme.selectedTheme)).toBe('dark');
    theme.toggleTheme();
    expect(get(theme.selectedTheme)).toBe('light');
  });

  it('selectedTheme.set persists to localStorage', async () => {
    const theme = await importTheme();
    theme.selectedTheme.set('light');
    expect(getPersistedTheme()).toBe('light');
  });
});
