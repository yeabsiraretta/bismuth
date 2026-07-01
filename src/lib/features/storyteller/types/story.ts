/**
 * Storyteller Suite — Story and project-level types.
 */

export interface StorytellerConfig {
  rootFolder: string;
  oneStoryMode: boolean;
  imageUploadFolder: string;
  defaultStoryId: string | null;
  customFolders: Record<string, string>;
  timelineProperty: string;
  timelineTag: string;
}

export const DEFAULT_STORYTELLER_CONFIG: StorytellerConfig = {
  rootFolder: 'StorytellerSuite',
  oneStoryMode: false,
  imageUploadFolder: 'StorytellerSuite/GalleryUploads',
  defaultStoryId: null,
  customFolders: {},
  timelineProperty: 'story-date',
  timelineTag: '#timeline',
};

export interface Story {
  id: string;
  name: string;
  description: string;
  rootPath: string;
  createdAt: string;
  modifiedAt: string;
  wordCount: number;
  entityCounts: Record<string, number>;
}

export type DashboardView =
  | 'stories' | 'entities' | 'timeline' | 'campaign'
  | 'compile' | 'storyboard' | 'graph' | 'gallery'
  | 'analytics' | 'maps' | 'settings'
  | 'plotgrid' | 'plotlines' | 'manuscript' | 'stats'
  | 'navigator' | 'corkboard' | 'export' | 'research';
