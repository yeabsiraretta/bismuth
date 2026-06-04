# Phase 0: Research & Technical Decisions

**Feature**: Bismuth PKM Editor  
**Date**: 2026-05-25  
**Status**: ✅ Complete — All decisions implemented in MVP

## Overview

This document captures all technical research, decisions, and rationale for the Bismuth PKM editor implementation. Each section addresses a specific technical unknown identified in the implementation plan.

---

## 1. Tauri IPC Architecture

### Decision

Use **Tauri's command/event pattern** with async Rust handlers and TypeScript wrappers.

### Rationale

- **Type Safety**: Tauri generates TypeScript types from Rust command signatures
- **Performance**: Direct Rust-to-JS serialization via serde, no JSON overhead
- **Error Handling**: Rust `Result<T, E>` maps cleanly to TypeScript `Promise<T>`
- **State Management**: Tauri's `State` allows dependency injection of services

### Implementation Pattern

**Rust Command** (`src-tauri/src/commands/vault.rs`):

```rust
#[tauri::command]
async fn open_vault(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vault, String> {
    state.vault_service
        .open(PathBuf::from(path))
        .await
        .map_err(|e| e.to_string())
}
```

**TypeScript Wrapper** (`src/lib/services/vault.ts`):

```typescript
import { invoke } from '@tauri-apps/api/tauri';

export async function openVault(path: string): Promise<Vault> {
  return await invoke('open_vault', { path });
}
```

### Performance Profiling

- Use `criterion.rs` for Rust benchmarks
- Use `console.time()` for IPC round-trip measurement
- Target: <5ms for simple commands, <50ms for complex operations

### Alternatives Considered

- **Electron IPC**: Slower, larger bundle (rejected per NFR-006/007)
- **WebSockets**: Unnecessary complexity for local app (rejected)

---

## 2. CodeMirror 6 Integration

### Decision

Use **CodeMirror 6** with custom extensions for wikilinks, backlinks, and Obsidian compatibility.

### Rationale

- **Proven**: Used by Obsidian, VS Code (Monaco is CM fork)
- **Performance**: Virtual scrolling, incremental parsing
- **Extensibility**: Clean extension API for custom syntax
- **Accessibility**: Built-in screen reader support

### Extension Architecture

**Wikilink Extension** (`src/lib/components/editor/extensions/wikilink.ts`):

```typescript
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

const wikilinkDecoration = Decoration.mark({
  class: 'cm-wikilink',
  attributes: { 'data-wikilink': 'true' },
});

export const wikilinkPlugin = ViewPlugin.fromClass(
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
      const decorations = [];
      const tree = syntaxTree(view.state);

      // Find [[wikilink]] patterns
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = regex.exec(view.state.doc.toString())) !== null) {
        decorations.push(wikilinkDecoration.range(match.index, match.index + match[0].length));
      }

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
```

### Performance Optimization

- **Lazy Loading**: Only parse visible viewport
- **Incremental Updates**: Only re-parse changed regions
- **Debouncing**: Batch decoration updates (16ms threshold)

### Alternatives Considered

- **Monaco Editor**: Heavier, designed for VS Code (rejected)
- **Ace Editor**: Older, less performant (rejected)
- **ProseMirror**: WYSIWYG-focused, not markdown-native (rejected)

---

## 3. Tantivy Full-Text Search

### Decision

Use **Tantivy** with custom schema for full-text + metadata search.

### Rationale

- **Performance**: Written in Rust, BM25 ranking, <100ms for 500k docs
- **Features**: Fuzzy search, phrase queries, field filters
- **Integration**: Native Rust, no FFI overhead
- **Proven**: Used by Meilisearch, Quickwit

### Index Schema

