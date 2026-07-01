import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { LongformProject, Scene, Draft, SceneStatus, CompilePreset, CompileOptions } from '../types';

/** Discover all longform projects in the vault. */
export async function discoverProjects(): Promise<LongformProject[]> {
  try {
    return await invoke<LongformProject[]>('discover_longform_projects');
  } catch (err) {
    log.error('Failed to discover longform projects', err as Error);
    return [];
  }
}

/** Get scenes for a specific project. */
export async function getProjectScenes(projectPath: string): Promise<Scene[]> {
  try {
    return await invoke<Scene[]>('get_project_scenes', { projectPath });
  } catch (err) {
    log.error('Failed to get project scenes', err as Error);
    return [];
  }
}

/** Reorder scenes within a project. */
export async function reorderScenes(
  projectPath: string,
  fromIndex: number,
  toIndex: number
): Promise<void> {
  return invoke<void>('reorder_scenes', { projectPath, fromIndex, toIndex });
}

/** Compile manuscript from scenes. */
export async function compileManuscript(
  projectPath: string,
  options: CompileOptions
): Promise<string> {
  return invoke<string>('compile_manuscript', { projectPath, options });
}

/** Create a new draft snapshot of a scene. */
export async function createDraft(scenePath: string): Promise<Draft> {
  try {
    return await invoke<Draft>('create_scene_draft', { scenePath });
  } catch (err) {
    log.error('Failed to create draft', err as Error);
    throw err;
  }
}

/** List all drafts for a scene. */
export async function listDrafts(scenePath: string): Promise<Draft[]> {
  try {
    return await invoke<Draft[]>('list_scene_drafts', { scenePath });
  } catch (err) {
    log.error('Failed to list drafts', err as Error);
    return [];
  }
}

/** Update a scene's status. */
export async function updateSceneStatus(
  scenePath: string,
  status: SceneStatus
): Promise<void> {
  return invoke<void>('update_scene_status', { scenePath, status });
}

/** Compile with a preset (client-side filtering by status). */
export async function compileWithPreset(
  project: LongformProject,
  preset: CompilePreset,
  outputPath: string
): Promise<string> {
  const options: CompileOptions = {
    strip_frontmatter: preset.strip_frontmatter,
    scene_separator: preset.scene_separator,
    include_scene_titles: preset.include_scene_titles,
    output_path: outputPath,
  };
  return compileManuscript(project.root_path, options);
}
