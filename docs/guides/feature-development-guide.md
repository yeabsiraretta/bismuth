# Feature Development Guide

## Quick Start: Adding a New Feature

This guide shows you how to add a new feature to Bismuth following the modular architecture.

## Example: Adding a "Tags" Feature (US3)

### Step 1: Create Feature Structure

```bash
# Create feature directory
mkdir -p src/features/tags/{services,commands,events,ui,tests}

# Create core files
touch src/features/tags/mod.rs
touch src/features/tags/feature.rs
touch src/features/tags/config.rs
```

### Step 2: Define Feature Configuration

```rust
// src/features/tags/config.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagsConfig {
    pub enabled: bool,
    pub hierarchical: bool,
    pub auto_complete: bool,
    pub max_tag_length: usize,
    pub case_sensitive: bool,
}

impl Default for TagsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            hierarchical: true,
            auto_complete: true,
            max_tag_length: 50,
            case_sensitive: false,
        }
    }
}
```

### Step 3: Implement Feature Trait

```rust
// src/features/tags/feature.rs

use crate::core::{Feature, FeatureContext, Result};
use super::config::TagsConfig;
use super::services::TagService;

pub struct TagsFeature {
    enabled: bool,
    config: TagsConfig,
    service: Option<TagService>,
}

impl TagsFeature {
    pub fn new(config: TagsConfig) -> Self {
        Self {
            enabled: config.enabled,
            config,
            service: None,
        }
    }
}

impl Feature for TagsFeature {
    fn id(&self) -> &'static str {
        "tags"
    }

    fn name(&self) -> &str {
        "Hierarchical Tags"
    }

    fn version(&self) -> &str {
        "0.1.0"
    }

    fn dependencies(&self) -> Vec<&'static str> {
        vec!["vault"] // Requires vault to be enabled
    }

    fn conflicts(&self) -> Vec<&'static str> {
        vec![] // No conflicts
    }

    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        // Initialize tag service
        self.service = Some(TagService::new(
            context.database.clone(),
            self.config.clone(),
        )?);

        // Subscribe to vault events
        let service = self.service.as_ref().unwrap().clone();
        context.events.subscribe("vault:file_created", move |event| {
            let service = service.clone();
            Box::pin(async move {
                // Extract tags from new file
                service.extract_tags_from_file(event).await;
            })
        }).await;

        Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
        if let Some(service) = self.service.take() {
            service.close().await?;
        }
        Ok(())
    }

    fn is_enabled(&self) -> bool {
        self.enabled
    }

    async fn enable(&mut self) -> Result<()> {
        self.enabled = true;
        Ok(())
    }

    async fn disable(&mut self) -> Result<()> {
        self.enabled = false;
        Ok(())
    }

    fn config_schema(&self) -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "enabled": { "type": "boolean", "default": true },
                "hierarchical": { "type": "boolean", "default": true },
                "auto_complete": { "type": "boolean", "default": true },
                "max_tag_length": { "type": "integer", "default": 50 },
                "case_sensitive": { "type": "boolean", "default": false }
            }
        })
    }

    fn register_commands(&self) -> Vec<Box<dyn Command>> {
        vec![
            Box::new(GetTagsCommand),
            Box::new(AddTagCommand),
            Box::new(RemoveTagCommand),
            Box::new(RenameTagCommand),
        ]
    }

    fn register_event_handlers(&self) -> Vec<Box<dyn EventHandler>> {
        vec![
            Box::new(TagCreatedHandler),
            Box::new(TagRemovedHandler),
        ]
    }

    fn register_ui_components(&self) -> Vec<UiComponent> {
        vec![
            UiComponent {
                id: "tag-panel",
                path: "tags/TagPanel.svelte",
                route: Some("/tags"),
            },
            UiComponent {
                id: "tag-editor",
                path: "tags/TagEditor.svelte",
                route: None,
            },
        ]
    }

    async fn health_check(&self) -> HealthStatus {
        if let Some(service) = &self.service {
            service.health_check().await
        } else {
            HealthStatus::Unhealthy("Service not initialized".to_string())
        }
    }
}
```

