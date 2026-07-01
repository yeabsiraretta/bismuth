/**
 * TemplatePanel logic — CRUD operations, template execution, and prompt handling.
 * Extracted from TemplatePanel.svelte for 300-line compliance.
 */

import {
  createFromTemplate,
  extractPrompts,
  renderTemplateAdvanced,
  buildTemplateContext,
  saveTemplate,
  deleteTemplate,
  type Template,
  type TemplatePrompt,
} from '../services/template';
import { templates, refreshTemplates } from '../stores/template';
import { currentVault } from '@/stores/vault/vault';
import { openNote } from '@/appNavigation';
import { log } from '@/utils/logger';
import { get } from 'svelte/store';

export type PanelView = 'list' | 'editor' | 'prompts';

export const DEFAULT_TEMPLATE_CONTENT = '---\ntitle: {{title}}\ndate: {{date.today}}\ntags: []\n---\n\n# {{title}}\n\n{{system.cursor}}\n';

export async function handleSaveTemplate(name: string, content: string, description: string): Promise<boolean> {
  if (!name.trim()) return false;
  try {
    await saveTemplate(name.trim(), content, 'custom', description);
    await refreshTemplates();
    return true;
  } catch (err) {
    log.error('Failed to save template', err as Error);
    return false;
  }
}

export async function handleDeleteTemplate(tmpl: Template): Promise<void> {
  try {
    await deleteTemplate(tmpl.name);
    await refreshTemplates();
  } catch (err) {
    log.error('Failed to delete template', err as Error);
  }
}

export function getPromptsForTemplate(tmpl: Template): TemplatePrompt[] {
  return extractPrompts(tmpl.content);
}

export async function executeTemplate(
  templateName: string,
  promptAnswers: Record<string, string>
): Promise<void> {
  const vault = get(currentVault);
  if (!vault) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const title = promptAnswers['title'] || `Untitled ${timestamp}`;
  const targetPath = `${vault.root_path}/${title}.md`;
  const context = buildTemplateContext(targetPath, title, promptAnswers);
  try {
    const allTemplates = get(templates);
    const tmpl = allTemplates.find(t => t.name === templateName);
    if (tmpl) {
      const result = await renderTemplateAdvanced(tmpl.content, context, promptAnswers);
      await createFromTemplate(templateName, targetPath, context);
      await openNote(targetPath);
      log.info('Template applied', { template: templateName, cursor: result.cursorOffset });
    }
  } catch (err) {
    log.error('Failed to create from template', err as Error);
  }
}
