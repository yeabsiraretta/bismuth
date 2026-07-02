# Modular Architecture Strategy for Bismuth

## Overview

Bismuth is designed with **extreme modularity** as a core principle. Every feature is a self-contained module that can be enabled, disabled, added, or removed with **zero to minimal impact** on the rest of the application.

## Core Principles

### 1. Feature Isolation

- Each feature is a separate module with clear boundaries
- No direct dependencies between features
- Communication through well-defined interfaces only

### 2. Gated Impact

- Feature changes affect only that feature
- Breaking changes are contained within module boundaries
- System remains stable when features are disabled

### 3. Plugin Architecture

- Features are essentially plugins
- Can be loaded/unloaded at runtime
- Configuration-driven feature flags

### 4. Interface-Driven Design

- Features depend on interfaces, not implementations
- Core provides stable contracts
- Features implement or consume contracts

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Feature Modules                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Vault    │ │ Wikilinks│ │  Graph   │ │  Search  │  │
│  │ US1      │ │ US2      │ │  US8     │ │  US7     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │         │
├───────┴────────────┴────────────┴────────────┴─────────┤
│              Feature Registry & Manager                 │
│         (Dependency Resolution, Lifecycle)              │
├─────────────────────────────────────────────────────────┤
│                  Core Interfaces                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ IVault   │ │ IEditor  │ │ IIndex   │ │ IEvents  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Core Services                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Database │ │ FileSystem│ │ Events   │ │ Config   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Platform Layer                         │
│              (Tauri, OS Integration)                    │
└─────────────────────────────────────────────────────────┘
```

## Feature Module Structure

### Standard Module Layout

```
src/features/
├── vault/                    # US1: Vault Management
│   ├── mod.rs               # Module entry point
│   ├── feature.rs           # Feature definition
│   ├── config.rs            # Feature configuration
│   ├── services/            # Business logic
│   ├── commands/            # Tauri commands
│   ├── events/              # Event handlers
│   ├── ui/                  # Svelte components
│   │   ├── VaultManager.svelte
│   │   └── VaultSettings.svelte
│   └── tests/               # Feature tests
│
├── wikilinks/               # US2: Wikilinks
│   ├── mod.rs
│   ├── feature.rs
│   ├── config.rs
│   ├── services/
│   │   ├── parser.rs
│   │   └── resolver.rs
│   ├── commands/
│   ├── events/
│   ├── ui/
│   │   ├── WikilinkEditor.svelte
│   │   └── BacklinksPanel.svelte
│   └── tests/
│
├── graph/                   # US8: Graph View
│   ├── mod.rs
│   ├── feature.rs
│   ├── config.rs
│   ├── services/
│   │   ├── layout.rs
│   │   └── renderer.rs
│   ├── commands/
│   ├── events/
│   ├── ui/
│   │   └── GraphView.svelte
│   └── tests/
│
└── search/                  # US7: Search
    ├── mod.rs
    ├── feature.rs
    ├── config.rs
    ├── services/
    │   ├── indexer.rs
    │   └── query.rs
    ├── commands/
    ├── events/
    ├── ui/
    │   └── SearchPanel.svelte
    └── tests/
```

## Feature Definition

### Feature Trait (Rust)

```rust
/// Core trait that all features must implement
pub trait Feature: Send + Sync {
    /// Unique feature identifier
    fn id(&self) -> &'static str;

    /// Human-readable feature name
    fn name(&self) -> &str;

    /// Feature version (follows semver)
    fn version(&self) -> &str;

    /// Features this feature depends on
    fn dependencies(&self) -> Vec<&'static str> {
        vec![]
    }

    /// Features this feature conflicts with
    fn conflicts(&self) -> Vec<&'static str> {
        vec![]
    }

    /// Initialize the feature
    async fn initialize(&mut self, context: &FeatureContext) -> Result<()>;

    /// Shutdown the feature
    async fn shutdown(&mut self) -> Result<()>;

    /// Check if feature is enabled
    fn is_enabled(&self) -> bool;

    /// Enable the feature
    async fn enable(&mut self) -> Result<()>;

    /// Disable the feature
    async fn disable(&mut self) -> Result<()>;

    /// Get feature configuration schema
    fn config_schema(&self) -> serde_json::Value;

    /// Register Tauri commands
    fn register_commands(&self) -> Vec<Box<dyn Command>>;

    /// Register event handlers
    fn register_event_handlers(&self) -> Vec<Box<dyn EventHandler>>;

    /// Register UI components
    fn register_ui_components(&self) -> Vec<UiComponent>;

    /// Health check
    async fn health_check(&self) -> HealthStatus;
}
```

### Example Feature Implementation

```rust
// src/features/vault/feature.rs

