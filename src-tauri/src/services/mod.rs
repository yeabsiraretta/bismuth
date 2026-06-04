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

pub mod canvas_service;
pub mod concept_service;
pub mod embedding_service;
pub mod entity_service;
pub mod entity_types;
pub mod frontmatter_service;
pub mod index_service;
pub mod lifecycle_service;
pub mod plugin_service;
pub mod search_query;
pub mod search_server;
pub mod theme_service;
pub mod vault_service;
pub mod watcher_service;
pub mod wikilink_service;

pub use canvas_service::CanvasService;
pub use embedding_service::EmbeddingService;
pub use entity_service::EntityService;
pub use frontmatter_service::FrontmatterService;
pub use index_service::IndexService;
pub use plugin_service::PluginService;
pub use theme_service::ThemeService;
pub use vault_service::VaultService;
pub use watcher_service::WatcherService;
pub use wikilink_service::WikilinkService;
