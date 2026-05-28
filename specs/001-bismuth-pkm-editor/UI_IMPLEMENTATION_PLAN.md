# Bismuth UI Implementation Plan
**Based on Screenshot Analysis - 2026-05-26**

---

## Overview

This plan details the UI implementation for Bismuth PKM Editor, inspired by modern note-taking applications while maintaining our unique features (Portent entities, semantic connections, Johnny Decimal support).

---

## 1. Three-Column Layout Architecture

### Current State
✅ Already implemented in `src/App.svelte` (lines 82-140)

### Enhancements Needed

**File**: `src/App.svelte`

```svelte
<div class="app-container">
  <!-- Left Sidebar: Navigator -->
  <aside class="left-sidebar" class:collapsed={!$layoutStore.leftSidebarVisible}>
    <Navigator />
  </aside>

  <!-- Main Editor Pane -->
  <main class="editor-pane">
    <Toolbar />
    <Editor />
    <StatusBar />
  </main>

  <!-- Right Sidebar: Context Panels -->
  <aside class="right-sidebar" class:collapsed={!$layoutStore.rightSidebarVisible}>
    <TabbedPanel>
      <BacklinksPanel />
      <EntityPanel />
      <ConnectionsView />
      <GitPanel /> <!-- NEW -->
    </TabbedPanel>
  </aside>
</div>
```

**CSS Updates**: `src/App.svelte` (styles section)
- Add smooth transitions for sidebar collapse
- Implement resize handles with visual feedback
- Add panel dividers with hover states

---

## 2. Left Sidebar - Enhanced Navigator

### 2.1 Folder Tree Component

**File**: `src/lib/components/sidebar/FolderTree.svelte`

**Current Issues to Fix**:
- ❌ Missing folder icons
- ❌ No expand/collapse animations
- ❌ Accessibility warnings (tabindex, keyboard handlers)

**Implementation**:

```svelte
<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { slide } from 'svelte/transition';
  
  interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
    expanded: boolean;
    color?: string; // US15 - folder color assignment
    icon?: string;  // US15 - custom icons
  }
  
  export let node: FolderNode;
  export let depth: number = 0;
  
  function toggleExpand() {
    node.expanded = !node.expanded;
  }
  
  function handleKeyboard(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' && !node.expanded) toggleExpand();
    if (e.key === 'ArrowLeft' && node.expanded) toggleExpand();
    if (e.key === 'Enter') selectFolder(node.path);
  }
</script>

<div 
  class="folder-item" 
  style:padding-left="{depth * 16}px"
  role="treeitem"
  tabindex="0"
  aria-expanded={node.expanded}
  on:click={toggleExpand}
  on:keydown={handleKeyboard}
>
  <Icon 
    name={node.expanded ? 'chevron-down' : 'chevron-right'} 
    size={16} 
  />
  <Icon 
    name={node.icon || 'folder'} 
    size={16}
    color={node.color}
  />
  <span class="folder-name">{node.name}</span>
</div>

{#if node.expanded && node.children.length > 0}
  <div transition:slide={{ duration: 200 }}>
    {#each node.children as child}
      <svelte:self node={child} depth={depth + 1} />
    {/each}
  </div>
{/if}

<style>
  .folder-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: var(--radius-s);
    transition: background-color 0.15s ease;
  }
  
  .folder-item:hover {
    background-color: var(--interactive-hover);
  }
  
  .folder-item:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }
  
  .folder-name {
    font-size: 13px;
    color: var(--text-normal);
    user-select: none;
  }
</style>
```

### 2.2 File List Component

**File**: `src/lib/components/sidebar/FileList.svelte`

**Enhancements**:
- Add file type icons (markdown, PDF, image)
- Show modification date
- Preview first line of content
- Pinned notes at top (US15)
- Drag-and-drop reordering