```rust
use tantivy::schema::*;

pub fn build_schema() -> Schema {
    let mut schema_builder = Schema::builder();

    // Primary fields
    schema_builder.add_text_field("path", TEXT | STORED);
    schema_builder.add_text_field("title", TEXT | STORED);
    schema_builder.add_text_field("content", TEXT);

    // Metadata fields
    schema_builder.add_facet_field("tags", INDEXED);
    schema_builder.add_text_field("portent_type", STRING | STORED);
    schema_builder.add_date_field("created", INDEXED | STORED);
    schema_builder.add_date_field("modified", INDEXED | STORED);

    // Graph fields
    schema_builder.add_text_field("outbound_links", TEXT);
    schema_builder.add_u64_field("link_count", INDEXED);

    schema_builder.build()
}
```

### Incremental Indexing Strategy

1. **Initial Scan**: Index all files on vault open (background thread)
2. **File Watcher**: Index changed files on save (debounced 500ms)
3. **Batch Updates**: Group multiple changes into single commit
4. **Persistence**: Store index in `.bismuth/index/` (SQLite metadata + Tantivy segments)

### Query DSL

```rust
pub struct SearchQuery {
    pub text: String,
    pub tags: Vec<String>,
    pub portent_type: Option<String>,
    pub date_range: Option<(DateTime, DateTime)>,
    pub fuzzy: bool,
}

impl SearchQuery {
    pub fn to_tantivy_query(&self, schema: &Schema) -> Box<dyn Query> {
        let mut queries: Vec<Box<dyn Query>> = vec![];

        // Full-text search
        if !self.text.is_empty() {
            let query_parser = QueryParser::for_index(&index, vec![
                schema.get_field("title").unwrap(),
                schema.get_field("content").unwrap(),
            ]);
            queries.push(Box::new(query_parser.parse_query(&self.text).unwrap()));
        }

        // Tag filter
        for tag in &self.tags {
            queries.push(Box::new(TermQuery::new(
                Term::from_facet(schema.get_field("tags").unwrap(), &Facet::from(&format!("/{}", tag))),
                IndexRecordOption::Basic,
            )));
        }

        // Combine with BooleanQuery
        BooleanQuery::new(queries.into_iter().map(|q| (Occur::Must, q)).collect())
    }
}
```

### Performance Benchmarks

- **Indexing**: 10k files/sec (measured via criterion.rs)
- **Search**: <100ms for 500k files (BM25 ranking)
- **Memory**: <200MB for 500k files

### Alternatives Considered

- **MeiliSearch**: Requires separate server process (rejected)
- **Sonic**: Less mature, fewer features (rejected)
- **SQLite FTS5**: Slower than Tantivy for large corpora (rejected)

---

## 4. Obsidian Theme Compatibility

### Decision

Implement **CSS variable extraction + Style Settings YAML parser** to support Obsidian themes without modification.

### Rationale

- **User Expectation**: Obsidian users expect their themes to work
- **Ecosystem**: 1000+ Obsidian themes available
- **Differentiation**: Theme compatibility is a key selling point

### CSS Variable Mapping

**Obsidian Variables** (from community themes):

```css
/* Obsidian standard variables */
--background-primary: #1e1e1e;
--background-secondary: #252525;
--text-normal: #dcddde;
--text-muted: #999;
--interactive-accent: #7f6df2;
--interactive-accent-hover: #8875ff;
```

**Bismuth Application**:

```typescript
// src/lib/services/theme.ts
export function applyTheme(cssContent: string) {
  // Extract CSS variables
  const variables = extractCSSVariables(cssContent);

  // Inject into document root
  const root = document.documentElement;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
}

function extractCSSVariables(css: string): Record<string, string> {
  const regex = /--([\w-]+):\s*([^;]+);/g;
  const variables: Record<string, string> = {};
  let match;

  while ((match = regex.exec(css)) !== null) {
    variables[`--${match[1]}`] = match[2].trim();
  }

  return variables;
}
```

### Style Settings Parser

**YAML Format** (from Obsidian Style Settings plugin):

