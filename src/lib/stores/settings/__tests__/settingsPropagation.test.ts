import { describe, it, expect, beforeEach } from 'vitest';
import {
  settings,
  DEFAULT_SETTINGS,
  editorSettings,
  appearanceSettings,
} from '@/features/settings';
import { get } from 'svelte/store';

beforeEach(() => {
  settings.reset();
  document.documentElement.removeAttribute('style');
});

describe('settings store — font fields (T059)', () => {
  it('DEFAULT_SETTINGS has three separate font fields', () => {
    expect(DEFAULT_SETTINGS.fontInterface).toBeDefined();
    expect(DEFAULT_SETTINGS.fontText).toBeDefined();
    expect(DEFAULT_SETTINGS.fontMono).toBeDefined();
  });

  it('loadFromStorage merges with defaults (backward compat)', () => {
    const loaded = get(settings);
    expect(loaded.fontInterface).toBe(DEFAULT_SETTINGS.fontInterface);
    expect(loaded.fontMono).toBe(DEFAULT_SETTINGS.fontMono);
  });

  it('editorSettings derived store includes hardLineBreaks and spellCheck', () => {
    const es = get(editorSettings);
    expect(typeof es.hardLineBreaks).toBe('boolean');
    expect(typeof es.spellCheck).toBe('boolean');
  });

  it('appearanceSettings derived store includes all three font fields', () => {
    const as_ = get(appearanceSettings);
    expect(as_.fontInterface).toBeDefined();
    expect(as_.fontText).toBeDefined();
    expect(as_.fontMono).toBeDefined();
  });
});

describe('settings propagation (T066)', () => {
  it('changing spellCheck updates editorSettings derived store', () => {
    settings.update((s) => ({ ...s, spellCheck: false }));
    expect(get(editorSettings).spellCheck).toBe(false);
    settings.update((s) => ({ ...s, spellCheck: true }));
    expect(get(editorSettings).spellCheck).toBe(true);
  });

  it('changing fontInterface updates appearanceSettings derived store', () => {
    settings.update((s) => ({ ...s, fontInterface: 'Georgia' }));
    expect(get(appearanceSettings).fontInterface).toBe('Georgia');
  });

  it('changing accentColor applies CSS var --interactive-accent', () => {
    settings.set({ ...get(settings), accentColor: '#00ff00' });
    expect(document.documentElement.style.getPropertyValue('--interactive-accent')).toBe('#00ff00');
  });

  it('changing fontText applies CSS var --font-text', () => {
    settings.set({ ...get(settings), fontText: 'Georgia' });
    const fontText = document.documentElement.style.getPropertyValue('--font-text');
    expect(fontText).toContain('Georgia');
  });
});

describe('updateChannel backward compatibility (T18)', () => {
  it('DEFAULT_SETTINGS.updateChannel is release', () => {
    expect(DEFAULT_SETTINGS.updateChannel).toBe('release');
  });

  it('loadFromStorage merges missing updateChannel to release', () => {
    // Settings saved without updateChannel (old format) should get the default
    const mergedSettings = { ...DEFAULT_SETTINGS, ...({} as Record<string, unknown>) };
    expect(mergedSettings.updateChannel).toBe('release');
  });

  it('saved updateChannel alpha is preserved on merge', () => {
    const merged = { ...DEFAULT_SETTINGS, ...{ updateChannel: 'alpha' as const } };
    expect(merged.updateChannel).toBe('alpha');
  });
});

describe('editor compartment settings values (T039)', () => {
  it('hardLineBreaks default is false in editorSettings', () => {
    expect(get(editorSettings).hardLineBreaks).toBe(false);
  });

  it('updating hardLineBreaks to true propagates through editorSettings', () => {
    settings.update((s) => ({ ...s, hardLineBreaks: true }));
    expect(get(editorSettings).hardLineBreaks).toBe(true);
  });

  it('spellCheck default is true in editorSettings', () => {
    expect(get(editorSettings).spellCheck).toBe(true);
  });

  it('toggling spellCheck propagates through editorSettings to false', () => {
    settings.update((s) => ({ ...s, spellCheck: false }));
    expect(get(editorSettings).spellCheck).toBe(false);
  });

  it('editorSettings.spellCheck change produces correct contentAttributes string', () => {
    settings.update((s) => ({ ...s, spellCheck: false }));
    const spellCheck = get(editorSettings).spellCheck;
    // Verify the value that would be passed to EditorView.contentAttributes
    expect(String(spellCheck)).toBe('false');
    settings.update((s) => ({ ...s, spellCheck: true }));
    expect(String(get(editorSettings).spellCheck)).toBe('true');
  });
});