```svelte
<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { formatDistanceToNow } from 'date-fns'; // Add to package.json
  
  interface FileItem {
    path: string;
    title: string;
    modified: Date;
    preview: string;
    pinned: boolean;
    color?: string;
    icon?: string;
  }
  
  export let files: FileItem[];
  
  $: sortedFiles = [...files].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.modified.getTime() - a.modified.getTime();
  });
</script>

<div class="file-list">
  {#each sortedFiles as file (file.path)}
    <div 
      class="file-item" 
      class:pinned={file.pinned}
      draggable="true"
      role="button"
      tabindex="0"
    >
      <div class="file-header">
        <Icon name={file.icon || 'file-text'} size={16} color={file.color} />
        <span class="file-title">{file.title}</span>
        {#if file.pinned}
          <Icon name="pin" size={12} class="pin-icon" />
        {/if}
      </div>
      <div class="file-meta">
        <span class="file-date">{formatDistanceToNow(file.modified, { addSuffix: true })}</span>
      </div>
      <div class="file-preview">{file.preview}</div>
    </div>
  {/each}
</div>

<style>
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
  }
  
  .file-item {
    padding: 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-left: 2px solid transparent;
  }
  
  .file-item:hover {
    background-color: var(--interactive-hover);
  }
  
  .file-item.pinned {
    border-left-color: var(--interactive-accent);
    background-color: var(--background-modifier-form-field-highlighted);
  }
  
  .file-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  
  .file-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-normal);
    flex: 1;
  }
  
  .file-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  
  .file-preview {
    font-size: 12px;
    color: var(--text-faint);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .pin-icon {
    color: var(--interactive-accent);
  }
</style>
```

### 2.3 Navigator Tabs

**File**: `src/lib/components/sidebar/Navigator.svelte`

Add tabbed interface for:
- **Files** (folder tree + file list)
- **Tags** (tag hierarchy with counts)
- **Properties** (frontmatter key browser)
- **Search** (quick filter)

```svelte
<script lang="ts">
  type Tab = 'files' | 'tags' | 'properties' | 'search';
  let activeTab: Tab = 'files';
</script>

<div class="navigator">
  <div class="tab-bar">
    <button 
      class="tab" 
      class:active={activeTab === 'files'}
      on:click={() => activeTab = 'files'}
    >
      <Icon name="folder" size={16} />
      Files
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'tags'}
      on:click={() => activeTab = 'tags'}
    >
      <Icon name="tag" size={16} />
      Tags
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'properties'}
      on:click={() => activeTab = 'properties'}
    >
      <Icon name="list" size={16} />
      Properties
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'search'}
      on:click={() => activeTab = 'search'}
    >
      <Icon name="search" size={16} />
      Search
    </button>
  </div>
  
  <div class="tab-content">
    {#if activeTab === 'files'}
      <FolderTree />
      <FileList />
    {:else if activeTab === 'tags'}
      <TagPanel />
    {:else if activeTab === 'properties'}
      <PropertyBrowser />
    {:else if activeTab === 'search'}
      <QuickSearch />
    {/if}
  </div>
</div>

<style>
  .navigator {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--background-secondary);
  }
  
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;
    border-bottom: 2px solid transparent;
  }
  
  .tab:hover {
    color: var(--text-normal);
    background-color: var(--interactive-hover);
  }
  
  .tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
```

---

## 3. Main Editor Pane Enhancements

### 3.1 Toolbar Component

**File**: `src/lib/components/vault/Toolbar.svelte`

**Current Issues**:
- ❌ Import errors (`$lib/stores/vault`, `$lib/api/vault`)
- Missing formatting controls
- No breadcrumb navigation

**Implementation**:

```svelte
<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { currentVault, activeNotePath } from '@/stores/vault/vault';
  
  function getBreadcrumbs(path: string): string[] {
    if (!path) return [];
    return path.split('/').filter(Boolean);
  }
  
  $: breadcrumbs = getBreadcrumbs($activeNotePath || '');
</script>

<div class="toolbar">
  <div class="breadcrumbs">
    <Icon name="home" size={14} />
    {#each breadcrumbs as crumb, i}
      <Icon name="chevron-right" size={12} />
      <span class="crumb">{crumb}</span>
    {/each}
  </div>
  
  <div class="toolbar-actions">
    <button class="toolbar-btn" title="Bold (Cmd+B)">
      <Icon name="bold" size={16} />
    </button>
    <button class="toolbar-btn" title="Italic (Cmd+I)">
      <Icon name="italic" size={16} />
    </button>
    <button class="toolbar-btn" title="Insert link (Cmd+K)">
      <Icon name="link" size={16} />
    </button>
    <div class="separator"></div>
    <button class="toolbar-btn" title="More options">
      <Icon name="more-horizontal" size={16} />
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--background-primary);
    height: 40px;
  }
  
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }
  
  .crumb {
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .crumb:hover {
    color: var(--text-normal);
  }
  
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .toolbar-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  
  .separator {
    width: 1px;
    height: 20px;
    background-color: var(--border-color);
    margin: 0 4px;
  }
</style>
```

### 3.2 Enhanced Editor with Grammar Highlights

**File**: `src/lib/components/editor/Editor.svelte`