### Step 4: Implement Service Layer

```rust
// src/features/tags/services/tag_service.rs

use std::sync::Arc;
use tokio::sync::RwLock;

pub struct TagService {
    db: Arc<Database>,
    config: TagsConfig,
    cache: Arc<RwLock<TagCache>>,
}

impl TagService {
    pub fn new(db: Arc<Database>, config: TagsConfig) -> Result<Self> {
        Ok(Self {
            db,
            config,
            cache: Arc::new(RwLock::new(TagCache::new())),
        })
    }

    pub async fn get_all_tags(&self) -> Result<Vec<Tag>> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(tags) = cache.get_all() {
                return Ok(tags);
            }
        }

        // Query database
        let tags = self.db.query_tags().await?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.set_all(tags.clone());
        }

        Ok(tags)
    }

    pub async fn add_tag(&self, file_id: &str, tag: &str) -> Result<()> {
        // Validate tag
        self.validate_tag(tag)?;

        // Add to database
        self.db.add_tag(file_id, tag).await?;

        // Invalidate cache
        self.cache.write().await.invalidate();

        // Emit event
        // (handled by event system)

        Ok(())
    }

    fn validate_tag(&self, tag: &str) -> Result<()> {
        if tag.is_empty() {
            return Err(anyhow::anyhow!("Tag cannot be empty"));
        }

        if tag.len() > self.config.max_tag_length {
            return Err(anyhow::anyhow!(
                "Tag exceeds maximum length of {}",
                self.config.max_tag_length
            ));
        }

        Ok(())
    }

    pub async fn extract_tags_from_file(&self, event: Event) -> Result<()> {
        // Extract file_id from event
        let file_id = event.data.get("file_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing file_id"))?;

        // Read file content
        let content = self.db.get_file_content(file_id).await?;

        // Extract tags (e.g., #tag format)
        let tags = self.extract_tags_from_content(&content);

        // Add tags to database
        for tag in tags {
            self.add_tag(file_id, &tag).await?;
        }

        Ok(())
    }

    fn extract_tags_from_content(&self, content: &str) -> Vec<String> {
        // Simple regex-based extraction
        // In production, use proper parser
        let re = regex::Regex::new(r"#(\w+)").unwrap();
        re.captures_iter(content)
            .map(|cap| cap[1].to_string())
            .collect()
    }

    pub async fn close(&self) -> Result<()> {
        // Cleanup resources
        Ok(())
    }

    pub async fn health_check(&self) -> HealthStatus {
        // Check database connection
        if self.db.is_connected().await {
            HealthStatus::Healthy
        } else {
            HealthStatus::Unhealthy("Database not connected".to_string())
        }
    }
}
```

### Step 5: Implement Tauri Commands

```rust
// src/features/tags/commands/get_tags.rs

use tauri::command;

#[command]
pub async fn get_all_tags(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Tag>, String> {
    let feature = state.features.get("tags")
        .ok_or_else(|| "Tags feature not found".to_string())?;

    if !feature.is_enabled() {
        return Err("Tags feature is disabled".to_string());
    }

    let tags_feature = feature.as_any()
        .downcast_ref::<TagsFeature>()
        .ok_or_else(|| "Invalid feature type".to_string())?;

    let service = tags_feature.service()
        .ok_or_else(|| "Tags service not initialized".to_string())?;

    service.get_all_tags()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn add_tag(
    file_id: String,
    tag: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let feature = state.features.get("tags")
        .ok_or_else(|| "Tags feature not found".to_string())?;

    if !feature.is_enabled() {
        return Err("Tags feature is disabled".to_string());
    }

    let tags_feature = feature.as_any()
        .downcast_ref::<TagsFeature>()
        .ok_or_else(|| "Invalid feature type".to_string())?;

    let service = tags_feature.service()
        .ok_or_else(|| "Tags service not initialized".to_string())?;

    service.add_tag(&file_id, &tag)
        .await
        .map_err(|e| e.to_string())
}
```

### Step 6: Create UI Components

