export type DeployTarget = 'local' | 'git' | 'vercel' | 'netlify';

export interface PublishConfig {
  output_dir: string;
  base_url: string;
  theme: string;
  target: DeployTarget;
  deploy_token?: string;
  site_id?: string;
  project_name?: string;
}

export interface PublishableNote {
  path: string;
  title: string;
  slug: string;
  is_home: boolean;
  pinned: boolean;
  order: number | null;
  tags: string[];
  hide_nav: boolean;
  created: string | null;
  updated: string | null;
}

export interface PublishResult {
  pages_published: number;
  output_dir: string;
}

export type PublishStatus = 'draft' | 'published' | 'updated';

export interface PublishHistoryEntry {
  timestamp: string;
  noteCount: number;
  status: 'success' | 'error';
  message: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  outputFormat: 'html' | 'markdown' | 'json';
  theme: string;
  outputDir: string;
}