Add extension for inline suggestions (like Grammarly):

**New File**: `src/lib/components/editor/extensions/grammar.ts`

```typescript
import { ViewPlugin, Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

// Grammar suggestion decoration
const suggestionDecoration = Decoration.mark({
  class: 'cm-grammar-suggestion',
  attributes: {
    'data-suggestion': '',
  },
});

export const grammarExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      
      // Example: Detect passive voice patterns
      const passivePatterns = [
        /\bare being\s+\w+/gi,
        /\bwas being\s+\w+/gi,
        /\bhave been\s+\w+/gi,
      ];
      
      const doc = view.state.doc.toString();
      
      passivePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(doc)) !== null) {
          const from = match.index;
          const to = from + match[0].length;
          decorations.push(suggestionDecoration.range(from, to));
        }
      });
      
      return Decoration.set(decorations, true);
    }
  },
  {
    decorations: v => v.decorations,
  }
);
```

**CSS for grammar highlights**: `src/lib/components/editor/Editor.svelte`

```css
.cm-grammar-suggestion {
  background-color: rgba(255, 200, 0, 0.2);
  border-bottom: 2px solid rgba(255, 200, 0, 0.6);
  cursor: pointer;
}

.cm-grammar-suggestion:hover {
  background-color: rgba(255, 200, 0, 0.3);
}
```

### 3.3 Status Bar Component

**File**: `src/lib/components/StatusBar.svelte`

```svelte
<script lang="ts">
  import { derived } from 'svelte/store';
  import { editorContent } from '@/stores/editor';
  
  $: wordCount = $editorContent.split(/\s+/).filter(Boolean).length;
  $: charCount = $editorContent.length;
  $: lineCount = $editorContent.split('\n').length;
  
  let backlinksCount = 0; // From backlinks panel
  let cursorPosition = { line: 1, col: 1 };
</script>

<div class="status-bar">
  <div class="status-left">
    <span class="status-item">
      <Icon name="file-text" size={12} />
      {wordCount} words
    </span>
    <span class="status-item">
      {charCount} characters
    </span>
    <span class="status-item">
      Ln {cursorPosition.line}, Col {cursorPosition.col}
    </span>
  </div>
  
  <div class="status-right">
    <span class="status-item">
      <Icon name="link" size={12} />
      {backlinksCount} backlinks
    </span>
    <span class="status-item">
      <Icon name="zap" size={12} />
      Smart v2.4.4
    </span>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 16px;
    border-top: 1px solid var(--border-color);
    background-color: var(--background-secondary);
    font-size: 11px;
    color: var(--text-muted);
    height: 24px;
  }
  
  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
```

---

## 4. Right Sidebar - Context Panels

### 4.1 Git Integration Panel (NEW)

**File**: `src/lib/components/sidebar/GitPanel.svelte`

```svelte
<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  
  interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'untracked';
  }
  
  let stagedChanges: FileChange[] = [];
  let unstagedChanges: FileChange[] = [];
  let commitMessage = '';
  
  function getStatusIcon(status: string) {
    switch (status) {
      case 'added': return 'plus';
      case 'modified': return 'edit';
      case 'deleted': return 'trash';
      case 'untracked': return 'file-plus';
      default: return 'file';
    }
  }
  
  function getStatusLabel(status: string) {
    switch (status) {
      case 'added': return 'U';
      case 'modified': return 'M';
      case 'deleted': return 'D';
      case 'untracked': return '?';
      default: return '';
    }
  }
</script>

<div class="git-panel">
  <div class="commit-section">
    <input 
      type="text" 
      placeholder="Commit message" 
      bind:value={commitMessage}
      class="commit-input"
    />
    <button class="commit-btn" disabled={!commitMessage}>
      <Icon name="git-commit" size={14} />
      Commit
    </button>
  </div>
  
  <div class="changes-section">
    <div class="section-header">
      <Icon name="check-circle" size={14} />
      <span>Staged Changes</span>
      <span class="count">{stagedChanges.length}</span>
    </div>
    
    {#each stagedChanges as change}
      <div class="file-change">
        <span class="status-badge status-{change.status}">
          {getStatusLabel(change.status)}
        </span>
        <span class="file-path">{change.path}</span>
        <button class="unstage-btn" title="Unstage">
          <Icon name="minus" size={12} />
        </button>
      </div>
    {/each}
  </div>
  
  <div class="changes-section">
    <div class="section-header">
      <Icon name="file-text" size={14} />
      <span>Changes</span>
      <span class="count">+{unstagedChanges.length}</span>
    </div>
    
    {#each unstagedChanges as change}
      <div class="file-change">
        <span class="status-badge status-{change.status}">
          {getStatusLabel(change.status)}
        </span>
        <span class="file-path">{change.path}</span>
        <button class="stage-btn" title="Stage">
          <Icon name="plus" size={12} />
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .git-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
    gap: 16px;
  }
  
  .commit-section {
    display: flex;
    gap: 8px;
  }
  
  .commit-input {
    flex: 1;
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 12px;
  }
  
  .commit-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: 12px;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  
  .commit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .changes-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  
  .count {
    margin-left: auto;
    background-color: var(--background-modifier-border);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
  }
  
  .file-change {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    font-size: 12px;
    font-family: var(--font-monospace);
    transition: background-color 0.15s ease;
  }
  
  .file-change:hover {
    background-color: var(--interactive-hover);
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 2px;
    font-size: 10px;
    font-weight: 600;
  }
  
  .status-added,
  .status-untracked {
    background-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .status-modified {
    background-color: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  
  .status-deleted {
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .file-path {
    flex: 1;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .stage-btn,
  .unstage-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
  }
  
  .file-change:hover .stage-btn,
  .file-change:hover .unstage-btn {
    opacity: 1;
  }
  
  .stage-btn:hover,
  .unstage-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
```