```svelte
<!-- src/features/tags/ui/TagPanel.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/tauri';
  import { onMount } from 'svelte';

  interface Tag {
    name: string;
    count: number;
    children?: Tag[];
  }

  let tags: Tag[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadTags();
  });

  async function loadTags() {
    try {
      loading = true;
      tags = await invoke('get_all_tags');
    } catch (err) {
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  async function addTag(fileId: string, tagName: string) {
    try {
      await invoke('add_tag', { fileId, tag: tagName });
      await loadTags();
    } catch (err) {
      error = (err as Error).message;
    }
  }
</script>

<div class="tag-panel">
  <h2>Tags</h2>

  {#if loading}
    <div class="loading">Loading tags...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <ul class="tag-list">
      {#each tags as tag}
        <li class="tag-item">
          <span class="tag-name">#{tag.name}</span>
          <span class="tag-count">{tag.count}</span>

          {#if tag.children && tag.children.length > 0}
            <ul class="tag-children">
              {#each tag.children as child}
                <li>
                  <span class="tag-name">#{child.name}</span>
                  <span class="tag-count">{child.count}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tag-panel {
    padding: 1rem;
  }

  .tag-list {
    list-style: none;
    padding: 0;
  }

  .tag-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .tag-name {
    font-weight: 500;
  }

  .tag-count {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .tag-children {
    margin-left: 1.5rem;
    margin-top: 0.5rem;
  }
</style>
```

### Step 7: Register Feature

```rust
// src/main.rs

use bismuth::features::tags::TagsFeature;

#[tokio::main]
async fn main() {
    let registry = FeatureRegistry::new();
    let context = create_app_context().await;

    // Register core features
    registry.register(Box::new(VaultFeature::default())).await.unwrap();
    registry.register(Box::new(EditorFeature::default())).await.unwrap();

    // Register optional features
    registry.register(Box::new(TagsFeature::default())).await.unwrap();
    registry.register(Box::new(WikilinksFeature::default())).await.unwrap();

    // Initialize all features
    registry.initialize_all(&context).await.unwrap();

    // Run app
    tauri::Builder::default()
        .manage(AppState { registry, context })
        .invoke_handler(tauri::generate_handler![
            // Tags commands
            get_all_tags,
            add_tag,
            remove_tag,
            rename_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 8: Add Configuration

```toml
# bismuth.toml

[features.tags]
enabled = true
hierarchical = true
auto_complete = true
max_tag_length = 50
case_sensitive = false
```

### Step 9: Write Tests

```rust
// src/features/tags/tests/tag_service_test.rs

#[tokio::test]
async fn test_add_tag() {
    let service = create_test_service().await;

    let result = service.add_tag("file1", "rust").await;
    assert!(result.is_ok());

    let tags = service.get_all_tags().await.unwrap();
    assert_eq!(tags.len(), 1);
    assert_eq!(tags[0].name, "rust");
}

#[tokio::test]
async fn test_hierarchical_tags() {
    let service = create_test_service().await;

    service.add_tag("file1", "programming/rust").await.unwrap();
    service.add_tag("file2", "programming/python").await.unwrap();

    let tags = service.get_all_tags().await.unwrap();

    // Should have one parent tag
    let programming = tags.iter()
        .find(|t| t.name == "programming")
        .unwrap();

    // With two children
    assert_eq!(programming.children.len(), 2);
}

#[tokio::test]
async fn test_feature_can_be_disabled() {
    let registry = FeatureRegistry::new();
    let context = create_test_context().await;

    registry.register(Box::new(TagsFeature::default())).await.unwrap();
    registry.initialize_all(&context).await.unwrap();

    // Disable tags
    registry.disable_feature("tags").await.unwrap();

    // Commands should fail gracefully
    let result = invoke_command("add_tag", json!({
        "file_id": "file1",
        "tag": "rust"
    })).await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Tags feature is disabled");
}
```

### Step 10: Document Feature

````markdown
# Tags Feature (US3)

## Overview

Hierarchical tag system for organizing notes.

## Dependencies

- **Required**: vault
- **Optional**: search (for tag-based search)

## Configuration

```toml
[features.tags]
enabled = true
hierarchical = true
auto_complete = true
max_tag_length = 50
case_sensitive = false
```
````

## Commands

- `get_all_tags()` - Get all tags with counts
- `add_tag(file_id, tag)` - Add tag to file
- `remove_tag(file_id, tag)` - Remove tag from file
- `rename_tag(old_name, new_name)` - Rename tag

## Events

- `tag:created` - Emitted when tag is created
- `tag:removed` - Emitted when tag is removed
- `tag:renamed` - Emitted when tag is renamed

## UI Components

- `TagPanel` - Main tag browser
- `TagEditor` - Inline tag editor

## Usage

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Get all tags
const tags = await invoke('get_all_tags');

// Add tag
await invoke('add_tag', {
  fileId: 'file1',
  tag: 'programming/rust',
});
```

