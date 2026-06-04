//! Tauri IPC command handlers
//!
//! Each submodule corresponds to a functional domain and exposes `#[tauri::command]`
//! async functions that the Svelte frontend invokes via `@tauri-apps/api`.
//!
//! Commands receive managed state via [`tauri::State`] and return either
//! typed success values or string errors for IPC serialization.

pub mod backlinks_commands;
pub mod canvas_commands;
pub mod embedding_commands;
pub mod entity_commands;
pub mod graph_commands;
pub mod lifecycle_commands;
pub mod plugin_commands;
pub mod property_commands;
pub mod search_commands;
pub mod tag_commands;
pub mod theme_commands;
pub mod vault_commands;
pub mod wikilink_commands;

pub use backlinks_commands::*;
pub use canvas_commands::*;
pub use embedding_commands::*;
pub use entity_commands::*;
pub use graph_commands::*;
pub use lifecycle_commands::*;
pub use plugin_commands::*;
pub use property_commands::*;
pub use search_commands::*;
pub use tag_commands::*;
pub use theme_commands::*;
pub use vault_commands::*;