### 4.2 Tabbed Right Sidebar

**File**: `src/lib/components/sidebar/TabbedPanel.svelte`

```svelte
<script lang="ts">
  type PanelTab = 'backlinks' | 'entity' | 'connections' | 'git';
  let activeTab: PanelTab = 'backlinks';
</script>

<div class="tabbed-panel">
  <div class="panel-tabs">
    <button 
      class="panel-tab" 
      class:active={activeTab === 'backlinks'}
      on:click={() => activeTab = 'backlinks'}
      title="Backlinks"
    >
      <Icon name="link-2" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'entity'}
      on:click={() => activeTab = 'entity'}
      title="Entity Info"
    >
      <Icon name="box" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'connections'}
      on:click={() => activeTab = 'connections'}
      title="Semantic Connections"
    >
      <Icon name="share-2" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'git'}
      on:click={() => activeTab = 'git'}
      title="Git Changes"
    >
      <Icon name="git-branch" size={16} />
    </button>
  </div>
  
  <div class="panel-content">
    {#if activeTab === 'backlinks'}
      <BacklinksPanel />
    {:else if activeTab === 'entity'}
      <EntityPanel />
    {:else if activeTab === 'connections'}
      <ConnectionsView />
    {:else if activeTab === 'git'}
      <GitPanel />
    {/if}
  </div>
</div>

<style>
  .tabbed-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .panel-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--background-secondary);
  }
  
  .panel-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    border-bottom: 2px solid transparent;
  }
  
  .panel-tab:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  
  .panel-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
```

---

## 5. Theme & Design Tokens

### 5.1 Update Design Tokens

**File**: `src/lib/styles/tokens.css`

Add missing tokens for new UI elements:

```css
:root {
  /* Existing tokens... */
  
  /* Status badges */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #3b82f6;
  
  /* Git status colors */
  --git-added: #10b981;
  --git-modified: #3b82f6;
  --git-deleted: #ef4444;
  --git-untracked: #8b5cf6;
  
  /* Sidebar widths */
  --sidebar-min-width: 200px;
  --sidebar-max-width: 600px;
  --sidebar-default-width: 300px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;
  
  /* Z-index layers */
  --z-sidebar: 10;
  --z-toolbar: 20;
  --z-modal: 100;
  --z-toast: 200;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
}
```

### 5.2 Responsive Typography

**File**: `src/lib/styles/typography.css`

Fix the `-webkit-line-clamp` warnings:

```css
.text-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2; /* Standard property */
  overflow: hidden;
}

.text-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  overflow: hidden;
}
```

---

## 6. Accessibility Fixes

### 6.1 Fix WelcomeScreen Accessibility

**File**: `src/lib/components/vault/WelcomeScreen.svelte`

Fix the dialog and autofocus warnings:

```svelte
<!-- Line 248: Add tabindex to dialog -->
<div 
  class="recent-vaults-dialog" 
  role="dialog"
  tabindex="0"
  aria-labelledby="dialog-title"
  on:click={handleDialogClick}
  on:keydown={handleDialogKeydown}
>
  <h3 id="dialog-title">Recent Vaults</h3>
  <!-- ... -->
</div>

<!-- Line 260: Remove autofocus or make it conditional -->
<input 
  type="text" 
  placeholder="Search vaults..."
  autofocus={false}
  on:focus={handleFocus}
/>
```