````

## Feature Checklist

When adding a new feature, ensure:

### Design
- [ ] Feature specification written
- [ ] Dependencies identified
- [ ] Conflicts identified
- [ ] Configuration schema defined
- [ ] API designed (commands, events)

### Implementation
- [ ] Feature trait implemented
- [ ] Service layer implemented
- [ ] Commands implemented
- [ ] Event handlers implemented
- [ ] UI components created
- [ ] Feature registered

### Testing
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Isolation tests written
- [ ] Removal tests written
- [ ] All tests passing

### Documentation
- [ ] Feature documentation written
- [ ] API documentation complete
- [ ] Usage examples provided
- [ ] Migration guide (if needed)

### Configuration
- [ ] Default configuration defined
- [ ] Configuration schema documented
- [ ] Feature flag added

### Release
- [ ] Version bumped
- [ ] CHANGELOG.md updated
- [ ] Feature announced

## Common Patterns

### Pattern 1: Feature with Database

```rust
pub struct MyFeature {
    db: Arc<Database>,
    config: MyConfig,
}

impl Feature for MyFeature {
    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        // Initialize database tables
        self.db.execute("CREATE TABLE IF NOT EXISTS my_table ...").await?;
        Ok(())
    }
}
````

### Pattern 2: Feature with Background Task

```rust
impl Feature for MyFeature {
    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        // Spawn background task
        let db = self.db.clone();
        tokio::spawn(async move {
            loop {
                // Do background work
                tokio::time::sleep(Duration::from_secs(60)).await;
            }
        });
        Ok(())
    }
}
```

### Pattern 3: Feature with Event Subscription

```rust
impl Feature for MyFeature {
    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        let service = self.service.clone();

        context.events.subscribe("vault:file_created", move |event| {
            let service = service.clone();
            Box::pin(async move {
                service.handle_file_created(event).await;
            })
        }).await;

        Ok(())
    }
}
```

### Pattern 4: Feature with Optional Dependency

```rust
impl Feature for MyFeature {
    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        // Check if optional dependency is available
        if let Some(search_feature) = context.features.get("search") {
            // Use search feature
            self.enable_search_integration(search_feature);
        }
        Ok(())
    }
}
```

## Troubleshooting

### Feature Not Loading

**Problem**: Feature doesn't appear in app

**Check**:

1. Feature registered in `main.rs`?
2. Feature enabled in config?
3. Dependencies satisfied?
4. No conflicts?

### Feature Initialization Fails

**Problem**: Feature fails to initialize

**Check**:

1. Database tables created?
2. Required files exist?
3. Permissions correct?
4. Dependencies initialized first?

### Feature Commands Not Working

**Problem**: Tauri commands return errors

**Check**:

1. Commands registered in `invoke_handler`?
2. Feature enabled?
3. Service initialized?
4. Correct parameter types?

## Best Practices

1. **Keep features small** - Single responsibility
2. **Explicit dependencies** - Declare all dependencies
3. **Event-driven** - Use events for communication
4. **Configuration-driven** - Make behavior configurable
5. **Test in isolation** - Each feature should work alone
6. **Document thoroughly** - Clear API documentation
7. **Version carefully** - Follow semantic versioning
8. **Migrate gracefully** - Provide migration paths

---

**Last Updated**: 2026-05-25  
**Maintained By**: @yeabsiraretta
