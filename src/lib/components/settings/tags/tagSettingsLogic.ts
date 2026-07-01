import { getAllTags, getTagStats, renameTagService as renameTag, mergeTagsService as mergeTags, createTagPage, type TagInfo, type TagStats } from '@/features/tag';
import { get } from 'svelte/store';
import { currentVault } from '@/stores/vault/vault';
import { log } from '@/utils/logger';

export type { TagInfo, TagStats };

export interface TagSettingsState {
  tags: TagInfo[];
  loading: boolean;
  filter: string;
}

export async function loadTags(): Promise<TagInfo[]> {
  const vault = get(currentVault);
  if (!vault?.root_path) return [];
  try {
    return await getAllTags(vault.root_path);
  } catch (err) {
    log.error('Failed to load tags for settings', err as Error);
    return [];
  }
}

export async function handleRename(oldName: string, newName: string): Promise<boolean> {
  try {
    await renameTag(oldName, newName);
    log.info('Tag renamed', { oldName, newName });
    return true;
  } catch (err) {
    log.error('Tag rename failed', err as Error);
    return false;
  }
}

export async function handleMerge(source: string, target: string): Promise<boolean> {
  try {
    await mergeTags(source, target);
    log.info('Tags merged', { source, target });
    return true;
  } catch (err) {
    log.error('Tag merge failed', err as Error);
    return false;
  }
}

export async function handleCreatePage(tag: string): Promise<boolean> {
  const path = `tags/${tag.replace(/[/\\]/g, '-')}.md`;
  const content = `---\ntag: ${tag}\n---\n\n# ${tag}\n\nNotes tagged with #${tag}.\n`;
  try {
    await createTagPage(path, content);
    log.info('Tag page created', { tag, path });
    return true;
  } catch (err) {
    log.error('Tag page creation failed', err as Error);
    return false;
  }
}

export function filterTags(tags: TagInfo[], query: string): TagInfo[] {
  if (!query) return tags;
  const q = query.toLowerCase();
  return tags.filter((t) => t.name.toLowerCase().includes(q));
}

export async function loadTagStats(): Promise<TagStats | null> {
  const vault = get(currentVault);
  if (!vault?.root_path) return null;
  try {
    return await getTagStats(vault.root_path);
  } catch (err) {
    log.error('Failed to load tag stats', err as Error);
    return null;
  }
}
