import { describe, it, expect } from 'vitest';
import {
  buildKeyshotsKeymap,
  buildKeymapFromMapping,
  getCommandDescriptions,
} from '../services/keyshotsKeymap';
import type { KeyshotsPreset } from '../types/keyshots';
import {
  PRESET_MAP,
  KEYSHOTS_MAPPINGS,
  VSCODE_MAPPINGS,
  JETBRAINS_MAPPINGS,
  VISUAL_STUDIO_MAPPINGS,
} from '../types/keyshots';

describe('buildKeyshotsKeymap', () => {
  it('returns empty for clear preset', () => {
    expect(buildKeyshotsKeymap('clear')).toEqual([]);
  });

  it('returns keybindings for keyshots preset', () => {
    const bindings = buildKeyshotsKeymap('keyshots');
    expect(bindings.length).toBeGreaterThan(0);
    expect(bindings.every((b) => b.key && b.run)).toBe(true);
  });

  it('returns keybindings for vscode preset', () => {
    const bindings = buildKeyshotsKeymap('vscode');
    expect(bindings.length).toBeGreaterThan(0);
  });

  it('returns keybindings for jetbrains preset', () => {
    const bindings = buildKeyshotsKeymap('jetbrains');
    expect(bindings.length).toBeGreaterThan(0);
  });

  it('returns keybindings for visual-studio preset', () => {
    const bindings = buildKeyshotsKeymap('visual-studio');
    expect(bindings.length).toBeGreaterThan(0);
  });

  it('keybinding count matches mapping key count', () => {
    const presets: KeyshotsPreset[] = ['keyshots', 'vscode', 'jetbrains', 'visual-studio'];
    for (const p of presets) {
      const mapping = PRESET_MAP[p];
      const bindings = buildKeyshotsKeymap(p);
      expect(bindings.length).toBe(Object.keys(mapping).length);
    }
  });
});

describe('buildKeymapFromMapping', () => {
  it('builds keybindings from a custom mapping', () => {
    const bindings = buildKeymapFromMapping({ 'move-line-up': 'Alt-ArrowUp' });
    expect(bindings).toHaveLength(1);
    expect(bindings[0].key).toBe('Alt-ArrowUp');
  });

  it('returns empty for empty mapping', () => {
    expect(buildKeymapFromMapping({})).toEqual([]);
  });
});

describe('getCommandDescriptions', () => {
  it('returns all command descriptions', () => {
    const cmds = getCommandDescriptions();
    expect(cmds.length).toBe(27);
    expect(cmds[0].id).toBe('move-line-up');
    expect(cmds[0].label).toBe('Move line up');
  });
});

describe('preset mappings', () => {
  it('keyshots has move-line-up', () => {
    expect(KEYSHOTS_MAPPINGS['move-line-up']).toBe('Alt-ArrowUp');
  });

  it('vscode has move-line-up', () => {
    expect(VSCODE_MAPPINGS['move-line-up']).toBe('Alt-ArrowUp');
  });

  it('jetbrains uses Shift-Alt for move', () => {
    expect(JETBRAINS_MAPPINGS['move-line-up']).toBe('Shift-Alt-ArrowUp');
  });

  it('visual-studio has move-line-up', () => {
    expect(VISUAL_STUDIO_MAPPINGS['move-line-up']).toBe('Alt-ArrowUp');
  });

  it('vscode has expand-line-selection as Ctrl-l', () => {
    expect(VSCODE_MAPPINGS['expand-line-selection']).toBe('Ctrl-l');
  });

  it('jetbrains has expand-line-selection as Ctrl-w', () => {
    expect(JETBRAINS_MAPPINGS['expand-line-selection']).toBe('Ctrl-w');
  });
});