use crate::core::{Feature, FeatureContext, Result};

pub struct VaultFeature {
    enabled: bool,
    config: VaultConfig,
    service: Option<VaultService>,
}

impl Feature for VaultFeature {
    fn id(&self) -> &'static str {
        "vault"
    }

    fn name(&self) -> &str {
        "Vault Management"
    }

    fn version(&self) -> &str {
        "0.1.0"
    }

    fn dependencies(&self) -> Vec<&'static str> {
        vec![] // No dependencies - core feature
    }

    async fn initialize(&mut self, context: &FeatureContext) -> Result<()> {
        // Initialize vault service
        self.service = Some(VaultService::new(
            context.database.clone(),
            context.filesystem.clone(),
            self.config.clone(),
        )?);

        // Register event listeners
        context.events.subscribe("vault:created", self.on_vault_created);

        Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
        // Clean shutdown
        if let Some(service) = self.service.take() {
            service.close_all_vaults().await?;
        }
        Ok(())
    }

    fn is_enabled(&self) -> bool {
        self.enabled
    }

    async fn enable(&mut self) -> Result<()> {
        self.enabled = true;
        // Additional enable logic
        Ok(())
    }

    async fn disable(&mut self) -> Result<()> {
        self.enabled = false;
        // Additional disable logic
        Ok(())
    }

    fn register_commands(&self) -> Vec<Box<dyn Command>> {
        vec![
            Box::new(CreateVaultCommand),
            Box::new(OpenVaultCommand),
            Box::new(CloseVaultCommand),
        ]
    }

    fn register_event_handlers(&self) -> Vec<Box<dyn EventHandler>> {
        vec![
            Box::new(VaultCreatedHandler),
            Box::new(VaultClosedHandler),
        ]
    }

    fn register_ui_components(&self) -> Vec<UiComponent> {
        vec![
            UiComponent {
                id: "vault-manager",
                path: "vault/VaultManager.svelte",
                route: Some("/vaults"),
            },
            UiComponent {
                id: "vault-settings",
                path: "vault/VaultSettings.svelte",
                route: Some("/settings/vault"),
            },
        ]
    }
}
```

## Feature Registry

### Registry Implementation

```rust
// src/core/feature_registry.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct FeatureRegistry {
    features: Arc<RwLock<HashMap<String, Box<dyn Feature>>>>,
    dependency_graph: Arc<RwLock<DependencyGraph>>,
}

impl FeatureRegistry {
    pub fn new() -> Self {
        Self {
            features: Arc::new(RwLock::new(HashMap::new())),
            dependency_graph: Arc::new(RwLock::new(DependencyGraph::new())),
        }
    }

    /// Register a feature
    pub async fn register(&self, feature: Box<dyn Feature>) -> Result<()> {
        let id = feature.id().to_string();

        // Check for conflicts
        self.check_conflicts(&feature).await?;

        // Add to dependency graph
        self.dependency_graph
            .write()
            .await
            .add_node(id.clone(), feature.dependencies());

        // Store feature
        self.features.write().await.insert(id, feature);

        Ok(())
    }

    /// Initialize all features in dependency order
    pub async fn initialize_all(&self, context: &FeatureContext) -> Result<()> {
        let order = self.dependency_graph.read().await.topological_sort()?;

        for feature_id in order {
            if let Some(feature) = self.features.write().await.get_mut(&feature_id) {
                if feature.is_enabled() {
                    feature.initialize(context).await?;
                }
            }
        }

        Ok(())
    }

    /// Shutdown all features in reverse dependency order
    pub async fn shutdown_all(&self) -> Result<()> {
        let order = self.dependency_graph.read().await.reverse_topological_sort()?;

        for feature_id in order {
            if let Some(feature) = self.features.write().await.get_mut(&feature_id) {
                feature.shutdown().await?;
            }
        }

        Ok(())
    }

