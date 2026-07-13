import { CUSTOM_HOTKEYS_KEY, HOTKEY_OVERRIDES_KEY } from '@/constants/storage-keys';
import { isPaletteOpen, openPalette } from '@/hubs/core/stores/command-store.svelte';
import { getSettings } from '@/hubs/core/stores/settings-store.svelte';

export interface Hotkey {
  id: string;
  name: string;
  description: string;
  keys: string;
  action: () => void;
}

export interface CustomHotkey {
  id: string;
  name: string;
  description: string;
  keys: string;
  commandId: string;
}

let hotkeys = $state<Map<string, Hotkey>>(new Map());
let overrides = $state<Record<string, string>>({});
let customHotkeys = $state<CustomHotkey[]>([]);
let enabled = $state(true);

function loadOverrides(): void {
  try {
    const raw = localStorage.getItem(HOTKEY_OVERRIDES_KEY);
    if (raw) overrides = JSON.parse(raw);
  } catch {
    /* corrupt */
  }
}

function saveOverrides(): void {
  try {
    localStorage.setItem(HOTKEY_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* quota */
  }
}

function loadCustomHotkeys(): void {
  try {
    const raw = localStorage.getItem(CUSTOM_HOTKEYS_KEY);
    if (raw) customHotkeys = JSON.parse(raw);
  } catch {
    /* corrupt */
  }
}

function saveCustomHotkeys(): void {
  try {
    localStorage.setItem(CUSTOM_HOTKEYS_KEY, JSON.stringify(customHotkeys));
  } catch {
    /* quota */
  }
}

export function getHotkeys(): Hotkey[] {
  return Array.from(hotkeys.values());
}

export function getOverrides(): Record<string, string> {
  return overrides;
}

export function getCustomHotkeys(): CustomHotkey[] {
  return customHotkeys;
}

function getEffectiveKeys(hotkeyId: string): string {
  return overrides[hotkeyId] ?? hotkeys.get(hotkeyId)?.keys ?? '';
}

function isEnabled(): boolean {
  return enabled;
}

export function registerHotkey(hotkey: Hotkey) {
  const next = new Map(hotkeys);
  next.set(hotkey.id, hotkey);
  hotkeys = next;
}

function unregisterHotkey(id: string) {
  const next = new Map(hotkeys);
  next.delete(id);
  hotkeys = next;
}

export function rebindHotkey(id: string, newKeys: string): void {
  overrides = { ...overrides, [id]: newKeys };
  saveOverrides();
}

export function resetHotkeyBinding(id: string): void {
  const { [id]: _removed, ...rest } = overrides;
  void _removed;
  overrides = rest;
  saveOverrides();
}

export function addCustomHotkey(custom: CustomHotkey): void {
  customHotkeys = [...customHotkeys, custom];
  saveCustomHotkeys();
}

export function removeCustomHotkey(id: string): void {
  customHotkeys = customHotkeys.filter((h) => h.id !== id);
  const { [id]: _removed, ...rest } = overrides;
  void _removed;
  overrides = rest;
  saveCustomHotkeys();
  saveOverrides();
}

function updateCustomHotkey(
  id: string,
  updates: Partial<Pick<CustomHotkey, 'name' | 'keys' | 'commandId'>>
): void {
  customHotkeys = customHotkeys.map((h) => (h.id === id ? { ...h, ...updates } : h));
  saveCustomHotkeys();
}

export function findConflict(
  keys: string,
  excludeId?: string
): { id: string; name: string } | null {
  for (const [, hk] of hotkeys) {
    if (hk.id === excludeId) continue;
    const effective = overrides[hk.id] ?? hk.keys;
    if (effective === keys) return { id: hk.id, name: hk.name };
  }
  for (const ch of customHotkeys) {
    if (ch.id === excludeId) continue;
    const effective = overrides[ch.id] ?? ch.keys;
    if (effective === keys) return { id: ch.id, name: ch.name };
  }
  return null;
}

export function resetAllBindings(): void {
  overrides = {};
  saveOverrides();
}

function executeHotkey(keys: string): boolean {
  if (!enabled) return false;
  for (const [, hk] of hotkeys) {
    const effective = overrides[hk.id] ?? hk.keys;
    if (effective === keys) {
      hk.action();
      return true;
    }
  }
  for (const ch of customHotkeys) {
    const effective = overrides[ch.id] ?? ch.keys;
    if (effective === keys) {
      import('@/hubs/core/stores/command-store.svelte')
        .then(({ executeCommand }) => {
          executeCommand(ch.commandId);
        })
        .catch(() => {
          /* command not found or import failed */
        });
      return true;
    }
  }
  return false;
}

function toggleHotkeys() {
  enabled = !enabled;
}

function normalizeEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('Cmd');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  const key = e.key;
  if (!['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }
  return parts.join('+');
}

function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  if (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  )
    return true;
  if (t.isContentEditable) return true;
  if (t.closest('.cm-editor')) return true;
  return false;
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (
    e.key === '/' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey &&
    getSettings().editor.slashCommands &&
    !isEditableTarget(e) &&
    !isPaletteOpen()
  ) {
    e.preventDefault();
    openPalette();
    return;
  }

  const combo = normalizeEvent(e);
  if (executeHotkey(combo)) {
    e.preventDefault();
  }
}

export function initHotkeys() {
  if (typeof document === 'undefined') return;
  loadOverrides();
  loadCustomHotkeys();
  document.addEventListener('keydown', handleGlobalKeydown);
}

export function destroyHotkeys() {
  if (typeof document === 'undefined') return;
  document.removeEventListener('keydown', handleGlobalKeydown);
}
