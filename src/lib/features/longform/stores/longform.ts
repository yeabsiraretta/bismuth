import { writable, derived } from 'svelte/store';
import {
  discoverProjects,
  createDraft,
  listDrafts,
  updateSceneStatus,
} from '../services/longform';
import type { LongformProject, Scene, Draft, SceneStatus, CompilePreset } from '../types';
import { log } from '@/utils/logger';

export const longformProjects = writable<LongformProject[]>([]);
export const activeProject = writable<LongformProject | null>(null);
export const activeScene = writable<Scene | null>(null);
export const projectLoading = writable(false);
export const sceneDrafts = writable<Draft[]>([]);
export const compilePresets = writable<CompilePreset[]>(loadPresets());

export const totalWordCount = derived(activeProject, ($p) => $p?.total_words ?? 0);

/** Derived: scenes grouped by status. */
export const scenesByStatus = derived(activeProject, ($p) => {
  if (!$p) return { todo: [], drafting: [], revising: [], complete: [], archived: [] };
  const groups: Record<SceneStatus, Scene[]> = {
    todo: [], drafting: [], revising: [], complete: [], archived: []
  };
  for (const scene of $p.scenes) {
    const status = (scene.status || 'todo') as SceneStatus;
    if (groups[status]) groups[status].push(scene);
    else groups.todo.push(scene);
  }
  return groups;
});

/** Derived: project progress (percentage of scenes complete). */
export const projectProgress = derived(activeProject, ($p) => {
  if (!$p || $p.scenes.length === 0) return 0;
  const complete = $p.scenes.filter(s => s.status === 'complete').length;
  return Math.round((complete / $p.scenes.length) * 100);
});

function loadPresets(): CompilePreset[] {
  try {
    const stored = localStorage.getItem('bismuth-compile-presets');
    return stored ? JSON.parse(stored) : defaultPresets();
  } catch { return defaultPresets(); }
}

function defaultPresets(): CompilePreset[] {
  return [
    { name: 'Workshop (MD)', strip_frontmatter: true, scene_separator: '\n\n---\n\n', include_scene_titles: true, format: 'markdown' },
    { name: 'Clean Export', strip_frontmatter: true, scene_separator: '\n\n', include_scene_titles: false, format: 'markdown' },
    { name: 'Full Draft', strip_frontmatter: true, scene_separator: '\n\n---\n\n', include_scene_titles: true, format: 'markdown', scene_filter: ['drafting', 'revising', 'complete'] },
  ];
}

/** Refresh longform projects list. */
export async function refreshProjects(): Promise<void> {
  projectLoading.set(true);
  try {
    const projects = await discoverProjects();
    longformProjects.set(projects);
  } catch (err) {
    log.error('Failed to refresh longform projects', err as Error);
  } finally {
    projectLoading.set(false);
  }
}

/** Set the active project. */
export function selectProject(project: LongformProject): void {
  activeProject.set(project);
  activeScene.set(project.scenes[0] ?? null);
}

/** Set the active scene within the current project. */
export function selectScene(scene: Scene): void {
  activeScene.set(scene);
  refreshSceneDrafts(scene.path);
}

/** Refresh drafts for the current scene. */
export async function refreshSceneDrafts(scenePath: string): Promise<void> {
  try {
    const drafts = await listDrafts(scenePath);
    sceneDrafts.set(drafts);
  } catch (err) {
    log.error('Failed to refresh drafts', err as Error);
  }
}

/** Create a new draft of the active scene. */
export async function createNewDraft(): Promise<Draft | null> {
  let scene: Scene | null = null;
  activeScene.subscribe(s => { scene = s; })();
  if (!scene) return null;
  try {
    const draft = await createDraft((scene as Scene).path);
    sceneDrafts.update(d => [...d, draft]);
    activeProject.update(p => {
      if (!p) return p;
      return {
        ...p,
        scenes: p.scenes.map(s =>
          s.path === (scene as Scene).path
            ? { ...s, draft_count: s.draft_count + 1 }
            : s
        ),
      };
    });
    log.info('Draft created', { version: draft.version, scene: (scene as Scene).title });
    return draft;
  } catch (err) {
    log.error('Failed to create draft', err as Error);
    return null;
  }
}

/** Update status of the active scene. */
export async function changeSceneStatus(status: SceneStatus): Promise<void> {
  let scene: Scene | null = null;
  activeScene.subscribe(s => { scene = s; })();
  if (!scene) return;
  try {
    await updateSceneStatus((scene as Scene).path, status);
    activeScene.update(s => s ? { ...s, status } : s);
    activeProject.update(p => {
      if (!p) return p;
      return {
        ...p,
        scenes: p.scenes.map(s =>
          s.path === (scene as Scene).path ? { ...s, status } : s
        ),
      };
    });
    // Award XP for completing a scene
    if (status === 'complete') {
      import('@/features/gamify').then(({ awardXp }) => {
        awardXp('milestone', 100, `Scene complete: ${(scene as Scene).title}`);
      });
    }
  } catch (err) {
    log.error('Failed to update scene status', err as Error);
  }
}

/** Save compile presets to localStorage. */
export function savePreset(preset: CompilePreset): void {
  compilePresets.update(presets => {
    const idx = presets.findIndex(p => p.name === preset.name);
    if (idx >= 0) presets[idx] = preset;
    else presets.push(preset);
    return [...presets];
  });
}

/** Persist presets on change. */
compilePresets.subscribe(presets => {
  try { localStorage.setItem('bismuth-compile-presets', JSON.stringify(presets)); }
  catch (e) { log.warn('Failed to persist compile presets to localStorage', { error: String(e) }); }
});
