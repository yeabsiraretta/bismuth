/**
 * Writing file service — pure functions for mapping writing projects,
 * drafts, chapters, and scenes to vault folder paths and note content.
 *
 * Folder convention:
 *   Writing/<Project>/<Draft>/<Chapter?>/<Scene>.md
 *
 * The Rust `create_note` command auto-creates parent directories.
 */

import type {
  Draft,
  SceneNode,
  SceneTemplate,
  WritingProject,
} from '@/hubs/creative/types/writing-types';
import { SCENE_STATUS_LABELS } from '@/hubs/creative/types/writing-types';

/** Root folder name inside the vault for all writing projects. */
export const WRITING_ROOT = 'Writing';

/**
 * Sanitise a string for use as a folder / file name.
 * Replaces characters forbidden by most file systems.
 */
export function sanitiseName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|#%&{}$!@`+=[\]^~]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '_')
    .slice(0, 120);
}

/**
 * Build the vault-relative folder path for a project.
 * → `Writing/<ProjectTitle>`
 */
export function projectFolderPath(project: WritingProject): string {
  return `${WRITING_ROOT}/${sanitiseName(project.title)}`;
}

/**
 * Build the vault-relative folder path for a draft within a project.
 * → `Writing/<ProjectTitle>/<DraftTitle>`
 */
export function draftFolderPath(project: WritingProject, draft: Draft): string {
  return `${projectFolderPath(project)}/${sanitiseName(draft.title)}`;
}

/**
 * Find the parent group (chapter) of a scene in the tree, if any.
 */
export function findParentGroup(nodes: SceneNode[], sceneId: string): SceneNode | undefined {
  for (const node of nodes) {
    if (node.type === 'group') {
      if (node.children.some((c) => c.id === sceneId)) return node;
      const deep = findParentGroup(node.children, sceneId);
      if (deep) return deep;
    }
  }
  return undefined;
}

/**
 * Build the vault-relative folder path for a scene, including its
 * chapter subfolder when nested.
 *
 * Root scene  → `Writing/<Project>/<Draft>`
 * Nested scene → `Writing/<Project>/<Draft>/<Chapter>`
 */
export function sceneFolderPath(
  project: WritingProject,
  draft: Draft,
  scenes: SceneNode[],
  sceneId: string
): string {
  const base = draftFolderPath(project, draft);
  const parent = findParentGroup(scenes, sceneId);
  if (parent) {
    return `${base}/${sanitiseName(parent.title)}`;
  }
  return base;
}

/**
 * Build the full vault-relative path (with `.md` extension) for a scene note.
 */
export function sceneNotePath(
  project: WritingProject,
  draft: Draft,
  scenes: SceneNode[],
  scene: SceneNode
): string {
  const folder = sceneFolderPath(project, draft, scenes, scene.id);
  return `${folder}/${sanitiseName(scene.title)}.md`;
}

/**
 * Generate the initial markdown content for a scene note.
 */
export function sceneNoteContent(scene: SceneNode, template?: SceneTemplate): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: "${scene.title}"`);
  lines.push(`status: ${SCENE_STATUS_LABELS[scene.status]}`);
  if (scene.pov) lines.push(`pov: "${scene.pov}"`);
  if (scene.tags.length > 0) lines.push(`tags: [${scene.tags.map((t) => `"${t}"`).join(', ')}]`);
  if (scene.synopsis) lines.push(`synopsis: "${scene.synopsis}"`);
  if (scene.emotion) lines.push(`emotion: "${scene.emotion}"`);
  lines.push('---');
  lines.push('');

  if (template?.bodyTemplate) {
    lines.push(template.bodyTemplate);
  } else {
    lines.push(`# ${scene.title}`);
    lines.push('');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Find a scene by its vault-relative notePath (recursive).
 */
export function findSceneByNotePath(nodes: SceneNode[], notePath: string): SceneNode | null {
  for (const node of nodes) {
    if (node.notePath === notePath) return node;
    if (node.children.length > 0) {
      const found = findSceneByNotePath(node.children, notePath);
      if (found) return found;
    }
  }
  return null;
}
