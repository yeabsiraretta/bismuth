import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export interface Template {
  name: string;
  template_type: string;
  content: string;
  description: string;
}

export interface TemplateResult {
  content: string;
  cursorOffset: number | null;
}

/** Prompt definition extracted from template content. */
export interface TemplatePrompt {
  key: string;
  label: string;
  defaultValue: string;
}

/** Extract {{prompt "label" key=default}} markers from template content. */
export function extractPrompts(content: string): TemplatePrompt[] {
  const regex = /\{\{\s*prompt\s+"([^"]+)"(?:\s+(\w+)=([^}]+))?\s*\}\}/g;
  const prompts: TemplatePrompt[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    prompts.push({
      label: match[1],
      key: match[2] || match[1].toLowerCase().replace(/\s+/g, '_'),
      defaultValue: (match[3] || '').trim(),
    });
  }
  return prompts;
}

/** Strip prompt markers from content after prompts are resolved. */
export function stripPrompts(content: string, resolved: Record<string, string>): string {
  return content.replace(
    /\{\{\s*prompt\s+"([^"]+)"(?:\s+(\w+)=([^}]+))?\s*\}\}/g,
    (_match, label: string, key?: string) => {
      const resolvedKey = key || label.toLowerCase().replace(/\s+/g, '_');
      return resolved[resolvedKey] || '';
    }
  );
}

/** Process rendered output: find $CURSOR$ marker position and strip it. */
export function processCursorMarker(rendered: string): TemplateResult {
  const marker = '$CURSOR$';
  const idx = rendered.indexOf(marker);
  if (idx === -1) return { content: rendered, cursorOffset: null };
  return {
    content: rendered.slice(0, idx) + rendered.slice(idx + marker.length),
    cursorOffset: idx,
  };
}

/** Build the full context for template rendering from note metadata. */
export function buildTemplateContext(
  targetPath: string,
  title: string,
  extra: Record<string, string> = {}
): Record<string, string> {
  const now = new Date();
  return {
    title,
    'file.path': targetPath,
    'file.title': title,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    datetime: now.toISOString().slice(0, 19).replace('T', ' '),
    ...extra,
  };
}

/** Initialize template service for a vault. */
export async function initializeTemplateService(vaultRoot: string): Promise<void> {
  try {
    await invoke<void>('initialize_template_service', { vaultRoot });
  } catch (err) {
    log.error('Failed to initialize template service', err as Error);
  }
}

/** List all available templates. */
export async function listTemplates(): Promise<Template[]> {
  try {
    return await invoke<Template[]>('list_templates');
  } catch (err) {
    log.error('Failed to list templates', err as Error);
    return [];
  }
}

/** Render a template with context. */
export async function renderTemplate(
  content: string,
  context: Record<string, string>
): Promise<string> {
  return invoke<string>('render_template', { content, context });
}

/** Render and process a template (handles prompts and cursor). */
export async function renderTemplateAdvanced(
  content: string,
  context: Record<string, string>,
  promptAnswers: Record<string, string> = {}
): Promise<TemplateResult> {
  const processed = stripPrompts(content, promptAnswers);
  const merged = { ...context, ...promptAnswers };
  const rendered = await renderTemplate(processed, merged);
  return processCursorMarker(rendered);
}

/** Create a note from a named template. */
export async function createFromTemplate(
  templateName: string,
  targetPath: string,
  context: Record<string, string>
): Promise<string> {
  return invoke<string>('create_from_template', { templateName, targetPath, context });
}

/** Save a template to the vault. */
export async function saveTemplate(
  name: string,
  content: string,
  templateType: string = 'custom',
  description: string = ''
): Promise<void> {
  return invoke<void>('save_template', { name, content, templateType, description });
}

/** Delete a template. */
export async function deleteTemplate(name: string): Promise<void> {
  return invoke<void>('delete_template', { name });
}