    /// Enable a feature and its dependencies
    pub async fn enable_feature(&self, feature_id: &str) -> Result<()> {
        // Get dependency chain
        let deps = self.dependency_graph
            .read()
            .await
            .get_dependencies(feature_id)?;

        // Enable dependencies first
        for dep_id in deps {
            if let Some(dep) = self.features.write().await.get_mut(&dep_id) {
                if !dep.is_enabled() {
                    dep.enable().await?;
                }
            }
        }

        // Enable the feature
        if let Some(feature) = self.features.write().await.get_mut(feature_id) {
            feature.enable().await?;
        }

        Ok(())
    }

    /// Disable a feature and dependents
    pub async fn disable_feature(&self, feature_id: &str) -> Result<()> {
        // Get dependents (features that depend on this one)
        let dependents = self.dependency_graph
            .read()
            .await
            .get_dependents(feature_id)?;

        // Disable dependents first
        for dependent_id in dependents {
            if let Some(dependent) = self.features.write().await.get_mut(&dependent_id) {
                if dependent.is_enabled() {
                    dependent.disable().await?;
                }
            }
        }

        // Disable the feature
        if let Some(feature) = self.features.write().await.get_mut(feature_id) {
            feature.disable().await?;
        }

        Ok(())
    }

    /// Check for conflicts
    async fn check_conflicts(&self, feature: &Box<dyn Feature>) -> Result<()> {
        let features = self.features.read().await;

        for conflict_id in feature.conflicts() {
            if features.contains_key(conflict_id) {
                return Err(anyhow::anyhow!(
                    "Feature '{}' conflicts with '{}'",
                    feature.id(),
                    conflict_id
                ));
            }
        }

        Ok(())
    }
}
```

## Dependency Management

### Dependency Graph

```rust
// src/core/dependency_graph.rs

use std::collections::{HashMap, HashSet, VecDeque};

pub struct DependencyGraph {
    nodes: HashMap<String, Node>,
}

struct Node {
    id: String,
    dependencies: Vec<String>,
    dependents: Vec<String>,
}

impl DependencyGraph {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, id: String, dependencies: Vec<&'static str>) {
        let deps: Vec<String> = dependencies.iter().map(|s| s.to_string()).collect();

        // Add node
        self.nodes.insert(id.clone(), Node {
            id: id.clone(),
            dependencies: deps.clone(),
            dependents: vec![],
        });

        // Update dependents
        for dep_id in deps {
            if let Some(dep_node) = self.nodes.get_mut(&dep_id) {
                dep_node.dependents.push(id.clone());
            }
        }
    }

    /// Topological sort for initialization order
    pub fn topological_sort(&self) -> Result<Vec<String>> {
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut queue: VecDeque<String> = VecDeque::new();
        let mut result: Vec<String> = Vec::new();

        // Calculate in-degrees
        for (id, node) in &self.nodes {
            in_degree.insert(id.clone(), node.dependencies.len());
            if node.dependencies.is_empty() {
                queue.push_back(id.clone());
            }
        }

        // Process queue
        while let Some(id) = queue.pop_front() {
            result.push(id.clone());

            if let Some(node) = self.nodes.get(&id) {
                for dependent_id in &node.dependents {
                    if let Some(degree) = in_degree.get_mut(dependent_id) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push_back(dependent_id.clone());
                        }
                    }
                }
            }
        }

        // Check for cycles
        if result.len() != self.nodes.len() {
            return Err(anyhow::anyhow!("Circular dependency detected"));
        }

        Ok(result)
    }

    /// Reverse topological sort for shutdown order
    pub fn reverse_topological_sort(&self) -> Result<Vec<String>> {
        let mut sorted = self.topological_sort()?;
        sorted.reverse();
        Ok(sorted)
    }

    /// Get all dependencies of a feature (transitive)
    pub fn get_dependencies(&self, feature_id: &str) -> Result<Vec<String>> {
        let mut visited = HashSet::new();
        let mut result = Vec::new();
        self.collect_dependencies(feature_id, &mut visited, &mut result)?;
        Ok(result)
    }

    fn collect_dependencies(
        &self,
        feature_id: &str,
        visited: &mut HashSet<String>,
        result: &mut Vec<String>,
    ) -> Result<()> {
        if visited.contains(feature_id) {
            return Ok(());
        }

        visited.insert(feature_id.to_string());

        if let Some(node) = self.nodes.get(feature_id) {
            for dep_id in &node.dependencies {
                self.collect_dependencies(dep_id, visited, result)?;
                result.push(dep_id.clone());
            }
        }

        Ok(())
    }

    /// Get all dependents of a feature (transitive)
    pub fn get_dependents(&self, feature_id: &str) -> Result<Vec<String>> {
        let mut visited = HashSet::new();
        let mut result = Vec::new();
        self.collect_dependents(feature_id, &mut visited, &mut result)?;
        Ok(result)
    }

    fn collect_dependents(
        &self,
        feature_id: &str,
        visited: &mut HashSet<String>,
        result: &mut Vec<String>,
    ) -> Result<()> {
        if visited.contains(feature_id) {
            return Ok(());
        }

        visited.insert(feature_id.to_string());

        if let Some(node) = self.nodes.get(feature_id) {
            for dependent_id in &node.dependents {
                result.push(dependent_id.clone());
                self.collect_dependents(dependent_id, visited, result)?;
            }
        }

        Ok(())
    }
}
```

## Feature Configuration

### Configuration Schema

```rust
// src/features/vault/config.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    /// Enable vault feature
    pub enabled: bool,

    /// Maximum number of open vaults
    pub max_open_vaults: usize,

    /// Auto-save interval (milliseconds)
    pub auto_save_interval: u64,

    /// Enable crash recovery
    pub crash_recovery: bool,

    /// Vault file extensions
    pub file_extensions: Vec<String>,
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            max_open_vaults: 5,
            auto_save_interval: 500,
            crash_recovery: true,
            file_extensions: vec!["md".to_string(), "markdown".to_string()],
        }
    }
}

