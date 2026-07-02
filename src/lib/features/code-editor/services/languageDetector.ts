/**
 * Language detection and mapping service for the code editor.
 * Maps file extensions to language IDs, display names, and colors.
 */

import type { LanguageInfo, CodeEditorConfig } from '../types';
import { DEFAULT_CODE_EDITOR_CONFIG } from '../types';

const LANGUAGES: LanguageInfo[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts', 'tsx', 'mts', 'cts'],
    color: '#3178c6',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    color: '#f7df1e',
  },
  { id: 'python', name: 'Python', extensions: ['py', 'pyw', 'pyi'], color: '#3572a5' },
  { id: 'rust', name: 'Rust', extensions: ['rs'], color: '#dea584' },
  { id: 'go', name: 'Go', extensions: ['go'], color: '#00add8' },
  { id: 'c', name: 'C', extensions: ['c', 'h'], color: '#555555' },
  { id: 'cpp', name: 'C++', extensions: ['cpp', 'hpp', 'cc', 'cxx'], color: '#f34b7d' },
  { id: 'csharp', name: 'C#', extensions: ['cs'], color: '#178600' },
  { id: 'java', name: 'Java', extensions: ['java'], color: '#b07219' },
  { id: 'html', name: 'HTML', extensions: ['html', 'htm'], color: '#e34c26' },
  { id: 'css', name: 'CSS', extensions: ['css'], color: '#563d7c' },
  { id: 'scss', name: 'SCSS', extensions: ['scss'], color: '#c6538c' },
  { id: 'less', name: 'Less', extensions: ['less'], color: '#1d365d' },
  { id: 'json', name: 'JSON', extensions: ['json', 'jsonc'], color: '#292929' },
  { id: 'yaml', name: 'YAML', extensions: ['yaml', 'yml'], color: '#cb171e' },
  { id: 'toml', name: 'TOML', extensions: ['toml'], color: '#9c4221' },
  { id: 'xml', name: 'XML', extensions: ['xml', 'xsl', 'xsd', 'svg'], color: '#0060ac' },
  { id: 'sql', name: 'SQL', extensions: ['sql'], color: '#e38c00' },
  { id: 'shell', name: 'Shell', extensions: ['sh', 'bash', 'zsh'], color: '#89e051' },
  { id: 'ruby', name: 'Ruby', extensions: ['rb'], color: '#701516' },
  { id: 'php', name: 'PHP', extensions: ['php'], color: '#4f5d95' },
  { id: 'swift', name: 'Swift', extensions: ['swift'], color: '#f05138' },
  { id: 'kotlin', name: 'Kotlin', extensions: ['kt', 'kts'], color: '#a97bff' },
  { id: 'scala', name: 'Scala', extensions: ['scala'], color: '#c22d40' },
  { id: 'lua', name: 'Lua', extensions: ['lua'], color: '#000080' },
  { id: 'dart', name: 'Dart', extensions: ['dart'], color: '#00b4ab' },
  { id: 'r', name: 'R', extensions: ['r', 'R'], color: '#198ce7' },
  { id: 'elixir', name: 'Elixir', extensions: ['ex', 'exs', 'elixir'], color: '#6e4a7e' },
  { id: 'zig', name: 'Zig', extensions: ['zig'], color: '#ec915c' },
  { id: 'nim', name: 'Nim', extensions: ['nim'], color: '#ffc200' },
  { id: 'ini', name: 'INI', extensions: ['ini', 'conf', 'cfg'], color: '#d1dbe0' },
  { id: 'dockerfile', name: 'Dockerfile', extensions: ['dockerfile'], color: '#384d54' },
  { id: 'makefile', name: 'Makefile', extensions: ['makefile', 'cmake'], color: '#427819' },
  { id: 'graphql', name: 'GraphQL', extensions: ['graphql', 'gql'], color: '#e10098' },
  { id: 'proto', name: 'Protobuf', extensions: ['proto'], color: '#426d9b' },
  { id: 'svelte', name: 'Svelte', extensions: ['svelte'], color: '#ff3e00' },
  { id: 'vue', name: 'Vue', extensions: ['vue'], color: '#41b883' },
  { id: 'astro', name: 'Astro', extensions: ['astro'], color: '#ff5d01' },
  { id: 'plaintext', name: 'Plain Text', extensions: ['txt', 'log'], color: '#6b7280' },
];

const extToLang = new Map<string, LanguageInfo>();
for (const lang of LANGUAGES) {
  for (const ext of lang.extensions) {
    extToLang.set(ext.toLowerCase(), lang);
  }
}

/** Detect language from a file path or extension. */
export function detectLanguage(pathOrExt: string): LanguageInfo | null {
  const ext = getExtension(pathOrExt);
  if (!ext) return null;
  return extToLang.get(ext.toLowerCase()) ?? null;
}

/** Get file extension from a path. */
export function getExtension(path: string): string | null {
  const base = path.split('/').pop() ?? '';
  // Handle filenames like Dockerfile, Makefile
  const lower = base.toLowerCase();
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === 'makefile' || lower === 'cmakelists.txt') return 'makefile';
  const dot = base.lastIndexOf('.');
  if (dot === -1 || dot === base.length - 1) return null;
  return base.slice(dot + 1);
}

/** Check if a file path is a code file based on configured extensions. */
export function isCodeFile(path: string, config?: CodeEditorConfig): boolean {
  const ext = getExtension(path);
  if (!ext) {
    const base = path.split('/').pop()?.toLowerCase() ?? '';
    return base === 'dockerfile' || base === 'makefile';
  }
  const supported = config?.extensions ?? DEFAULT_CODE_EDITOR_CONFIG.extensions;
  return supported.includes(ext.toLowerCase());
}

/** Check if a file is a markdown file. */
export function isMarkdownFile(path: string): boolean {
  const ext = getExtension(path);
  return ext === 'md' || ext === 'markdown' || ext === 'mdx';
}

/** Get display name for a language by extension. */
export function getLanguageDisplayName(pathOrExt: string): string {
  const lang = detectLanguage(pathOrExt);
  return lang?.name ?? 'Plain Text';
}

/** Get language color for a file. */
export function getLanguageAccentColor(pathOrExt: string): string {
  const lang = detectLanguage(pathOrExt);
  return lang?.color ?? '#6b7280';
}

/** Load code editor config from localStorage. */
export function loadCodeEditorConfig(): CodeEditorConfig {
  try {
    const raw = localStorage.getItem('bismuth-code-editor-config');
    if (raw) return { ...DEFAULT_CODE_EDITOR_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* use defaults */
  }
  return { ...DEFAULT_CODE_EDITOR_CONFIG };
}

/** Save code editor config to localStorage. */
export function saveCodeEditorConfig(config: CodeEditorConfig): void {
  try {
    localStorage.setItem('bismuth-code-editor-config', JSON.stringify(config));
  } catch {
    /* noop */
  }
}
