//! Tauri command handlers
//!
//! Provides the IPC command layer for frontend-backend communication.

pub mod backlinks_commands;
pub mod canvas_commands;
pub mod graph_commands;
pub mod property_commands;
pub mod search_commands;
pub mod tag_commands;
pub mod vault_commands;
pub mod wikilink_commands;

pub use backlinks_commands::*;
pub use graph_commands::*;
pub use property_commands::*;
pub use search_commands::*;
pub use tag_commands::*;
pub use vault_commands::*;
