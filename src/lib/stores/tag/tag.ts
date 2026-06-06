/**
 * Tag store — manages tag hierarchy, rename, merge, visibility.
 * Phase 10: US7 (Tag Management)
 */
import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { notes } from '@/stores/vault/vault';
import type { Note } from '@/types/vault';
import { log } from '@/utils/logger';

export interface TagNode {
  name: string;
  count: number;
  children: TagNode[];
}

/** Hidden tags (excluded from graph and default views) */
export const hiddenTags = writable<Set<string>>(new Set());

/** All tags derived from vault notes */
export const allTags = derived(notes, ($notes) => {
  const tagCounts = new Map<string, number>();

  $notes.forEach((note) => {
    // Extract tags from frontmatter
    const fmTags = note.frontmatter?.tags;
    if (Array.isArray(fmTags)) {
      fmTags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }

    // Extract inline #tags from content
    const inlineTags = note.content?.match(/#([a-zA-Z0-9_/-]+)/g) || [];
    inlineTags.forEach((tag: string) => {
      const name = tag.slice(1); // Remove #
      tagCounts.set(name, (tagCounts.get(name) || 0) + 1);
    });
  });

  return tagCounts;
});

/** Tags organized into hierarchy based on / separator */
export const tagHierarchy = derived(allTags, ($allTags) => {
  const roots: TagNode[] = [];
  const nodeMap = new Map<string, TagNode>();

  // Build flat list sorted for hierarchy construction
  const sortedTags = Array.from($allTags.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [name, count] of sortedTags) {
    const parts = name.split('/');
    const node: TagNode = { name, count, children: [] };
    nodeMap.set(name, node);

    if (parts.length === 1) {
      // Root-level tag
      roots.push(node);
    } else {
      // Find parent
      const parentName = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentName);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan child — treat as root
        roots.push(node);
      }
    }
  }

  return roots;
});

/** Visible tags (excludes hidden) */
export const visibleTags = derived([tagHierarchy, hiddenTags], ([$hierarchy, $hidden]) => {
  function filterHidden(nodes: TagNode[]): TagNode[] {
    return nodes
      .filter((n) => !$hidden.has(n.name))
      .map((n) => ({
        ...n,
        children: filterHidden(n.children),
      }));
  }
  return filterHidden($hierarchy);
});

export interface RenameResult {
  notes_modified: number;
  was_merge: boolean;
  children_renamed: number;
}

/** Rename a tag across all notes */
export async function renameTag(oldName: string, newName: string): Promise<RenameResult> {
  try {
    return await invoke<RenameResult>('rename_tag', { old_name: oldName, new_name: newName });
  } catch (error) {
    log.error('Failed to rename tag', error as Error);
    throw error;
  }
}

/** Merge one tag into another */
export async function mergeTags(sourceTag: string, targetTag: string): Promise<RenameResult> {
  try {
    return await invoke<RenameResult>('merge_tags', { source_tag: sourceTag, target_tag: targetTag });
  } catch (error) {
    log.error('Failed to merge tags', error as Error);
    throw error;
  }
}

/** Persist hidden tags to localStorage */
function persistHiddenTags(tags: Set<string>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bismuth-hidden-tags', JSON.stringify(Array.from(tags)));
  }
}

/** Load hidden tags from localStorage */
export function loadHiddenTags() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bismuth-hidden-tags');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          hiddenTags.set(new Set(arr));
        }
      } catch (e) {
        log.error('Failed to load hidden tags', e as Error);
      }
    }
  }
}

/** Toggle tag visibility */
export function toggleTagVisibility(tagName: string) {
  hiddenTags.update((s: Set<string>) => {
    const next = new Set(s);
    if (next.has(tagName)) next.delete(tagName);
    else next.add(tagName);
    persistHiddenTags(next);
    return next;
  });
}

/** Hide a tag */
export function hideTag(tagName: string) {
  hiddenTags.update((s: Set<string>) => {
    const next = new Set(s);
    next.add(tagName);
    persistHiddenTags(next);
    return next;
  });
}

/** Show a hidden tag */
export function showTag(tagName: string) {
  hiddenTags.update((s: Set<string>) => {
    const next = new Set(s);
    next.delete(tagName);
    persistHiddenTags(next);
    return next;
  });
}

/**
 * Notes filtered by tag visibility.
 * Notes whose ONLY tags are hidden get excluded from the file list.
 * Notes with at least one visible tag (or no tags at all) remain visible.
 */
export const filteredNotes = derived([notes, hiddenTags], ([$notes, $hidden]: [Note[], Set<string>]) => {
  if ($hidden.size === 0) return $notes;

  return $notes.filter((note: Note) => {
    const noteTags: string[] = [];

    // Collect frontmatter tags
    const fmTags = note.frontmatter?.tags;
    if (Array.isArray(fmTags)) {
      noteTags.push(...fmTags);
    }

    // Collect inline tags
    const inlineTags = note.content?.match(/#([a-zA-Z0-9_/-]+)/g) || [];
    inlineTags.forEach((t: string) => noteTags.push(t.slice(1)));

    // If no tags at all, keep visible
    if (noteTags.length === 0) return true;

    // If ALL tags are hidden, exclude from file list
    return noteTags.some((t: string) => !$hidden.has(t));
  });
});

// Load persisted hidden tags on module init
loadHiddenTags();
