/**
 * Template discovery — find templates from configured folders,
 * tagged notes, built-in defaults, and the Obsidian Templates folder.
 *
 * Discovery sources (in order):
 * 1. Configured template folders
 * 2. Notes with `smart_template: true` in frontmatter
 * 3. Built-in defaults (Add tags, Create summary, etc.)
 * 4. Obsidian Templates folder fallback
 */

import type { SmartTemplate, SmartTemplateConfig } from '../types/smartTemplate';
import { BUILTIN_TEMPLATES } from '../types/smartTemplate';
import { listTemplates, type Template } from './template';
import { log } from '@/utils/logger';

// ─── Discovery ─────────────────────────────────────────────────────────────────

/** Discover all available smart templates from all sources. */
export async function discoverTemplates(config: SmartTemplateConfig): Promise<SmartTemplate[]> {
  const templates: SmartTemplate[] = [];

  // 1. Templates from existing template service (covers configured folders)
  try {
    const vaultTemplates = await listTemplates();
    for (const t of vaultTemplates) {
      templates.push(vaultTemplateToSmart(t));
    }
  } catch (err) {
    log.warn('Smart Templates: failed to list vault templates', { err });
  }

  // 2. Built-in defaults
  if (config.includeBuiltins) {
    for (const builtin of BUILTIN_TEMPLATES) {
      // Don't add if a vault template with the same name exists
      if (!templates.some(t => t.name === builtin.name)) {
        templates.push(builtin);
      }
    }
  }

  return templates;
}

/** Convert a vault Template to SmartTemplate. */
function vaultTemplateToSmart(t: Template): SmartTemplate {
  return {
    name: t.name,
    content: t.content,
    source: 'folder',
    description: t.description || undefined,
  };
}

// ─── Frontmatter tag detection ─────────────────────────────────────────────────

/** Check if note content has `smart_template: true` in frontmatter. */
export function isSmartTemplate(content: string): boolean {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  return /smart_template:\s*true/i.test(match[1]);
}

/** Extract template content from a smart-template note (everything after frontmatter). */
export function extractSmartTemplateContent(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

/** Extract description from frontmatter `description:` field. */
export function extractDescription(content: string): string | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return undefined;
  const descMatch = match[1].match(/description:\s*["']?(.+?)["']?\s*$/m);
  return descMatch ? descMatch[1].trim() : undefined;
}

// ─── Search / filter ───────────────────────────────────────────────────────────

/** Filter templates by search query. */
export function filterTemplates(
  templates: SmartTemplate[],
  query: string,
): SmartTemplate[] {
  if (!query.trim()) return templates;
  const q = query.toLowerCase();
  return templates.filter(t =>
    t.name.toLowerCase().includes(q)
    || (t.description ?? '').toLowerCase().includes(q)
    || t.source.includes(q),
  );
}

/** Group templates by source. */
export function groupBySource(
  templates: SmartTemplate[],
): Record<string, SmartTemplate[]> {
  const groups: Record<string, SmartTemplate[]> = {};
  for (const t of templates) {
    const key = t.source;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return groups;
}

/** Source display labels. */
export const SOURCE_LABELS: Record<string, string> = {
  folder: 'Vault Templates',
  tagged: 'Smart Templates',
  builtin: 'Built-in',
  vault: 'Obsidian Templates',
};
