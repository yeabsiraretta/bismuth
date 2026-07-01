//! Core service layer for Bismuth PKM Editor
//!
//! Each service encapsulates a specific domain concern:
//!
//! - [`VaultService`] — File I/O, vault lifecycle, note CRUD
//! - [`WikilinkService`] — Link resolution and rename propagation
//! - [`IndexService`] — Tantivy full-text search indexing
//! - [`EntityService`] — Portent type registry and relationship resolution
//! - [`CanvasService`] — Infinite canvas document persistence
//! - [`ThemeService`] — CSS theme loading and style-setting extraction
//! - [`WatcherService`] — Filesystem event monitoring with debounce
//! - [`FrontmatterService`] — YAML frontmatter parsing and serialization
//! - [`PluginService`] — Plugin manifest discovery and lifecycle management
//! - [`EmbeddingService`] — Local semantic embedding and similarity search

pub mod backup_service;
pub mod canvas_service;
pub mod nas_service;
pub mod changelog_service;
pub mod gym_service;
pub mod llm_service;
pub mod study_service;
pub mod ocr_service;
pub mod spreadsheet_service;
pub mod version_service;
pub mod embedding_service;
pub mod frontmatter;
pub mod git_service;
pub mod knowledge;
pub mod lifecycle_service;
pub mod linting_service;
pub mod longform_service;
pub mod plugin_service;
pub mod publishing_service;
pub mod search;
pub mod task_service;
pub mod template_service;
pub mod theme_service;
pub mod vault_service;
pub mod watcher_service;

// Module aliases for backward-compatible import paths
pub use knowledge::concept_service;
pub use knowledge::entity_service;
pub use knowledge::entity_types;
pub use knowledge::wikilink_service;
pub use search::index_service;
pub use search::search_query;
pub use search::search_server;
pub use frontmatter as frontmatter_service;
pub use frontmatter::migration as frontmatter_migration;

// Top-level type re-exports
pub use canvas_service::CanvasService;
pub use embedding_service::EmbeddingService;
pub use knowledge::EntityService;
pub use frontmatter::FrontmatterService;
pub use search::IndexService;
pub use plugin_service::PluginService;
pub use theme_service::ThemeService;
pub use vault_service::VaultService;
pub use watcher_service::WatcherService;
pub use knowledge::WikilinkService;
