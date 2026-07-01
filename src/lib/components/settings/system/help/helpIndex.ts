import { HELP_BASE_URL } from '@/utils/settings/helpUrls';

export interface HelpTopic {
  topic: string;
  url: string;
  keywords: string[];
}

export const HELP_TOPICS: HelpTopic[] = [
  // Getting started
  {
    topic: 'Getting Started',
    url: `${HELP_BASE_URL}/Getting-Started`,
    keywords: ['start', 'setup', 'install', 'begin', 'intro', 'onboarding'],
  },
  {
    topic: 'Creating Notes',
    url: `${HELP_BASE_URL}/Creating-Notes`,
    keywords: ['note', 'create', 'new', 'markdown', 'write'],
  },
  {
    topic: 'Wikilinks',
    url: `${HELP_BASE_URL}/Wikilinks`,
    keywords: ['wikilink', 'link', 'backlink', 'connect', '[[', 'internal link'],
  },
  {
    topic: 'Keyboard Shortcuts',
    url: `${HELP_BASE_URL}/Keyboard-Shortcuts`,
    keywords: ['hotkey', 'shortcut', 'keyboard', 'keybind', 'command'],
  },
  {
    topic: 'Settings Overview',
    url: `${HELP_BASE_URL}/Settings`,
    keywords: ['settings', 'config', 'preference', 'option'],
  },
  // Editor
  {
    topic: 'Editor Basics',
    url: `${HELP_BASE_URL}/Editor`,
    keywords: ['editor', 'typing', 'markdown', 'live preview', 'source'],
  },
  {
    topic: 'Typewriter & Zen Mode',
    url: `${HELP_BASE_URL}/Typewriter-Zen-Mode`,
    keywords: ['typewriter', 'zen', 'focus', 'distraction free'],
  },
  {
    topic: 'Vim Mode',
    url: `${HELP_BASE_URL}/Vim-Mode`,
    keywords: ['vim', 'modal', 'keybind', 'vimrc'],
  },
  // Navigation & Knowledge
  {
    topic: 'Search',
    url: `${HELP_BASE_URL}/Search`,
    keywords: ['search', 'find', 'query', 'filter', 'full text'],
  },
  {
    topic: 'Graph View',
    url: `${HELP_BASE_URL}/Graph-View`,
    keywords: ['graph', 'network', 'connections', 'knowledge', 'visualization'],
  },
  {
    topic: 'Smart Connections',
    url: `${HELP_BASE_URL}/Smart-Connections`,
    keywords: ['smart', 'connections', 'semantic', 'similar', 'embeddings', 'relevance'],
  },
  {
    topic: 'Backlinks & Outgoing Links',
    url: `${HELP_BASE_URL}/Backlinks`,
    keywords: ['backlink', 'outgoing', 'link', 'mention', 'reference'],
  },
  {
    topic: 'Tags & Entities',
    url: `${HELP_BASE_URL}/Tags-Entities`,
    keywords: ['tag', 'entity', 'classify', 'organize', 'metadata'],
  },
  {
    topic: 'Dataview Queries',
    url: `${HELP_BASE_URL}/Dataview`,
    keywords: ['dataview', 'query', 'dql', 'database', 'table', 'list'],
  },
  {
    topic: 'Embeddings & Semantic Search',
    url: `${HELP_BASE_URL}/Embeddings`,
    keywords: ['embedding', 'vector', 'semantic', 'similarity', 'index'],
  },
  // Productivity
  {
    topic: 'Tasks & Kanban',
    url: `${HELP_BASE_URL}/Tasks-Kanban`,
    keywords: ['task', 'kanban', 'board', 'todo', 'checklist', 'project'],
  },
  {
    topic: 'Calendar & Daily Notes',
    url: `${HELP_BASE_URL}/Calendar`,
    keywords: ['calendar', 'daily', 'planner', 'schedule', 'timeline'],
  },
  {
    topic: 'Templates',
    url: `${HELP_BASE_URL}/Templates`,
    keywords: ['template', 'snippet', 'boilerplate', 'quicknote'],
  },
  {
    topic: 'Journals',
    url: `${HELP_BASE_URL}/Journals`,
    keywords: ['journal', 'diary', 'shelf', 'periodic'],
  },
  {
    topic: 'Flashcards & Spaced Repetition',
    url: `${HELP_BASE_URL}/Flashcards`,
    keywords: ['flashcard', 'spaced repetition', 'study', 'review', 'anki'],
  },
  // Project Management
  {
    topic: 'Project Management',
    url: `${HELP_BASE_URL}/Projects`,
    keywords: ['project', 'goal', 'milestone', 'deliverable', 'tracker', 'management'],
  },
  {
    topic: 'PARA Method',
    url: `${HELP_BASE_URL}/PARA`,
    keywords: ['para', 'projects', 'areas', 'resources', 'archive', 'tiago forte', 'organize'],
  },
  {
    topic: 'RPG Campaign Manager',
    url: `${HELP_BASE_URL}/RPG-Manager`,
    keywords: ['rpg', 'campaign', 'npc', 'session', 'ttrpg', 'dnd'],
  },
  // Creative
  {
    topic: 'Canvas Workspace',
    url: `${HELP_BASE_URL}/Canvas`,
    keywords: ['canvas', 'draw', 'frame', 'shape', 'design', 'whiteboard'],
  },
  {
    topic: 'Component System',
    url: `${HELP_BASE_URL}/Canvas-Components`,
    keywords: ['component', 'reusable', 'library', 'instance'],
  },
  {
    topic: 'Flow Prototyping',
    url: `${HELP_BASE_URL}/Flow-Prototyping`,
    keywords: ['flow', 'prototype', 'preview', 'navigation', 'interactive'],
  },
  {
    topic: 'Longform Writing',
    url: `${HELP_BASE_URL}/Longform`,
    keywords: ['longform', 'manuscript', 'scene', 'novel', 'book', 'writing'],
  },
  {
    topic: 'Music Studio',
    url: `${HELP_BASE_URL}/Music-Studio`,
    keywords: ['music', 'daw', 'piano', 'midi', 'audio', 'composition'],
  },
  {
    topic: 'Spreadsheet',
    url: `${HELP_BASE_URL}/Spreadsheet`,
    keywords: ['spreadsheet', 'csv', 'table', 'formula', 'chart'],
  },
  // Integration
  {
    topic: 'Git Version Control',
    url: `${HELP_BASE_URL}/Git`,
    keywords: ['git', 'commit', 'sync', 'push', 'pull', 'version control'],
  },
  {
    topic: 'AI Agent (LLM)',
    url: `${HELP_BASE_URL}/AI-Agent`,
    keywords: ['ai', 'llm', 'agent', 'chat', 'ollama', 'claude', 'assistant'],
  },
  {
    topic: 'Voice Recorder',
    url: `${HELP_BASE_URL}/Voice`,
    keywords: ['voice', 'recorder', 'audio', 'transcription', 'mic'],
  },
  {
    topic: 'Publishing',
    url: `${HELP_BASE_URL}/Publishing`,
    keywords: ['publish', 'static site', 'blog', 'export', 'html'],
  },
  {
    topic: 'RSS Reader',
    url: `${HELP_BASE_URL}/RSS`,
    keywords: ['rss', 'feed', 'atom', 'reader', 'news'],
  },
  {
    topic: 'Importer',
    url: `${HELP_BASE_URL}/Importer`,
    keywords: ['import', 'obsidian', 'notion', 'evernote', 'migrate'],
  },
  {
    topic: 'PDF Annotator',
    url: `${HELP_BASE_URL}/Annotator`,
    keywords: ['pdf', 'annotate', 'highlight', 'epub', 'document'],
  },
  {
    topic: 'Web Clipper',
    url: `${HELP_BASE_URL}/Web-Clipper`,
    keywords: ['clip', 'web', 'save', 'bookmark', 'readitlater'],
  },
  {
    topic: 'Advanced URIs',
    url: `${HELP_BASE_URL}/Advanced-URIs`,
    keywords: ['uri', 'deeplink', 'automation', 'url scheme', 'bismuth://'],
  },
  // Appearance
  {
    topic: 'Themes & Appearance',
    url: `${HELP_BASE_URL}/Themes`,
    keywords: ['theme', 'dark', 'light', 'color', 'appearance', 'font', 'accent'],
  },
  // System
  {
    topic: 'Vault Management',
    url: `${HELP_BASE_URL}/Vault`,
    keywords: ['vault', 'folder', 'backup', 'sync', 'storage'],
  },
  {
    topic: 'Security & Privacy',
    url: `${HELP_BASE_URL}/Security`,
    keywords: ['security', 'privacy', 'local', 'encryption', 'data'],
  },
  // Developer guides
  {
    topic: 'TypeScript API Reference',
    url: `${HELP_BASE_URL}/API-Reference-TypeScript`,
    keywords: ['api', 'typescript', 'types', 'docs', 'reference'],
  },
  {
    topic: 'Rust API Reference',
    url: `${HELP_BASE_URL}/API-Reference-Rust`,
    keywords: ['rust', 'api', 'commands', 'tauri', 'docs'],
  },
  {
    topic: 'How to Add a Settings Tab',
    url: `${HELP_BASE_URL}/guides/add-settings-tab`,
    keywords: ['settings', 'tab', 'extend', 'guide', 'howto'],
  },
  {
    topic: 'How to Add a Canvas Tool',
    url: `${HELP_BASE_URL}/guides/add-canvas-tool`,
    keywords: ['canvas', 'tool', 'extend', 'guide', 'howto'],
  },
  {
    topic: 'How to Add a Tauri Command',
    url: `${HELP_BASE_URL}/guides/add-tauri-command`,
    keywords: ['tauri', 'command', 'ipc', 'rust', 'guide', 'howto'],
  },
  {
    topic: 'How to Add a Feature Module',
    url: `${HELP_BASE_URL}/guides/add-feature-module`,
    keywords: ['feature', 'module', 'extend', 'guide', 'howto'],
  },
];

export function filterTopics(query: string): HelpTopic[] {
  if (!query.trim()) return HELP_TOPICS;
  const q = query.toLowerCase();
  return HELP_TOPICS.filter(
    (t) => t.topic.toLowerCase().includes(q) || t.keywords.some((k) => k.includes(q))
  );
}
