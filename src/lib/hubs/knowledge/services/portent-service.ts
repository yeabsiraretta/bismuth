/**
 * Portent Service — resolve Portent types from note frontmatter,
 * classify notes, and query the vault by type/lifecycle/relationship.
 *
 * Reads `type`, `organized`, `archived`, `belongs_to`, `related_to`
 * from YAML frontmatter and inline fields to build PortentObjects.
 */

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { extractMetadata } from '@/hubs/editor/services/metadata-extractor';
import { parseInlineFields } from '@/hubs/knowledge/services/note-index';
import {
  isLifecycleState,
  isPortentType,
  isPortType,
  type LifecycleState,
  type PortentObject,
  type PortentRelationship,
  type PortentType,
} from '@/hubs/knowledge/types/portent-types';

// ── Wikilink extraction from relationship values ─────────────────────────────

const WIKILINK_VALUE_RE = /\[\[([^\]]+)\]\]/g;

function extractLinkTargets(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(extractLinkTargets);

  const str = String(value);
  const targets: string[] = [];
  let match: RegExpExecArray | null;

  WIKILINK_VALUE_RE.lastIndex = 0;
  while ((match = WIKILINK_VALUE_RE.exec(str)) !== null) {
    targets.push(match[1].trim());
  }

  if (targets.length === 0 && str.trim()) {
    targets.push(str.trim());
  }
  return targets;
}

// ── Lifecycle resolution ─────────────────────────────────────────────────────

function resolveLifecycle(fm: Record<string, unknown>): {
  state: LifecycleState;
  organized: boolean;
  archived: boolean;
} {
  const statusRaw = fm['status'] ?? fm['lifecycle'];
  if (typeof statusRaw === 'string') {
    const lower = statusRaw.toLowerCase();
    if (isLifecycleState(lower)) {
      return {
        state: lower,
        organized: lower === 'organized',
        archived: lower === 'archived',
      };
    }
  }

  const archived = fm['archived'] === true || fm['archived'] === 'true';
  const organized = fm['organized'] === true || fm['organized'] === 'true';

  if (archived) return { state: 'archived', organized: true, archived: true };
  if (organized) return { state: 'organized', organized: true, archived: false };
  return { state: 'captured', organized: false, archived: false };
}

// ── PortentObject builder ────────────────────────────────────────────────────

export function buildPortentObject(path: string, content: string): PortentObject | null {
  const meta = extractMetadata(content);
  const fields = parseInlineFields(content);

  const fm: Record<string, unknown> = {
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.tags.length ? { tags: meta.tags } : {}),
    ...meta.custom,
  };

  for (const f of fields) {
    if (!(f.key in fm)) fm[f.key] = f.value;
  }

  const typeRaw = String(fm['type'] ?? '').toLowerCase();
  if (!isPortentType(typeRaw)) return null;

  const lifecycle = resolveLifecycle(fm);

  const belongsTo = extractLinkTargets(fm['belongs_to'] ?? fm['belongsTo']);
  const relatedTo = extractLinkTargets(fm['related_to'] ?? fm['relatedTo']);

  const title = meta.title || path.split('/').pop()?.replace(/\.md$/, '') || path;

  return {
    path,
    title,
    type: typeRaw as PortentType,
    lifecycle: lifecycle.state,
    organized: lifecycle.organized,
    archived: lifecycle.archived,
    belongsTo,
    relatedTo,
    tags: meta.tags,
    content,
  };
}

// ── Vault-wide queries ───────────────────────────────────────────────────────

export function getAllPortentObjects(): PortentObject[] {
  const notes = getNotes();
  const objects: PortentObject[] = [];

  for (const note of notes) {
    const content = getCachedContent(note.path);
    if (content === undefined) continue;
    const obj = buildPortentObject(note.path, content);
    if (obj) objects.push(obj);
  }

  return objects;
}

function getPortentObjectsByType(type: PortentType): PortentObject[] {
  return getAllPortentObjects().filter((o) => o.type === type);
}

function getPortentObjectsByGroup(group: 'PORT' | 'ENTP'): PortentObject[] {
  return getAllPortentObjects().filter((o) =>
    group === 'PORT' ? isPortType(o.type) : !isPortType(o.type)
  );
}

function getPortentObjectsByLifecycle(state: LifecycleState): PortentObject[] {
  return getAllPortentObjects().filter((o) => o.lifecycle === state);
}

function getActivePortentObjects(): PortentObject[] {
  return getAllPortentObjects().filter((o) => !o.archived);
}

function getRelationships(obj: PortentObject): PortentRelationship[] {
  const rels: PortentRelationship[] = [];
  for (const target of obj.belongsTo) {
    rels.push({ type: 'belongs_to', target });
  }
  for (const target of obj.relatedTo) {
    rels.push({ type: 'related_to', target });
  }
  return rels;
}

function findObjectsRelatedTo(title: string): PortentObject[] {
  const lower = title.toLowerCase();
  return getAllPortentObjects().filter(
    (o) =>
      o.belongsTo.some((t) => t.toLowerCase() === lower) ||
      o.relatedTo.some((t) => t.toLowerCase() === lower)
  );
}

export function findObjectsBelongingTo(title: string): PortentObject[] {
  const lower = title.toLowerCase();
  return getAllPortentObjects().filter((o) => o.belongsTo.some((t) => t.toLowerCase() === lower));
}
