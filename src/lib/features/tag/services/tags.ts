import { invoke } from '@tauri-apps/api/core';

export interface TagInfo {
  name: string;
  count: number;
  notes: string[];
}

export interface TagStats {
  total_tags: number;
  total_tagged_notes: number;
  tags: TagInfo[];
}

export interface RenameResult {
  notes_modified: number;
  was_merge: boolean;
  children_renamed: number;
}

/**
 * Creates a tag page note for a given tag.
 * @param path - Relative path for the tag page note.
 * @param content - Initial markdown content for the tag page.
 */
export async function createTagPage(path: string, content: string): Promise<void> {
  try {
    await invoke('create_note', { path, content });
  } catch (error) {
    throw new Error(`Failed to create tag page: ${error}`);
  }
}

/**
 * Gets all tags in the vault, sorted by frequency.
 */
export async function getAllTags(vaultPath: string): Promise<TagInfo[]> {
  try {
    return await invoke<TagInfo[]>('get_all_tags', { vaultPath });
  } catch (error) {
    throw new Error(`Failed to get all tags: ${error}`);
  }
}

/**
 * Gets paths of notes tagged with a specific tag.
 */
export async function getNotesByTag(tag: string, vaultPath: string): Promise<string[]> {
  try {
    return await invoke<string[]>('get_notes_by_tag', { tag, vaultPath });
  } catch (error) {
    throw new Error(`Failed to get notes by tag: ${error}`);
  }
}

/**
 * Gets aggregate tag statistics.
 */
export async function getTagStats(vaultPath: string): Promise<TagStats> {
  try {
    return await invoke<TagStats>('get_tag_stats', { vaultPath });
  } catch (error) {
    throw new Error(`Failed to get tag stats: ${error}`);
  }
}

/**
 * Searches tags by substring (case-insensitive).
 */
export async function searchTags(query: string, vaultPath: string): Promise<TagInfo[]> {
  try {
    return await invoke<TagInfo[]>('search_tags', { query, vaultPath });
  } catch (error) {
    throw new Error(`Failed to search tags: ${error}`);
  }
}

/**
 * Renames a tag across all vault notes.
 */
export async function renameTag(oldName: string, newName: string): Promise<RenameResult> {
  try {
    return await invoke<RenameResult>('rename_tag', { oldName, newName });
  } catch (error) {
    throw new Error(`Failed to rename tag: ${error}`);
  }
}

/**
 * Merges source tag into target tag.
 */
export async function mergeTags(sourceTag: string, targetTag: string): Promise<RenameResult> {
  try {
    return await invoke<RenameResult>('merge_tags', { sourceTag, targetTag });
  } catch (error) {
    throw new Error(`Failed to merge tags: ${error}`);
  }
}

/**
 * Gets a random note that has a specific tag.
 * @param tag - Tag name to filter by.
 * @returns The path to a random note with the specified tag.
 */
export async function getRandomNoteWithTag(tag: string): Promise<string> {
  try {
    return await invoke<string>('get_random_note_with_tag', { tag });
  } catch (error) {
    throw new Error(`Failed to get random note with tag: ${error}`);
  }
}
