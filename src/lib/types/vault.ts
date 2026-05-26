export interface Vault {
  root_path: string;
  settings_path: string;
  name: string;
}

export interface Note {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, any>;
  created_at: string;
  modified_at: string;
}

export interface Link {
  source_path: string;
  target_title: string;
  target_path: string | null;
  alias: string | null;
  is_resolved: boolean;
}

export interface Tag {
  name: string;
  count: number;
}

export enum VaultTemplate {
  Blank = 'Blank',
  PARA = 'PARA',
  JohnnyDecimal = 'JohnnyDecimal',
  Zettelkasten = 'Zettelkasten',
}
