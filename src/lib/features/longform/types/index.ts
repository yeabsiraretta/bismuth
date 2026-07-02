export interface LongformProject {
  title: string;
  project_type: string;
  root_path: string;
  scenes: Scene[];
  total_words: number;
}

export interface Scene {
  title: string;
  path: string;
  order: number;
  word_count: number;
  children: Scene[];
  status: string;
  draft_count: number;
}

export interface Draft {
  version: number;
  path: string;
  word_count: number;
  created_at: string;
  label: string;
}

export type SceneStatus = 'todo' | 'drafting' | 'revising' | 'complete' | 'archived';

export interface CompilePreset {
  name: string;
  strip_frontmatter: boolean;
  scene_separator: string;
  include_scene_titles: boolean;
  format: 'markdown' | 'html';
  scene_filter?: SceneStatus[];
}

export interface CompileOptions {
  strip_frontmatter: boolean;
  scene_separator: string;
  include_scene_titles: boolean;
  output_path: string;
}
