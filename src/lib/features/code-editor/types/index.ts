/**
 * VSCode-like Code Editor types.
 * Supports viewing and editing files in various code formats.
 */

export interface CodeEditorConfig {
  extensions: string[];
  fontSize: number;
  fontFamily: string;
  fontLigatures: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
  indentGuides: boolean;
  tabSize: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
  mimeType?: string;
  color: string;
}

export const DEFAULT_CODE_EXTENSIONS = [
  'ts', 'js', 'jsx', 'tsx', 'py', 'css', 'scss', 'less',
  'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'java', 'lua',
  'php', 'rb', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh',
  'html', 'xml', 'svg', 'json', 'yaml', 'yml', 'toml',
  'ini', 'conf', 'sql', 'graphql', 'proto',
  'dockerfile', 'makefile', 'cmake',
  'r', 'dart', 'zig', 'nim', 'elixir', 'ex', 'exs',
  'vue', 'svelte', 'astro',
];

export const DEFAULT_CODE_EDITOR_CONFIG: CodeEditorConfig = {
  extensions: [...DEFAULT_CODE_EXTENSIONS],
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  fontLigatures: true,
  lineNumbers: true,
  wordWrap: false,
  minimap: false,
  indentGuides: true,
  tabSize: 2,
  theme: 'auto',
};
