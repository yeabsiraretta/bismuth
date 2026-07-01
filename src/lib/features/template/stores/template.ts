import { writable, derived, get } from 'svelte/store';
import { listTemplates, renderTemplate, buildTemplateContext, type Template } from '../services/template';
import { currentVault, refreshNotes } from '@/stores/vault/vault';
import { openNote } from '@/appNavigation';
import { writeNote } from '@/services/vault/vault';
import { log } from '@/utils/logger';

const FAVORITES_KEY = 'bismuth-template-favorites';

export const templates = writable<Template[]>([]);
export const activeTemplate = writable<Template | null>(null);
export const templateLoading = writable(false);

/** User's favorite template names */
export const favoriteTemplates = writable<string[]>(loadFavorites());

/** Derived: templates grouped by type (category) */
export const templatesByCategory = derived(templates, ($t) => {
  const grouped: Record<string, Template[]> = {};
  for (const tmpl of $t) {
    const cat = tmpl.template_type || 'custom';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(tmpl);
  }
  return grouped;
});

/** Derived: favorited templates */
export const pinnedTemplates = derived(
  [templates, favoriteTemplates],
  ([$t, $fav]) => $t.filter(t => $fav.includes(t.name))
);

/** Load all templates from backend. */
export async function refreshTemplates(): Promise<void> {
  templateLoading.set(true);
  try {
    const list = await listTemplates();
    templates.set(list);
  } catch (err) {
    log.error('Failed to refresh templates', err as Error);
  } finally {
    templateLoading.set(false);
  }
}

/** Toggle a template as favorite */
export function toggleFavorite(name: string): void {
  favoriteTemplates.update(favs => {
    const next = favs.includes(name) ? favs.filter(f => f !== name) : [...favs, name];
    saveFavorites(next);
    return next;
  });
}

/** Expand template variables in content for insert-at-cursor */
export async function expandTemplateVariables(
  content: string,
  notePath: string,
  noteTitle: string
): Promise<string> {
  const context = buildTemplateContext(notePath, noteTitle);
  try {
    return await renderTemplate(content, context);
  } catch {
    return expandLocalVariables(content, context);
  }
}

/** Local-only variable expansion (fallback when IPC unavailable) */
function expandLocalVariables(content: string, context: Record<string, string>): string {
  return content.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, key: string) => {
    if (key === 'date' || key === 'date.today') return context['date'] || '';
    if (key === 'time') return context['time'] || '';
    if (key === 'datetime') return context['datetime'] || '';
    if (key === 'title' || key === 'file.title') return context['file.title'] || '';
    if (key === 'vault') return '';
    return match;
  });
}

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Insert a template's content at the active editor cursor position. */
export async function insertTemplateAtCursor(tmpl: import('../services/template').Template): Promise<void> {
  try {
    const context = buildTemplateContext('', tmpl.name);
    const rendered = await renderTemplate(tmpl.content, context);
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: rendered } }));
    log.info('Template inserted at cursor', { name: tmpl.name });
  } catch (err) {
    // Fallback: insert raw content
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: tmpl.content } }));
    log.warn('Template render failed, inserting raw content', { err });
  }
}

function saveFavorites(favs: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) { log.warn('Failed to persist template favorites to localStorage', { error: String(e) }); }
}

/**
 * Create a new note from the named template and open it in the editor.
 * Uses the template's content rendered with date/title context.
 */
export async function autoCreateFromTemplate(templateId: string): Promise<void> {
  const vault = get(currentVault);
  if (!vault) {
    log.warn('autoCreateFromTemplate: no vault open');
    return;
  }

  const allTemplates = get(templates);
  const tmpl = allTemplates.find(t => t.name === templateId);
  if (!tmpl) {
    log.warn('autoCreateFromTemplate: template not found', { templateId });
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const title = `${tmpl.name} ${timestamp}`;
  const targetPath = `${vault.root_path}/${title}.md`;
  const context = buildTemplateContext(targetPath, title);

  try {
    const rendered = await renderTemplate(tmpl.content, context);
    await writeNote(targetPath, rendered);
    await refreshNotes();
    await openNote(targetPath);
    log.info('autoCreateFromTemplate: note created', { templateId, path: targetPath });
  } catch (err) {
    log.error('autoCreateFromTemplate failed', err as Error);
  }
}
