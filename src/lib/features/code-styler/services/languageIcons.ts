/**
 * Language icon and colour map for code block headers.
 *
 * Maps language identifiers to display names, accent colours (for left border),
 * and optional SVG path data for header icons.
 */

import type { LanguageIcon } from '../types/codeStyler';

const LANG_MAP: Record<string, LanguageIcon> = {
  javascript:  { name: 'JavaScript',  color: '#f7df1e' },
  js:          { name: 'JavaScript',  color: '#f7df1e' },
  typescript:  { name: 'TypeScript',  color: '#3178c6' },
  ts:          { name: 'TypeScript',  color: '#3178c6' },
  python:      { name: 'Python',      color: '#3776ab' },
  py:          { name: 'Python',      color: '#3776ab' },
  rust:        { name: 'Rust',        color: '#dea584' },
  rs:          { name: 'Rust',        color: '#dea584' },
  go:          { name: 'Go',          color: '#00add8' },
  java:        { name: 'Java',        color: '#b07219' },
  cpp:         { name: 'C++',         color: '#f34b7d' },
  'c++':       { name: 'C++',         color: '#f34b7d' },
  c:           { name: 'C',           color: '#555555' },
  csharp:      { name: 'C#',          color: '#178600' },
  cs:          { name: 'C#',          color: '#178600' },
  ruby:        { name: 'Ruby',        color: '#cc342d' },
  rb:          { name: 'Ruby',        color: '#cc342d' },
  php:         { name: 'PHP',         color: '#4f5d95' },
  swift:       { name: 'Swift',       color: '#f05138' },
  kotlin:      { name: 'Kotlin',      color: '#a97bff' },
  kt:          { name: 'Kotlin',      color: '#a97bff' },
  scala:       { name: 'Scala',       color: '#c22d40' },
  dart:        { name: 'Dart',        color: '#00b4ab' },
  lua:         { name: 'Lua',         color: '#000080' },
  r:           { name: 'R',           color: '#198ce7' },
  perl:        { name: 'Perl',        color: '#0298c3' },
  haskell:     { name: 'Haskell',     color: '#5e5086' },
  hs:          { name: 'Haskell',     color: '#5e5086' },
  elixir:      { name: 'Elixir',      color: '#6e4a7e' },
  ex:          { name: 'Elixir',      color: '#6e4a7e' },
  clojure:     { name: 'Clojure',     color: '#db5855' },
  clj:         { name: 'Clojure',     color: '#db5855' },
  erlang:      { name: 'Erlang',      color: '#b83998' },
  ocaml:       { name: 'OCaml',       color: '#3be133' },
  ml:          { name: 'OCaml',       color: '#3be133' },
  zig:         { name: 'Zig',         color: '#f7a41d' },
  nim:         { name: 'Nim',         color: '#ffe953' },
  // Web
  html:        { name: 'HTML',        color: '#e34c26' },
  css:         { name: 'CSS',         color: '#563d7c' },
  scss:        { name: 'SCSS',        color: '#c6538c' },
  sass:        { name: 'Sass',        color: '#c6538c' },
  less:        { name: 'Less',        color: '#1d365d' },
  svelte:      { name: 'Svelte',      color: '#ff3e00' },
  vue:         { name: 'Vue',         color: '#41b883' },
  jsx:         { name: 'JSX',         color: '#61dafb' },
  tsx:         { name: 'TSX',         color: '#3178c6' },
  // Config / Data
  json:        { name: 'JSON',        color: '#292929' },
  yaml:        { name: 'YAML',        color: '#cb171e' },
  yml:         { name: 'YAML',        color: '#cb171e' },
  toml:        { name: 'TOML',        color: '#9c4121' },
  xml:         { name: 'XML',         color: '#0060ac' },
  csv:         { name: 'CSV',         color: '#237346' },
  graphql:     { name: 'GraphQL',     color: '#e10098' },
  gql:         { name: 'GraphQL',     color: '#e10098' },
  sql:         { name: 'SQL',         color: '#e38c00' },
  // Shell / DevOps
  bash:        { name: 'Bash',        color: '#89e051' },
  sh:          { name: 'Shell',       color: '#89e051' },
  zsh:         { name: 'Zsh',         color: '#89e051' },
  powershell:  { name: 'PowerShell',  color: '#012456' },
  ps1:         { name: 'PowerShell',  color: '#012456' },
  dockerfile:  { name: 'Dockerfile',  color: '#384d54' },
  docker:      { name: 'Docker',      color: '#384d54' },
  makefile:    { name: 'Makefile',    color: '#427819' },
  cmake:       { name: 'CMake',       color: '#064f8c' },
  terraform:   { name: 'Terraform',   color: '#5c4ee5' },
  tf:          { name: 'Terraform',   color: '#5c4ee5' },
  // Markup / Docs
  markdown:    { name: 'Markdown',    color: '#083fa1' },
  md:          { name: 'Markdown',    color: '#083fa1' },
  latex:       { name: 'LaTeX',       color: '#3d6117' },
  tex:         { name: 'LaTeX',       color: '#3d6117' },
  // Other
  diff:        { name: 'Diff',        color: '#41b883' },
  regex:       { name: 'Regex',       color: '#009926' },
  wasm:        { name: 'WebAssembly', color: '#654ff0' },
  solidity:    { name: 'Solidity',    color: '#aa6746' },
  sol:         { name: 'Solidity',    color: '#aa6746' },
  proto:       { name: 'Protobuf',    color: '#4285f4' },
  protobuf:    { name: 'Protobuf',    color: '#4285f4' },
};

/** Look up language icon/colour info. Returns null for unknown languages. */
export function getLanguageInfo(lang: string): LanguageIcon | null {
  if (!lang) return null;
  return LANG_MAP[lang.toLowerCase()] ?? null;
}

/** Get the accent colour for a language, or a neutral default. */
export function getLanguageColor(lang: string): string {
  return getLanguageInfo(lang)?.color ?? 'var(--text-faint)';
}

/** Get the display name for a language. */
export function getLanguageName(lang: string): string {
  return getLanguageInfo(lang)?.name ?? lang;
}