impl VaultConfig {
    /// Get JSON schema for configuration
    pub fn schema() -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "enabled": {
                    "type": "boolean",
                    "default": true,
                    "description": "Enable vault feature"
                },
                "max_open_vaults": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 10,
                    "default": 5,
                    "description": "Maximum number of open vaults"
                },
                "auto_save_interval": {
                    "type": "integer",
                    "minimum": 100,
                    "default": 500,
                    "description": "Auto-save interval in milliseconds"
                },
                "crash_recovery": {
                    "type": "boolean",
                    "default": true,
                    "description": "Enable crash recovery"
                },
                "file_extensions": {
                    "type": "array",
                    "items": { "type": "string" },
                    "default": ["md", "markdown"],
                    "description": "Supported file extensions"
                }
            }
        })
    }
}
```

### Global Configuration

```toml
# bismuth.toml

[features]
# Core features (always enabled)
vault = { enabled = true }
editor = { enabled = true }
navigator = { enabled = true }

# Optional features
wikilinks = { enabled = true }
graph = { enabled = true }
search = { enabled = true }
tags = { enabled = false }  # Disabled by default
lifecycle = { enabled = false }

[features.vault]
max_open_vaults = 5
auto_save_interval = 500
crash_recovery = true

[features.wikilinks]
auto_complete = true
show_preview = true

[features.graph]
layout_algorithm = "force-directed"
max_nodes = 10000

[features.search]
index_on_startup = true
fuzzy_search = true
```

## Event System

### Event-Driven Communication

```rust
// src/core/events.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub type EventHandler = Arc<dyn Fn(Event) -> BoxFuture<'static, ()> + Send + Sync>;

pub struct EventBus {
    handlers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Subscribe to an event
    pub async fn subscribe<F>(&self, event_type: &str, handler: F)
    where
        F: Fn(Event) -> BoxFuture<'static, ()> + Send + Sync + 'static,
    {
        let mut handlers = self.handlers.write().await;
        handlers
            .entry(event_type.to_string())
            .or_insert_with(Vec::new)
            .push(Arc::new(handler));
    }

