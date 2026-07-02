/**
 * Consolidated domain models used across the application.
 */

// ─── Notes ──────────────────────────────────────────────────────────────────

export interface Note {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  modified?: string;
  created?: string;
}

export interface NoteRef {
  path: string;
  title: string;
}

// ─── Canvas ─────────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  type: 'text' | 'note' | 'image' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  path?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CanvasDocument {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ─── Graph ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  group?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wikilink' | 'backlink' | 'related' | 'tag';
}

// ─── Sequencing ─────────────────────────────────────────────────────────────

export interface SequenceInfo {
  prev?: string;
  next?: string;
  series?: string;
}

// ─── Publishing ─────────────────────────────────────────────────────────────

export interface PublishConfig {
  target: 'local' | 'git';
  outputDir: string;
  theme: string;
  baseUrl?: string;
  gitRepo?: string;
}

export interface PublishableNote {
  path: string;
  title: string;
  slug: string;
  pinned: boolean;
  order?: number;
}

// ─── Feature Flags ──────────────────────────────────────────────────────────

export interface FeatureFlags {
  [key: string]: boolean;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  spellCheck: boolean;
  typewriterMode: boolean;
  hemingwayMode: boolean;
  lintOnType: boolean;
}
