/**
 * Longform writing feature module — manuscript projects, scenes, drafts.
 * Public API barrel.
 */

// Types
export type { LongformProject, Scene, Draft, SceneStatus, CompilePreset, CompileOptions } from './types';

// Stores
export {
  longformProjects,
  activeProject,
  activeScene,
  projectLoading,
  sceneDrafts,
  compilePresets,
  totalWordCount,
  scenesByStatus,
  projectProgress,
  refreshProjects,
  selectProject,
  selectScene,
  refreshSceneDrafts,
  createNewDraft,
  changeSceneStatus,
  savePreset,
} from './stores/longform';

// Services
export {
  discoverProjects,
  getProjectScenes,
  reorderScenes,
  compileManuscript,
  createDraft,
  listDrafts,
  updateSceneStatus,
  compileWithPreset,
} from './services/longform';

// Components
export { default as LongformPanel } from './components/LongformPanel.svelte';
export { default as SceneList } from './components/SceneList.svelte';
export { default as WordCounter } from './components/WordCounter.svelte';
