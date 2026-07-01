import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/id', () => ({ generateId: () => 'test-id-123' }));
vi.mock('@/utils/logger', () => ({ log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('./layout', () => ({
  layoutStore: {
    subscribe: vi.fn((fn: (v: unknown) => void) => { fn({ leftSidebarVisible: true, rightSidebarVisible: true, leftSidebarWidth: 300, rightSidebarWidth: 300, leftActiveTab: 'files', rightActiveTab: 'backlinks' }); return () => {}; }),
    update: vi.fn(),
  },
  LAYOUT_CONSTANTS: { SIDEBAR_DEFAULT_WIDTH: 300 },
}));

describe('Layout Presets Store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('loads with default presets', async () => {
    const { layoutPresets, loadPresets, DEFAULT_PRESETS } = await import('../presets');
    loadPresets();
    const presets = get(layoutPresets);
    expect(presets.length).toBeGreaterThanOrEqual(DEFAULT_PRESETS.length);
    expect(presets.some(p => p.name === 'Focus')).toBe(true);
    expect(presets.some(p => p.name === 'Write')).toBe(true);
    expect(presets.some(p => p.name === 'Research')).toBe(true);
    expect(presets.some(p => p.name === 'Canvas')).toBe(true);
  });

  it('saves a new preset', async () => {
    const { layoutPresets, savePreset, loadPresets } = await import('../presets');
    loadPresets();
    const preset = savePreset('My Layout');
    expect(preset.name).toBe('My Layout');
    expect(preset.id).toBe('test-id-123');
    const all = get(layoutPresets);
    expect(all.some(p => p.name === 'My Layout')).toBe(true);
  });

  it('deletes a user preset', async () => {
    const { layoutPresets, savePreset, deletePreset, loadPresets } = await import('../presets');
    loadPresets();
    const preset = savePreset('Deletable');
    expect(deletePreset(preset.id)).toBe(true);
    const all = get(layoutPresets);
    expect(all.some(p => p.name === 'Deletable')).toBe(false);
  });

  it('cannot delete default presets', async () => {
    const { DEFAULT_PRESETS, deletePreset, loadPresets } = await import('../presets');
    loadPresets();
    expect(deletePreset(DEFAULT_PRESETS[0].id)).toBe(false);
  });

  it('renames a user preset', async () => {
    const { layoutPresets, savePreset, renamePreset, loadPresets } = await import('../presets');
    loadPresets();
    const preset = savePreset('OldName');
    renamePreset(preset.id, 'NewName');
    const all = get(layoutPresets);
    expect(all.some(p => p.name === 'NewName')).toBe(true);
  });

  it('applies a preset and updates viewport mode', async () => {
    const { applyPreset, activePresetId, viewportMode, loadPresets, DEFAULT_PRESETS } = await import('../presets');
    loadPresets();
    applyPreset(DEFAULT_PRESETS[0].id);
    expect(get(activePresetId)).toBe(DEFAULT_PRESETS[0].id);
    expect(get(viewportMode)).toBe('note');
  });

  it('setViewportMode updates the store', async () => {
    const { viewportMode, setViewportMode } = await import('../presets');
    setViewportMode('rss');
    expect(get(viewportMode)).toBe('rss');
    setViewportMode('canvas');
    expect(get(viewportMode)).toBe('canvas');
  });
});
