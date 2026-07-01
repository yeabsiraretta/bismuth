/**
 * Story store — manages active story, configuration, and dashboard state.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { Story, StorytellerConfig, DashboardView } from '../types/story';
import { DEFAULT_STORYTELLER_CONFIG } from '../types/story';
import * as svc from '../services/storyService';

export const storytellerConfig = writable<StorytellerConfig>(svc.loadConfig());
export const stories = writable<Story[]>(svc.loadStories());
export const activeStoryId = writable<string | null>(null);
export const dashboardView = writable<DashboardView>('stories');

export const activeStory = derived([stories, activeStoryId], ([$stories, $id]) =>
  $stories.find(s => s.id === $id) ?? null,
);

export const isOneStoryMode = derived(storytellerConfig, ($cfg) => $cfg.oneStoryMode);

export function selectStory(id: string): void {
  activeStoryId.set(id);
  dashboardView.set('entities');
}

export function addStory(name: string): Story {
  let cfg: StorytellerConfig = DEFAULT_STORYTELLER_CONFIG;
  storytellerConfig.subscribe(c => { cfg = c; })();
  const story = svc.createStory(name, cfg);
  stories.update(list => {
    const next = [...list, story];
    svc.persistStories(next);
    return next;
  });
  activeStoryId.set(story.id);
  dashboardView.set('entities');
  log.info('Story created', { name: story.name });
  return story;
}

export function removeStory(storyId: string): void {
  stories.update(list => {
    const next = svc.deleteStory(list, storyId);
    svc.persistStories(next);
    return next;
  });
  activeStoryId.update(id => id === storyId ? null : id);
}

export function editStory(updated: Story): void {
  stories.update(list => {
    const next = svc.updateStory(list, updated);
    svc.persistStories(next);
    return next;
  });
}

export function updateConfig(partial: Partial<StorytellerConfig>): void {
  storytellerConfig.update(cfg => {
    const next = { ...cfg, ...partial };
    svc.saveConfig(next);
    return next;
  });
}

export function resetConfig(): void {
  svc.saveConfig(DEFAULT_STORYTELLER_CONFIG);
  storytellerConfig.set({ ...DEFAULT_STORYTELLER_CONFIG });
}

export function setDashboardView(view: DashboardView): void {
  dashboardView.set(view);
}