### 6.2 Fix ResizablePanel Accessibility

**File**: `src/lib/components/layout/ResizablePanel.svelte`

```svelte
<!-- Line 100: Make resize handle interactive -->
<div 
  class="resize-handle"
  role="separator"
  aria-orientation="vertical"
  aria-valuenow={width}
  aria-valuemin={200}
  aria-valuemax={600}
  tabindex="0"
  on:mousedown={handleMouseDown}
  on:keydown={handleKeyboardResize}
>
  <div class="resize-indicator"></div>
</div>
```

### 6.3 Fix NoteEditor Self-Closing Tag

**File**: `src/lib/components/note/NoteEditor.svelte`

```svelte
<!-- Line 76: Fix self-closing textarea -->
<textarea 
  bind:value={content}
  placeholder="Start writing..."
></textarea>
```

---

## 7. Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix `main.ts` mounting issue (DONE)
2. Fix accessibility warnings in WelcomeScreen
3. Fix ResizablePanel keyboard support
4. Fix NoteEditor self-closing tag
5. Fix Toolbar import errors

### Phase 2: Core UI (Week 2-3)
1. Implement enhanced FolderTree with icons and animations
2. Implement FileList with preview and pinning
3. Add Navigator tabs (Files, Tags, Properties)
4. Implement Toolbar with breadcrumbs
5. Implement StatusBar

### Phase 3: Context Panels (Week 4)
1. Implement TabbedPanel component
2. Implement GitPanel (new feature)
3. Enhance BacklinksPanel
4. Polish EntityPanel
5. Polish ConnectionsView

### Phase 4: Polish & Performance (Week 5)
1. Add smooth transitions
2. Implement drag-and-drop
3. Add keyboard shortcuts
4. Performance optimization
5. E2E testing

---

## 8. Testing Strategy

### Unit Tests
- `FolderTree.test.ts` - Keyboard navigation, expand/collapse
- `FileList.test.ts` - Sorting, pinning, filtering
- `StatusBar.test.ts` - Word count, character count
- `GitPanel.test.ts` - Staging, unstaging, commit

### E2E Tests
- `navigation.spec.ts` - Folder tree navigation, file selection
- `editor.spec.ts` - Typing, formatting, wikilinks
- `git.spec.ts` - Stage files, commit changes
- `accessibility.spec.ts` - Keyboard-only navigation

---

## 9. Dependencies to Add

**File**: `package.json`

```json
{
  "dependencies": {
    "date-fns": "^3.0.0"
  }
}
```

Run: `pnpm install date-fns`

---

## 10. File Structure Summary

```
src/lib/components/
├── sidebar/
│   ├── Navigator.svelte          ✅ Exists (enhance)
│   ├── FolderTree.svelte          ✅ Exists (fix accessibility)
│   ├── FileList.svelte            ✅ Exists (add preview)
│   ├── TabbedPanel.svelte         ❌ NEW
│   ├── GitPanel.svelte            ❌ NEW
│   ├── TagPanel.svelte            ✅ Exists
│   ├── PropertyBrowser.svelte     ❌ NEW
│   ├── QuickSearch.svelte         ❌ NEW
│   ├── BacklinksPanel.svelte      ✅ Exists
│   ├── EntityPanel.svelte         ✅ Exists
│   └── ConnectionsView.svelte     ✅ Exists
├── vault/
│   ├── Toolbar.svelte             ✅ Exists (fix imports)
│   └── WelcomeScreen.svelte       ✅ Exists (fix accessibility)
├── editor/
│   ├── Editor.svelte              ✅ Exists
│   └── extensions/
│       ├── wikilink.ts            ✅ Exists
│       └── grammar.ts             ❌ NEW
├── StatusBar.svelte               ❌ NEW
└── ui/
    └── (existing components)      ✅ Exists
```

---

## Summary

This plan provides a comprehensive roadmap to transform Bismuth's UI to match modern PKM applications while maintaining unique features. The implementation is broken into manageable phases with clear priorities and testing strategies.

**Next Steps**:
1. Start with Phase 1 critical fixes
2. Implement Phase 2 core UI components
3. Add Phase 3 context panels
4. Polish with Phase 4 enhancements

**Estimated Timeline**: 5 weeks for full implementation
**Current Status**: Phase 1 in progress (main.ts fixed ✅)
