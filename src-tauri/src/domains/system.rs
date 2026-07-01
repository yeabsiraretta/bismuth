//! System domain — theme, plugins, embedding, git
//!
//! **Commands**: `commands/theme_commands.rs`, `commands/git_commands.rs`,
//!              `commands/embedding_commands.rs`, `commands/plugin_commands.rs`
//! **Services**: `services/theme_service/`, `services/embedding_service/`,
//!              `services/git_service/`, `services/plugin_service.rs`

pub use crate::services::embedding_service::EmbeddingService;
pub use crate::services::plugin_service::PluginService;
pub use crate::services::theme_service::ThemeService;
