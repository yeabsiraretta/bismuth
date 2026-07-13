/**
 * Writing service — pure functions for word counting, compile pipeline,
 * scene management, session tracking, and sprint calculations.
 *
 * Synthesized from Longform (compile steps, session tracker, word counting),
 * Storyline (WritingTracker sprints/streaks/daily, scene status pipeline),
 * and Book-Smith (CJK-aware word counting, focus stats, daily tracking).
 */

import type {
  CompileResult,
  CompileWorkflow,
  Draft,
  SceneNode,
  SceneSortField,
  SceneStatus,
  SceneTemplate,
  SortDirection,
  WritingProject,
} from '@/hubs/creative/types/writing-types';
import { SCENE_STATUS_ORDER } from '@/hubs/creative/types/writing-types';

// Re-export extracted modules for backward compatibility
export {
  addSceneToGroup,
  computeProgress,
  countByStatus,
  findSceneById,
  flattenScenes,
  moveSceneToGroup,
  moveSceneToRoot,
  removeSceneDeep,
  totalWordCount,
  updateSceneDeep,
} from './writing-scene-ops';
export {
  computeStreak,
  computeWpm,
  createSprintEntry,
  dateKey,
  formatNumber,
  formatTimer,
  getRecentDays,
  recordDaily,
  
  thisMonthWords,
  thisWeekWords,
  todayKey,
} from './writing-session-service';

