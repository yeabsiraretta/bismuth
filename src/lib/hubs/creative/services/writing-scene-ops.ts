/**
 * Scene tree operations — deep search, removal, grouping, flattening,
 * word count aggregation, status counting, and progress computation.
 */

import type { SceneNode, SceneStatus } from '@/hubs/creative/types/writing-types';

import { renumberScenes } from './writing-service';

// ── Tree-aware operations ────────────────────────────────────────

/**
 * Find a scene by ID anywhere in the tree (deep search).
 */
export function findSceneById(nodes: SceneNode[], sceneId: string): SceneNode | undefined {
  for (const node of nodes) {
    if (node.id === sceneId) return node;
    if (node.children.length > 0) {
      const found = findSceneById(node.children, sceneId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Remove a scene by ID from anywhere in the tree (recursive).
 * Returns a new tree with the scene removed.
 */
export function removeSceneDeep(nodes: SceneNode[], sceneId: string): SceneNode[] {
  const result: SceneNode[] = [];
  for (const node of nodes) {
    if (node.id === sceneId) continue;
    if (node.children.length > 0) {
      result.push({ ...node, children: removeSceneDeep(node.children, sceneId) });
    } else {
      result.push(node);
    }
  }
  return renumberScenes(result);
}

/**
 * Add a scene into a group's children at the given index.
 * If groupId is not found, the scene is appended at root level.
 */
export function addSceneToGroup(
  nodes: SceneNode[],
  groupId: string,
  scene: SceneNode,
  index?: number
): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === groupId && node.type === 'group') {
      const children = [...node.children];
      const insertAt = index ?? children.length;
      children.splice(insertAt, 0, { ...scene, indent: node.indent + 1 });
      return { ...node, children: renumberScenes(children) };
    }
    if (node.children.length > 0) {
      return { ...node, children: addSceneToGroup(node.children, groupId, scene, index) };
    }
    return node;
  });
}

/**
 * Move a scene from anywhere in the tree into a group's children.
 * Removes from current position, then inserts into the target group.
 */
export function moveSceneToGroup(
  nodes: SceneNode[],
  sceneId: string,
  targetGroupId: string,
  index?: number
): SceneNode[] {
  const scene = findSceneById(nodes, sceneId);
  if (!scene) return nodes;
  const without = removeSceneDeep(nodes, sceneId);
  return addSceneToGroup(without, targetGroupId, scene, index);
}

/**
 * Move a scene from anywhere in the tree to the root level at the given index.
 */
export function moveSceneToRoot(nodes: SceneNode[], sceneId: string, index?: number): SceneNode[] {
  const scene = findSceneById(nodes, sceneId);
  if (!scene) return nodes;
  const without = removeSceneDeep(nodes, sceneId);
  const copy = [...without];
  const insertAt = index ?? copy.length;
  copy.splice(insertAt, 0, { ...scene, indent: 0 });
  return renumberScenes(copy);
}

/**
 * Update a scene by ID anywhere in the tree (recursive).
 */
export function updateSceneDeep(
  nodes: SceneNode[],
  sceneId: string,
  updates: Partial<SceneNode>
): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === sceneId) {
      return { ...node, ...updates, modifiedAt: new Date().toISOString() };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateSceneDeep(node.children, sceneId, updates) };
    }
    return node;
  });
}

/**
 * Flatten a nested scene tree into a flat list with indent levels.
 */
export function flattenScenes(nodes: SceneNode[], indent = 0): SceneNode[] {
  const result: SceneNode[] = [];
  for (const node of nodes) {
    result.push({ ...node, indent });
    if (node.children.length > 0) {
      result.push(...flattenScenes(node.children, indent + 1));
    }
  }
  return result;
}

/**
 * Compute aggregate word count for a scene tree (recursive).
 */
export function totalWordCount(nodes: SceneNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.excluded) continue;
    total += node.wordCount;
    if (node.children.length > 0) {
      total += totalWordCount(node.children);
    }
  }
  return total;
}

/**
 * Count scenes by status (recursive — includes children of groups).
 */
export function countByStatus(scenes: SceneNode[]): Record<SceneStatus, number> {
  const counts: Record<SceneStatus, number> = {
    idea: 0,
    outlined: 0,
    draft: 0,
    written: 0,
    revised: 0,
    final: 0,
  };
  function walk(nodes: SceneNode[]): void {
    for (const s of nodes) {
      if (s.excluded) continue;
      if (s.type === 'file') counts[s.status]++;
      if (s.children.length > 0) walk(s.children);
    }
  }
  walk(scenes);
  return counts;
}

/**
 * Compute overall project progress (0-1) based on scene status weights.
 * Recursive — walks into group children, only counts 'file' scenes.
 */
export function computeProgress(scenes: SceneNode[]): number {
  const weights: Record<SceneStatus, number> = {
    idea: 0,
    outlined: 0.15,
    draft: 0.35,
    written: 0.6,
    revised: 0.85,
    final: 1.0,
  };
  let total = 0;
  let count = 0;
  function walk(nodes: SceneNode[]): void {
    for (const s of nodes) {
      if (s.excluded) continue;
      if (s.type === 'file') {
        total += weights[s.status];
        count++;
      }
      if (s.children.length > 0) walk(s.children);
    }
  }
  walk(scenes);
  return count === 0 ? 0 : total / count;
}
