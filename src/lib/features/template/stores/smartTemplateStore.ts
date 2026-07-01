/**
 * Smart Template store — config persistence, prompt history,
 * and workflow state for the context-first prompt builder.
 */

import { writable, derived, get } from 'svelte/store';
import type { SmartTemplateConfig, SmartTemplate, BuiltPrompt, PromptContext } from '../types/smartTemplate';
import { DEFAULT_SMART_TEMPLATE_CONFIG } from '../types/smartTemplate';
import { discoverTemplates } from '../services/templateDiscovery';
import { buildPrompt, buildContextFromNote, stripFrontmatter } from '../services/promptBuilder';
import { activeNote } from '@/stores/vault/vault';
import { log } from '@/utils/logger';

const CONFIG_KEY = 'bismuth:smart-template-config';
const RECENT_KEY = 'bismuth:smart-template-recent';

// ─── Config persistence ────────────────────────────────────────────────────────

function loadConfig(): SmartTemplateConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_SMART_TEMPLATE_CONFIG, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_SMART_TEMPLATE_CONFIG };
}

function persistConfig(config: SmartTemplateConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch { /* ignore */ }
}

const configStore = writable<SmartTemplateConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const smartTemplateConfig = derived(configStore, $c => $c);

export function updateSmartTemplateConfig(partial: Partial<SmartTemplateConfig>): void {
  configStore.update(c => ({ ...c, ...partial }));
}

export function resetSmartTemplateConfig(): void {
  configStore.set({ ...DEFAULT_SMART_TEMPLATE_CONFIG });
}

export function getSmartTemplateConfig(): SmartTemplateConfig {
  return get(configStore);
}

// ─── Template discovery ────────────────────────────────────────────────────────

export const availableSmartTemplates = writable<SmartTemplate[]>([]);
export const smartTemplatesLoading = writable(false);

export async function refreshSmartTemplates(): Promise<void> {
  smartTemplatesLoading.set(true);
  try {
    const config = get(configStore);
    const templates = await discoverTemplates(config);
    availableSmartTemplates.set(templates);
  } catch (err) {
    log.error('Failed to discover smart templates', err as Error);
  } finally {
    smartTemplatesLoading.set(false);
  }
}

// ─── Context building ──────────────────────────────────────────────────────────

/** Build context from the active note, optionally using a selection. */
export function buildCurrentContext(selection?: string): PromptContext | null {
  const note = get(activeNote);
  if (!note) return null;
  const rawContent = note.content || '';
  const cleanContent = stripFrontmatter(rawContent);
  return buildContextFromNote(note.title, note.path, cleanContent, selection);
}

// ─── Prompt building ───────────────────────────────────────────────────────────

/** Build a prompt from current context, templates, and instructions. */
export function buildSmartPrompt(
  context: PromptContext,
  selectedTemplates: SmartTemplate[],
  instructions: string,
): BuiltPrompt {
  const config = get(configStore);
  return buildPrompt(context, selectedTemplates, instructions, config.maxContextLength);
}

// ─── Recent prompts ────────────────────────────────────────────────────────────

function loadRecent(): BuiltPrompt[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistRecent(recent: BuiltPrompt[]): void {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); }
  catch { /* ignore */ }
}

export const recentPrompts = writable<BuiltPrompt[]>(loadRecent());

export function addRecentPrompt(prompt: BuiltPrompt): void {
  const config = get(configStore);
  recentPrompts.update(list => {
    const next = [prompt, ...list].slice(0, config.recentLimit);
    persistRecent(next);
    return next;
  });
}

export function clearRecentPrompts(): void {
  recentPrompts.set([]);
  persistRecent([]);
}
