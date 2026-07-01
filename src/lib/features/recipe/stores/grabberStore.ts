/**
 * Recipe Grabber store — manages grab state, settings, and the grab action.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { RecipeGrabberConfig, GrabberState, GrabbedRecipeData } from '../types';
import { DEFAULT_GRABBER_CONFIG, DEFAULT_GRABBER_STATE } from '../types';
import { fetchRecipeFromUrl, recipeToFilename } from '../services/recipeGrabber';
import { applyRecipeTemplate } from '../services/recipeTemplate';

const CONFIG_KEY = 'bismuth:recipe-grabber-config';

function loadConfig(): RecipeGrabberConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_GRABBER_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_GRABBER_CONFIG };
}

function saveConfig(cfg: RecipeGrabberConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    log.warn('grabberStore: failed to persist config');
  }
}

const configInternal = writable<RecipeGrabberConfig>(loadConfig());
const stateInternal = writable<GrabberState>({ ...DEFAULT_GRABBER_STATE });
const lastGrabbedInternal = writable<GrabbedRecipeData | null>(null);

/** Current grabber configuration. */
export const grabberConfig = derived(configInternal, ($c) => $c);

/** Current grab operation state. */
export const grabberState = derived(stateInternal, ($s) => $s);

/** Last successfully grabbed recipe data (raw). */
export const lastGrabbedRecipe = derived(lastGrabbedInternal, ($r) => $r);

/** Update grabber config and persist. */
export function updateGrabberConfig(patch: Partial<RecipeGrabberConfig>): void {
  configInternal.update((c) => {
    const next = { ...c, ...patch };
    saveConfig(next);
    return next;
  });
}

/** Reset template to default. */
export function resetTemplate(): void {
  updateGrabberConfig({ template: DEFAULT_GRABBER_CONFIG.template });
}

/**
 * Grab a recipe from a URL. Returns rendered markdown or throws.
 */
export async function grabRecipeFromUrl(url: string): Promise<string> {
  stateInternal.set({ isGrabbing: true, lastError: '', lastGrabbedUrl: url });
  try {
    const data = await fetchRecipeFromUrl(url);
    lastGrabbedInternal.set(data);
    let config: RecipeGrabberConfig = DEFAULT_GRABBER_CONFIG;
    configInternal.subscribe((c) => {
      config = c;
    })();
    const markdown = applyRecipeTemplate(config.template, data);
    stateInternal.update((s) => ({ ...s, isGrabbing: false }));
    log.info('grabberStore: recipe grabbed', { name: data.name, url });
    return markdown;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stateInternal.set({ isGrabbing: false, lastError: msg, lastGrabbedUrl: url });
    log.error('grabberStore: grab failed', new Error(msg), { url });
    throw err;
  }
}

/**
 * Grab a recipe and create a new note with the result.
 * Returns the created note path.
 */
export async function grabRecipeAsNote(url: string): Promise<string> {
  const data = await fetchRecipeFromUrl(url);
  lastGrabbedInternal.set(data);
  let config: RecipeGrabberConfig = DEFAULT_GRABBER_CONFIG;
  configInternal.subscribe((c) => {
    config = c;
  })();
  const markdown = applyRecipeTemplate(config.template, data);
  const filename = recipeToFilename(data.name);
  const { writeNote, refreshNotes } = await import('@/services/vault/vault');
  const { currentVault } = await import('@/stores/vault/vault');
  const { get } = await import('svelte/store');
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');
  const path = `${filename}.md`;
  await writeNote(path, markdown);
  await refreshNotes();
  stateInternal.update((s) => ({ ...s, isGrabbing: false }));
  log.info('grabberStore: recipe note created', { path, name: data.name });
  return path;
}
