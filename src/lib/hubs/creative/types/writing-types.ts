/**
 * Writing feature types — synthesized from Longform, Storyline, and Book-Smith.
 *
 * Covers: projects, scenes/chapters, drafts, sessions, sprints, compile steps,
 * focus timer, and scene templates.
 */

// ── Scene status pipeline ────────────────────────────────────────
export type SceneStatus = 'idea' | 'outlined' | 'draft' | 'written' | 'revised' | 'final';

export const SCENE_STATUS_ORDER: SceneStatus[] = [
  'idea',
  'outlined',
  'draft',
  'written',
  'revised',
  'final',
];

export const SCENE_STATUS_LABELS: Record<SceneStatus, string> = {
  idea: 'Idea',
  outlined: 'Outlined',
  draft: 'Draft',
  written: 'Written',
  revised: 'Revised',
  final: 'Final',
};

// ── Scene / Chapter node ─────────────────────────────────────────
export interface SceneNode {
  id: string;
  title: string;
  /** 'file' = leaf scene, 'group' = chapter/act folder */
  type: 'file' | 'group';
  status: SceneStatus;
  wordCount: number;
  targetWordCount: number;
  /** Sort order within parent */
  order: number;
  /** Indent / nesting level (0 = top) */
  indent: number;
  /** Child nodes for groups */
  children: SceneNode[];
  /** POV character name */
  pov?: string;
  /** Tags / plotlines */
  tags: string[];
  /** Scene synopsis */
  synopsis?: string;
  /** Emotional tone */
  emotion?: string;
  /** Vault-relative path to the note file backing this scene */
  notePath?: string;
  /** Whether this node is excluded from compile/stats */
  excluded: boolean;
  /** Creation ISO date */
  createdAt: string;
  /** Last modified ISO date */
  modifiedAt: string;
}

// ── Draft ────────────────────────────────────────────────────────
export interface Draft {
  id: string;
  title: string;
  /** ISO date created */
  createdAt: string;
  scenes: SceneNode[];
}

// ── Writing project ──────────────────────────────────────────────
export interface WritingProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description?: string;
  /** ISO date created */
  createdAt: string;
  /** Active draft ID */
  activeDraftId: string;
  drafts: Draft[];
  /** Target total words for the project */
  targetWords: number;
  /** Compile workflow name */
  compileWorkflow: string;
}

// ── Writing session ──────────────────────────────────────────────
interface WritingSession {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Words written */
  words: number;
  /** Session duration in seconds */
  durationSec: number;
  /** Daily word goal at time of session */
  goal: number;
}

// ── Sprint ───────────────────────────────────────────────────────
export interface SprintEntry {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Net words written */
  words: number;
  /** Sprint duration in ms */
  durationMs: number;
  /** Words per minute */
  wpm: number;
}

// ── Focus timer state ────────────────────────────────────────────
export type FocusState = 'idle' | 'working' | 'break' | 'paused';

export interface FocusSettings {
  workDurationMin: number;
  breakDurationMin: number;
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  workDurationMin: 25,
  breakDurationMin: 5,
};

// ── Compile step ─────────────────────────────────────────────────
type CompileStepKind = 'scene' | 'join' | 'manuscript';

interface CompileStepDef {
  id: string;
  name: string;
  description: string;
  kind: CompileStepKind;
}

export interface CompileResult {
  /** The final compiled text */
  text: string;
  /** Total word count of output */
  wordCount: number;
}

// ── Compile workflow ─────────────────────────────────────────────
export interface CompileWorkflow {
  name: string;
  description: string;
  steps: CompileStepDef[];
  /** Separator between scenes when joining */
  separator: string;
  /** Whether to strip frontmatter from scenes */
  stripFrontmatter: boolean;
  /** Whether to prepend scene titles */
  prependTitles: boolean;
}

export const DEFAULT_COMPILE_WORKFLOW: CompileWorkflow = {
  name: 'Default',
  description: 'Concatenate all scenes into a single manuscript.',
  steps: [
    {
      id: 'strip-frontmatter',
      name: 'Strip Frontmatter',
      description: 'Remove YAML frontmatter from each scene.',
      kind: 'scene',
    },
    {
      id: 'concatenate',
      name: 'Concatenate',
      description: 'Join all scenes in order.',
      kind: 'join',
    },
  ],
  separator: '\n\n---\n\n',
  stripFrontmatter: true,
  prependTitles: true,
};

// ── Scene template ───────────────────────────────────────────────
export interface SceneTemplate {
  name: string;
  description: string;
  defaultStatus: SceneStatus;
  bodyTemplate: string;
  defaultTags: string[];
}

export const BUILTIN_SCENE_TEMPLATES: SceneTemplate[] = [
  {
    name: 'Blank',
    description: 'Empty scene — no pre-filled body.',
    defaultStatus: 'idea',
    bodyTemplate: '',
    defaultTags: [],
  },
  {
    name: 'Action Scene',
    description: 'Goal / Conflict / Outcome structure.',
    defaultStatus: 'idea',
    bodyTemplate: `## Goal\nWhat does the POV character want?\n\n## Conflict\nWhat stands in their way?\n\n## Action\nDescribe the key beats.\n\n## Outcome\nHow does the scene end?`,
    defaultTags: ['action'],
  },
  {
    name: 'Dialogue Scene',
    description: 'Character conversation with emotional stakes.',
    defaultStatus: 'idea',
    bodyTemplate: `## Setup\nWhere are the characters, and what brought them here?\n\n## Dialogue Focus\nWhat is the conversation about?\n\n## Emotional Stakes\nWhat does each speaker want?\n\n## Takeaway\nHow has the relationship shifted?`,
    defaultTags: ['dialogue'],
  },
  {
    name: 'Flashback',
    description: 'Past event revealed to the reader.',
    defaultStatus: 'idea',
    bodyTemplate: `## Trigger\nWhat in the present triggers this memory?\n\n## Memory\nThe past event in vivid detail.\n\n## Return\nHow does the character snap back to the present?`,
    defaultTags: ['flashback'],
  },
];

// ── Daily history persistence ────────────────────────────────────
export interface WritingHistory {
  /** Daily word counts keyed by ISO date */
  daily: Record<string, number>;
  /** Sprint log entries */
  sprints: SprintEntry[];
}

// ── Sort ─────────────────────────────────────────────────────────
export type SceneSortField = 'order' | 'title' | 'status' | 'wordCount' | 'modifiedAt';
export type SortDirection = 'asc' | 'desc';
