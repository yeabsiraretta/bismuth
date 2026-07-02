//! Tauri IPC command handlers
//!
//! Each submodule corresponds to a functional domain and exposes `#[tauri::command]`
//! async functions that the Svelte frontend invokes via `@tauri-apps/api`.
//!
//! Commands receive managed state via [`tauri::State`] and return either
//! typed success values or string errors for IPC serialization.

pub mod backup;
pub mod content;
pub mod canvas;
pub use canvas as design;
pub mod embedding_commands;
pub mod git_commands;
pub mod gym;
pub mod knowledge;
pub mod linting_commands;
pub mod llm;
pub mod music;
pub mod nas;
pub mod ocr;
pub mod plugin_commands;
pub mod rss;
pub mod search_commands;
pub mod spreadsheet;
pub mod template_commands;
pub mod theme_commands;
pub mod vault_commands;
pub mod system;
pub mod versioning;
pub mod study;

pub use backup::*;
pub use content::*;
pub use canvas::*;
pub use embedding_commands::*;
pub use git_commands::*;
pub use gym::*;
pub use knowledge::*;
pub use linting_commands::*;
pub use llm::*;
pub use music::*;
pub use nas::*;
pub use ocr::*;
pub use plugin_commands::*;
pub use rss::*;
pub use search_commands::*;
pub use spreadsheet::*;
pub use template_commands::*;
pub use theme_commands::*;
pub use vault_commands::*;
pub use system::*;
pub use versioning::*;
pub use study::*;