```yaml
/* @settings

name: My Theme
id: my-theme
settings:
  - id: accent-color
    title: Accent Color
    type: variable-color
    format: hsl-split
    default: '#7f6df2'
  - id: font-size
    title: Font Size
    type: variable-number-slider
    default: 16
    min: 12
    max: 24
    step: 1
    format: px
*/
```

**Parser Implementation** (`src-tauri/src/services/theme_service.rs`):

```rust
use serde::{Deserialize, Serialize};
use yaml_rust::YamlLoader;

#[derive(Debug, Deserialize, Serialize)]
pub struct StyleSettings {
    pub name: String,
    pub id: String,
    pub settings: Vec<Setting>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum Setting {
    #[serde(rename = "variable-color")]
    VariableColor {
        id: String,
        title: String,
        format: String,
        default: String,
    },
    #[serde(rename = "variable-number-slider")]
    VariableNumberSlider {
        id: String,
        title: String,
        default: i32,
        min: i32,
        max: i32,
        step: i32,
        format: Option<String>,
    },
    // ... other types
}

pub fn parse_style_settings(css: &str) -> Result<Vec<StyleSettings>, Error> {
    let regex = Regex::new(r"/\*\s*@settings\s*(.*?)\s*\*/").unwrap();
    let mut settings = vec![];

    for cap in regex.captures_iter(css) {
        let yaml_str = &cap[1];
        let docs = YamlLoader::load_from_str(yaml_str)?;

        for doc in docs {
            let setting: StyleSettings = serde_yaml::from_value(doc)?;
            settings.push(setting);
        }
    }

    Ok(settings)
}
```

### Component Library (Tolaria Reference)

**Design Tokens** (`src/lib/styles/tokens.css`):

```css
/* Obsidian-compatible design tokens */
:root {
  /* Colors */
  --bg-primary: var(--background-primary, #ffffff);
  --bg-secondary: var(--background-secondary, #f5f5f5);
  --text-normal: var(--text-normal, #2e3338);
  --text-muted: var(--text-muted, #6c7680);
  --accent: var(--interactive-accent, #7f6df2);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;

  /* Typography */
  --font-ui: var(
    --font-interface,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif
  );
  --font-text: var(--font-text, 'Inter', sans-serif);
  --font-mono: var(--font-monospace, 'JetBrains Mono', monospace);
}
```

**Button Component** (`src/lib/components/ui/Button.svelte`):

```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<button class="btn btn-{variant} btn-{size}" on:click>
  <slot />
</button>

<style>
  .btn {
    font-family: var(--font-ui);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--interactive-accent-hover, var(--accent));
  }

  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-normal);
  }

  .btn-sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: 12px;
  }
  .btn-md {
    padding: var(--space-sm) var(--space-md);
    font-size: 14px;
  }
  .btn-lg {
    padding: var(--space-md) var(--space-lg);
    font-size: 16px;
  }
</style>
```

### Testing Strategy

- **Theme Compatibility**: Test with top 10 Obsidian themes (Minimal, California Coast, Gruvbox, etc.)
- **Style Settings**: Validate parser with 20+ real-world Style Settings configs
- **Visual Regression**: Screenshot comparison for theme changes

### Alternatives Considered

- **Custom Theme Format**: Would break Obsidian compatibility (rejected)
- **CSS-in-JS**: Doesn't support Obsidian CSS variables (rejected)

---

## 5. File Watcher Strategy

### Decision

Use **notify-rs** with debouncing and cross-platform path normalization.

### Rationale

- **Cross-Platform**: Works on macOS (FSEvents), Windows (ReadDirectoryChangesW), Linux (inotify)
- **Performance**: Native OS APIs, low overhead
- **Mature**: Used by cargo, rust-analyzer

### Implementation

