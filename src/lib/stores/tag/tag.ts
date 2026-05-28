/**
 * Tag store — manages tag hierarchy, rename, merge, visibility.
 * Phase 10: US7 (Tag Management)
 */
import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { notes } from '@/stores/vault/vault';

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

/** Rename a tag across all notes */
export async function renameTag(oldName: string, newName: string): Promise<void> {
  try {
    await invoke('rename_tag', { old_name: oldName, new_name: newName });
  } catch (error) {
    console.error('Failed to rename tag:', error);
    throw error;
  }
}

/** Merge one tag into another */
export async function mergeTags(sourceTag: string, targetTag: string): Promise<void> {
  try {
    await invoke('merge_tags', { source_tag: sourceTag, target_tag: targetTag });
  } catch (error) {
    console.error('Failed to merge tags:', error);
    throw error;
  }
}

/** Toggle tag visibility */
export function toggleTagVisibility(tagName: string) {
  hiddenTags.update((s) => {
    const next = new Set(s);
    if (next.has(tagName)) next.delete(tagName);
    else next.add(tagName);
    return next;
  });
}

/** Hide a tag */
export function hideTag(tagName: string) {
  hiddenTags.update((s) => {
    const next = new Set(s);
    next.add(tagName);
    return next;
  });
}

/** Show a hidden tag */
export function showTag(tagName: string) {
  hiddenTags.update((s) => {
    const next = new Set(s);
    next.delete(tagName);
    return next;
  });
}