    /// Publish an event
    pub async fn publish(&self, event: Event) {
        let handlers = self.handlers.read().await;

        if let Some(event_handlers) = handlers.get(&event.event_type) {
            for handler in event_handlers {
                let event_clone = event.clone();
                let handler_clone = Arc::clone(handler);

                tokio::spawn(async move {
                    handler_clone(event_clone).await;
                });
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct Event {
    pub event_type: String,
    pub source: String,
    pub data: serde_json::Value,
    pub timestamp: i64,
}
```

### Feature Communication Example

```rust
// Vault feature publishes event
context.events.publish(Event {
    event_type: "vault:created".to_string(),
    source: "vault".to_string(),
    data: serde_json::json!({
        "vault_id": vault.id,
        "path": vault.path,
    }),
    timestamp: chrono::Utc::now().timestamp(),
}).await;

// Search feature subscribes to vault events
context.events.subscribe("vault:created", |event| {
    Box::pin(async move {
        // Index new vault
        if let Some(vault_id) = event.data.get("vault_id") {
            index_vault(vault_id).await;
        }
    })
}).await;
```

## UI Component System

### Component Registry (Svelte)

```typescript
// src/lib/core/ComponentRegistry.ts

interface ComponentDefinition {
  id: string;
  path: string;
  route?: string;
  lazy?: boolean;
}

class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  register(component: ComponentDefinition): void {
    this.components.set(component.id, component);
  }

  unregister(id: string): void {
    this.components.delete(id);
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByRoute(route: string): ComponentDefinition | undefined {
    return Array.from(this.components.values()).find((c) => c.route === route);
  }
}

export const componentRegistry = new ComponentRegistry();
```

### Dynamic Component Loading

```svelte
<!-- src/lib/components/DynamicComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { componentRegistry } from '$lib/core/ComponentRegistry';

  export let componentId: string;

  let Component: any = null;
  let loading = true;
  let error: Error | null = null;

  onMount(async () => {
    try {
      const definition = componentRegistry.get(componentId);

      if (!definition) {
        throw new Error(`Component '${componentId}' not found`);
      }

      // Dynamic import
      const module = await import(`../features/${definition.path}`);
      Component = module.default;
      loading = false;
    } catch (err) {
      error = err as Error;
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="loading">Loading component...</div>
{:else if error}
  <div class="error">Error loading component: {error.message}</div>
{:else if Component}
  <svelte:component this={Component} {...$$props} />
{/if}
```

## Feature Flags

### Runtime Feature Flags

```rust
// src/core/feature_flags.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct FeatureFlags {
    flags: Arc<RwLock<HashMap<String, bool>>>,
}

impl FeatureFlags {
    pub fn new() -> Self {
        Self {
            flags: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Check if a feature is enabled
    pub async fn is_enabled(&self, feature_id: &str) -> bool {
        self.flags
            .read()
            .await
            .get(feature_id)
            .copied()
            .unwrap_or(false)
    }

    /// Enable a feature
    pub async fn enable(&self, feature_id: &str) {
        self.flags.write().await.insert(feature_id.to_string(), true);
    }

    /// Disable a feature
    pub async fn disable(&self, feature_id: &str) {
        self.flags.write().await.insert(feature_id.to_string(), false);
    }

    /// Toggle a feature
    pub async fn toggle(&self, feature_id: &str) {
        let mut flags = self.flags.write().await;
        let current = flags.get(feature_id).copied().unwrap_or(false);
        flags.insert(feature_id.to_string(), !current);
    }

    /// Load flags from configuration
    pub async fn load_from_config(&self, config: &Config) {
        let mut flags = self.flags.write().await;
        for (feature_id, feature_config) in &config.features {
            flags.insert(feature_id.clone(), feature_config.enabled);
        }
    }
}
```

### Usage in Code

```rust
// Check feature flag before executing feature code
if feature_flags.is_enabled("wikilinks").await {
    // Execute wikilink functionality
    resolve_wikilink(link).await?;
} else {
    // Feature disabled, skip or provide fallback
    return Ok(None);
}
```

## Testing Strategy

### Feature Isolation Testing

```rust
// tests/features/vault_test.rs

#[tokio::test]
async fn test_vault_feature_isolation() {
    let registry = FeatureRegistry::new();
    let context = create_test_context().await;

    // Register only vault feature
    let vault_feature = Box::new(VaultFeature::default());
    registry.register(vault_feature).await.unwrap();

    // Initialize
    registry.initialize_all(&context).await.unwrap();

    // Test vault functionality in isolation
    let vault = create_vault("test").await.unwrap();
    assert!(vault.is_open());

    // Shutdown
    registry.shutdown_all().await.unwrap();
}

#[tokio::test]
async fn test_feature_can_be_disabled() {
    let registry = FeatureRegistry::new();
    let context = create_test_context().await;

    // Register features
    registry.register(Box::new(VaultFeature::default())).await.unwrap();
    registry.register(Box::new(WikilinksFeature::default())).await.unwrap();

    // Initialize
    registry.initialize_all(&context).await.unwrap();

    // Disable wikilinks
    registry.disable_feature("wikilinks").await.unwrap();

    // Vault should still work
    let vault = create_vault("test").await.unwrap();
    assert!(vault.is_open());

    // Wikilinks should not work
    let result = resolve_wikilink("[[test]]").await;
    assert!(result.is_err());
}
```

## Migration Strategy

### Gradual Feature Migration

```rust
// src/core/migration.rs

pub struct FeatureMigration {
    from_version: String,
    to_version: String,
    feature_id: String,
}

impl FeatureMigration {
    pub async fn migrate(&self, context: &MigrationContext) -> Result<()> {
        match (self.from_version.as_str(), self.to_version.as_str()) {
            ("0.1.0", "0.2.0") => self.migrate_0_1_to_0_2(context).await,
            ("0.2.0", "0.3.0") => self.migrate_0_2_to_0_3(context).await,
            _ => Ok(()),
        }
    }

    async fn migrate_0_1_to_0_2(&self, context: &MigrationContext) -> Result<()> {
        // Feature-specific migration logic
        // Only affects this feature's data
        Ok(())
    }
}
```

## Documentation

### Feature Documentation Template

````markdown
# Feature: [Feature Name]

## Overview

Brief description of the feature.

## Dependencies

- Core features required
- Optional features that enhance this feature

## Configuration

```toml
[features.feature_name]
option1 = value1
option2 = value2
```
````

## API

### Commands

- `feature:command1` - Description
- `feature:command2` - Description

### Events

- `feature:event1` - Emitted when...
- `feature:event2` - Emitted when...

## UI Components

- `FeatureComponent1` - Description
- `FeatureComponent2` - Description

## Testing

How to test this feature in isolation.

## Migration

Breaking changes and migration guides.

````

## Best Practices

### 1. Single Responsibility
- Each feature does one thing well
- Clear, focused purpose
- No feature bloat

### 2. Explicit Dependencies
- Declare all dependencies upfront
- No hidden dependencies
- Use dependency injection

### 3. Event-Driven Communication
- Features communicate via events
- No direct feature-to-feature calls
- Loose coupling

### 4. Configuration-Driven
- All behavior configurable
- Sensible defaults
- Runtime reconfiguration

### 5. Graceful Degradation
- Feature disabled = app still works
- Provide fallbacks
- Clear error messages

### 6. Comprehensive Testing
- Unit tests for feature logic
- Integration tests for feature interactions
- Isolation tests (feature alone)
- Removal tests (app without feature)

### 7. Documentation
- Document all public APIs
- Provide usage examples
- Maintain migration guides

## Feature Development Workflow

### 1. Design Phase
```bash
# Create feature specification
docs/features/US7-search.md

# Define interfaces
src/core/interfaces/ISearch.rs

# Plan dependencies
- Requires: vault, filesystem
- Optional: wikilinks (for link search)
- Conflicts: none
````

### 2. Implementation Phase

```bash
# Create feature structure
src/features/search/
├── mod.rs
├── feature.rs
├── config.rs
├── services/
├── commands/
├── events/
└── ui/

# Implement Feature trait
impl Feature for SearchFeature { ... }

# Register with registry
registry.register(Box::new(SearchFeature::default()))
```

### 3. Testing Phase

```bash
# Unit tests
cargo test --package bismuth-search

# Integration tests
cargo test --test search_integration

# Isolation tests
cargo test --test search_isolation
```

### 4. Documentation Phase

```bash
# Feature documentation
docs/features/search.md

# API documentation
cargo doc --package bismuth-search

# User guide
docs/user-guide/search.md
```

### 5. Release Phase

```bash
# Feature flag in config
[features.search]
enabled = true  # Enable by default

# Version bump
# search feature: 0.1.0

# Changelog entry
## [0.3.0] - Search Feature
### Added
- Full-text search with Tantivy
- Fuzzy search support
- Search filters
```

## Summary

This modular architecture ensures:

✅ **Complete Feature Isolation** - Features are self-contained modules  
✅ **Gated Impact** - Changes affect only the feature being modified  
✅ **Plugin Architecture** - Features can be added/removed dynamically  
✅ **Zero Breaking Changes** - Core interfaces remain stable  
✅ **Easy Testing** - Features can be tested in isolation  
✅ **Flexible Configuration** - Runtime feature toggling  
✅ **Clear Dependencies** - Explicit dependency management  
✅ **Event-Driven** - Loose coupling between features  
✅ **Graceful Degradation** - App works with features disabled  
✅ **Production Ready** - Battle-tested patterns

**Result**: A maintainable, scalable codebase where features can be developed, tested, and deployed independently with minimal risk to the overall application.

---

**Last Updated**: 2026-05-25  
**Maintained By**: @yeabsiraretta