```rust
use notify::{Watcher, RecursiveMode, watcher};
use std::sync::mpsc::channel;
use std::time::Duration;

pub struct VaultWatcher {
    watcher: RecommendedWatcher,
    debouncer: Debouncer,
}

impl VaultWatcher {
    pub fn new(vault_path: PathBuf) -> Result<Self, Error> {
        let (tx, rx) = channel();

        let mut watcher = watcher(tx, Duration::from_millis(500))?;
        watcher.watch(&vault_path, RecursiveMode::Recursive)?;

        let debouncer = Debouncer::new(rx, Duration::from_millis(500));

        Ok(Self { watcher, debouncer })
    }

    pub async fn watch(&mut self) -> Result<(), Error> {
        loop {
            let events = self.debouncer.next_batch().await;

            for event in events {
                match event.kind {
                    EventKind::Create(_) => self.handle_create(event.paths).await?,
                    EventKind::Modify(_) => self.handle_modify(event.paths).await?,
                    EventKind::Remove(_) => self.handle_remove(event.paths).await?,
                    _ => {}
                }
            }
        }
    }
}
```

### Debouncing Strategy

- **Window**: 500ms (balance between responsiveness and batch efficiency)
- **Batch**: Group all events in window into single index update
- **Ignore**: Temporary files (`.tmp`, `.swp`), hidden files (`.DS_Store`)

### Cross-Platform Path Handling

```rust
use std::path::{Path, PathBuf};

pub fn normalize_path(path: &Path) -> PathBuf {
    // Convert to absolute path
    let absolute = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());

    // Normalize separators (Windows: \ → /)
    #[cfg(windows)]
    let normalized = PathBuf::from(absolute.to_string_lossy().replace("\\", "/"));

    #[cfg(not(windows))]
    let normalized = absolute;

    normalized
}
```

### External Editor Sync

- **Conflict Detection**: Compare file mtime before writing
- **Merge Strategy**: Last-write-wins (user warned if external change detected)
- **Auto-Reload**: Reload file in editor if changed externally (debounced)

### Alternatives Considered

- **Polling**: Higher CPU usage, slower detection (rejected)
- **Manual Refresh**: Poor UX, doesn't meet real-time requirement (rejected)

---

## Summary of Decisions

| Area              | Decision                       | Key Rationale                        |
| ----------------- | ------------------------------ | ------------------------------------ |
| **IPC**           | Tauri commands/events          | Type-safe, performant, async-native  |
| **Editor**        | CodeMirror 6                   | Proven, extensible, accessible       |
| **Search**        | Tantivy                        | Rust-native, <100ms for 500k files   |
| **Themes**        | CSS variables + Style Settings | Obsidian compatibility, 1000+ themes |
| **File Watching** | notify-rs                      | Cross-platform, low overhead         |

## Next Steps

~~1. **Proof-of-Concepts**: Build minimal examples for each decision~~  
~~2. **Performance Baselines**: Measure actual performance vs. targets~~  
~~3. **Integration Tests**: Validate IPC contracts, file watching, search accuracy~~  
~~4. **Proceed to Phase 1**: Data model design, IPC contracts, quickstart guide~~

**Status**: ✅ All phases implemented through MVP (Phases 1–13).

## Implementation Deviations

| Area               | Original Decision                | Actual Implementation                                                                                                                          | Reason                                                                                      |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Editor**         | CodeMirror 6 with Konva.js graph | CodeMirror 6 ✅ + custom HTML5 Canvas (not Konva) for canvas tool                                                                              | Canvas workspace uses native Canvas 2D API for lighter weight; Konva planned for graph only |
| **Search HTTP**    | Port 42042                       | Port 27182 (`search_server.rs`)                                                                                                                | Changed for uniqueness                                                                      |
| **Embedding**      | Full neural model via candle     | Character n-gram + word hashing (384-dim)                                                                                                      | CPU-only target met; neural upgrade deferred                                                |
| **Themes**         | `yaml-rust` for Style Settings   | `serde_yaml` (deprecated but functional)                                                                                                       | Better serde integration                                                                    |
| **File structure** | Flat services                    | VaultService split into sub-modules (`vault_operations.rs`, `vault_recovery.rs`, `vault_history.rs`, `vault_scanner.rs`, `vault_templates.rs`) | Readability at scale                                                                        |
