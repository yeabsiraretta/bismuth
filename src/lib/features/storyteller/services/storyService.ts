/**
 * Story management service — CRUD for stories and vault-level operations.
 * Data is stored as markdown files with YAML frontmatter.
 */

import { log } from '@/utils/logger';
import type { Story, StorytellerConfig } from '../types/story';
import { DEFAULT_STORYTELLER_CONFIG } from '../types/story';
import type { EntityType } from '../types/entity';
import { ENTITY_TYPE_META } from '../types/entity';

const CONFIG_KEY = 'bismuth-storyteller-config';
const STORIES_KEY = 'bismuth-storyteller-stories';

export function loadConfig(): StorytellerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_STORYTELLER_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_STORYTELLER_CONFIG };
  } catch { return { ...DEFAULT_STORYTELLER_CONFIG }; }
}

export function saveConfig(config: StorytellerConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch (e) { log.warn('Failed to save storyteller config', { error: String(e) }); }
}

export function loadStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistStories(stories: Story[]): void {
  try { localStorage.setItem(STORIES_KEY, JSON.stringify(stories)); }
  catch (e) { log.warn('Failed to persist stories', { error: String(e) }); }
}

export function createStory(name: string, config: StorytellerConfig): Story {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rootPath = config.oneStoryMode
    ? config.rootFolder
    : `${config.rootFolder}/Stories/${name}`;
  const story: Story = {
    id, name, description: '', rootPath,
    createdAt: now, modifiedAt: now,
    wordCount: 0, entityCounts: {},
  };
  return story;
}

export function getEntityFolderPath(story: Story, entityType: EntityType, config: StorytellerConfig): string {
  const customFolder = config.customFolders[entityType];
  if (customFolder) return customFolder;
  const meta = ENTITY_TYPE_META.find(m => m.type === entityType);
  return `${story.rootPath}/${meta?.folderName ?? entityType}`;
}

export function deleteStory(stories: Story[], storyId: string): Story[] {
  return stories.filter(s => s.id !== storyId);
}

export function updateStory(stories: Story[], updated: Story): Story[] {
  return stories.map(s => s.id === updated.id ? { ...updated, modifiedAt: new Date().toISOString() } : s);
}
