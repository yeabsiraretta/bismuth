/**
 * TagPanel logic — tag operations extracted for 300-line compliance.
 */

import { invoke } from '@tauri-apps/api/core';
import {
  renameTag as renameTagAction,
  mergeTags as mergeTagsAction,
  toggleTagVisibility,
  showTag,
  type TagNode,
} from '@/stores/tag/tag';

export { type TagNode };

export async function renameTagOp(
  oldName: string,
  closeContextMenu: () => void
): Promise<void> {
  const newName = prompt(`Rename tag "${oldName}" to:`, oldName);
  if (newName && newName !== oldName) {
    try {
      const result = await renameTagAction(oldName, newName);
      if (result?.was_merge) {
        console.info(`Tag merged: "${oldName}" into existing "${newName}"`);
      }
    } catch (error) {
      console.error('Failed to rename tag:', error);
    }
  }
  closeContextMenu();
}

export async function mergeTagOp(
  sourceTag: string,
  closeContextMenu: () => void
): Promise<void> {
  const targetTag = prompt(`Merge tag "${sourceTag}" into (target tag):`, '');
  if (targetTag && targetTag !== sourceTag) {
    const confirmed = confirm(
      `This will merge all occurrences of "${sourceTag}" into "${targetTag}". This cannot be undone. Continue?`
    );
    if (confirmed) {
      try {
        await mergeTagsAction(sourceTag, targetTag);
      } catch (error) {
        console.error('Failed to merge tags:', error);
      }
    }
  }
  closeContextMenu();
}

export async function createTagPage(
  tagName: string,
  onOpenNote: ((path: string) => void) | undefined,
  closeContextMenu: () => void
): Promise<void> {
  try {
    const notePath = `tags/${tagName.replace(/\//g, '-')}.md`;
    const content = `---\ntags: [${tagName}]\naliases: ["#${tagName}"]\n---\n\n# ${tagName}\n\nTag page for #${tagName}.\n`;
    await invoke('create_note', { path: notePath, content });
    onOpenNote?.(notePath);
  } catch (error) {
    console.error('Failed to create tag page:', error);
  }
  closeContextMenu();
}

export async function openRandomNoteWithTag(
  tagName: string,
  onOpenNote: ((path: string) => void) | undefined,
  closeContextMenu: () => void
): Promise<void> {
  try {
    const path = await invoke<string>('get_random_note_with_tag', { tag: tagName });
    onOpenNote?.(path);
  } catch (error) {
    console.error('Failed to get random note:', error);
  }
  closeContextMenu();
}

export function hideTagOp(tagName: string, closeContextMenu: () => void): void {
  toggleTagVisibility(tagName);
  closeContextMenu();
}

export function unhideTagOp(tagName: string): void {
  showTag(tagName);
}

export function filterNodes(nodes: TagNode[], query: string): TagNode[] {
  if (!query) return nodes;
  const lower = query.toLowerCase();
  return nodes.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.children.some((c: TagNode) => c.name.toLowerCase().includes(lower))
  );
}