// ── Word counting ────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n?/;
const COMMENT_RE = /%%[\s\S]*?%%/g;
const MARKDOWN_SYNTAX_RE = /[#*`~[\](){}|_>]/g;

/**
 * Count words in text, with CJK awareness and markdown stripping.
 * Adapted from Longform + Book-Smith.
 */
export function countWords(text: string): number {
  const cleaned = text
    .replace(FRONTMATTER_RE, '')
    .replace(COMMENT_RE, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(MARKDOWN_SYNTAX_RE, ' ');

  // Count CJK characters (Chinese, Japanese Kanji, Korean)
  const cjkChars = cleaned.match(/[\u4e00-\u9fa5\u3400-\u4dbf\uac00-\ud7af]/g);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // Count Japanese Kana
  const kanaChars = cleaned.match(/[\u3040-\u30ff]/g);
  const kanaCount = kanaChars ? kanaChars.length : 0;

  // Remove CJK/Kana before counting latin words
  const latinText = cleaned
    .replace(/[\u4e00-\u9fa5\u3400-\u4dbf\uac00-\ud7af\u3040-\u30ff]/g, ' ')
    .trim();

  const latinWords = latinText.split(/\s+/).filter((w) => w.length > 0).length;

  return cjkCount + kanaCount + latinWords;
}

/**
 * Strip YAML frontmatter from text.
 */
export function stripFrontmatter(text: string): string {
  return text.replace(FRONTMATTER_RE, '');
}

// ── Scene management ─────────────────────────────────────────────

let nextSceneId = 1;

/**
 * Generate a unique scene ID.
 */
function generateSceneId(): string {
  return `scene-${Date.now()}-${nextSceneId++}`;
}

/**
 * Create a new scene node from a template.
 */
export function createScene(title: string, template?: SceneTemplate, order = 0): SceneNode {
  const now = new Date().toISOString();
  return {
    id: generateSceneId(),
    title,
    type: 'file',
    status: template?.defaultStatus ?? 'idea',
    wordCount: 0,
    targetWordCount: 0,
    order,
    indent: 0,
    children: [],
    tags: template?.defaultTags ? [...template.defaultTags] : [],
    synopsis: '',
    excluded: false,
    createdAt: now,
    modifiedAt: now,
  };
}

/**
 * Create a new group (chapter/act folder).
 */
export function createGroup(title: string, order = 0): SceneNode {
  const now = new Date().toISOString();
  return {
    id: generateSceneId(),
    title,
    type: 'group',
    status: 'idea',
    wordCount: 0,
    targetWordCount: 0,
    order,
    indent: 0,
    children: [],
    tags: [],
    excluded: false,
    createdAt: now,
    modifiedAt: now,
  };
}

/**
 * Insert a scene into a flat scene list at the given index.
 */
export function insertScene(scenes: SceneNode[], scene: SceneNode, index: number): SceneNode[] {
  const copy = [...scenes];
  copy.splice(index, 0, scene);
  return renumberScenes(copy);
}

/**
 * Remove a scene by ID from a flat scene list.
 */
export function removeScene(scenes: SceneNode[], sceneId: string): SceneNode[] {
  return renumberScenes(scenes.filter((s) => s.id !== sceneId));
}

/**
 * Move a scene from one index to another.
 */
export function moveScene(scenes: SceneNode[], fromIndex: number, toIndex: number): SceneNode[] {
  const copy = [...scenes];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return renumberScenes(copy);
}

/**
 * Renumber scenes sequentially (0-based order field).
 */
export function renumberScenes(scenes: SceneNode[]): SceneNode[] {
  return scenes.map((s, i) => ({ ...s, order: i }));
}

/**
 * Advance a scene's status to the next step in the pipeline.
 */
export function advanceStatus(current: SceneStatus): SceneStatus {
  const idx = SCENE_STATUS_ORDER.indexOf(current);
  if (idx < 0 || idx >= SCENE_STATUS_ORDER.length - 1) return current;
  return SCENE_STATUS_ORDER[idx + 1];
}

/**
 * Revert a scene's status to the previous step in the pipeline.
 */
export function revertStatus(current: SceneStatus): SceneStatus {
  const idx = SCENE_STATUS_ORDER.indexOf(current);
  if (idx <= 0) return current;
  return SCENE_STATUS_ORDER[idx - 1];
}

/**
 * Sort scenes by a field.
 */
export function sortScenes(
  scenes: SceneNode[],
  field: SceneSortField,
  direction: SortDirection = 'asc'
): SceneNode[] {
  const sorted = [...scenes].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'order':
        cmp = a.order - b.order;
        break;
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'status':
        cmp = SCENE_STATUS_ORDER.indexOf(a.status) - SCENE_STATUS_ORDER.indexOf(b.status);
        break;
      case 'wordCount':
        cmp = a.wordCount - b.wordCount;
        break;
      case 'modifiedAt':
        cmp = a.modifiedAt.localeCompare(b.modifiedAt);
        break;
    }
    return direction === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

// ── Draft management ─────────────────────────────────────────────

/**
 * Create a new draft for a project.
 */
export function createDraft(title: string, scenes: SceneNode[] = []): Draft {
  return {
    id: `draft-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
    scenes: [...scenes],
  };
}

// ── Project management ───────────────────────────────────────────

/**
 * Create a new writing project.
 */
export function createProject(title: string, author = ''): WritingProject {
  const draft = createDraft('Draft 1');
  return {
    id: `project-${Date.now()}`,
    title,
    author,
    createdAt: new Date().toISOString(),
    activeDraftId: draft.id,
    drafts: [draft],
    targetWords: 0,
    compileWorkflow: 'Default',
  };
}

/**
 * Get the active draft from a project.
 */
function getActiveDraft(project: WritingProject): Draft | undefined {
  return project.drafts.find((d) => d.id === project.activeDraftId);
}

// ── Compile pipeline ─────────────────────────────────────────────

/**
 * Compile scenes into a single manuscript using a workflow.
 * Recursive — gathers content from nested group children.
 */
export function compileScenes(
  scenes: SceneNode[],
  sceneContents: Map<string, string>,
  workflow: CompileWorkflow
): CompileResult {
  const texts: string[] = [];

  function walk(nodes: SceneNode[]): void {
    for (const scene of nodes) {
      if (scene.excluded) continue;
      if (scene.type === 'file') {
        let text = sceneContents.get(scene.id) ?? '';
        if (workflow.stripFrontmatter) text = stripFrontmatter(text);
        if (workflow.prependTitles) text = `# ${scene.title}\n\n${text.trim()}`;
        const trimmed = text.trim();
        if (trimmed.length > 0) texts.push(trimmed);
      }
      if (scene.children.length > 0) walk(scene.children);
    }
  }
  walk(scenes);

  const joined = texts.join(workflow.separator);
  return {
    text: joined,
    wordCount: countWords(joined),
  };
}
