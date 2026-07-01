//! Vault domain — note CRUD, file tree, vault lifecycle
//!
//! **Commands**: `commands/vault_commands/` (notes, operations, changelog, export, navigator)
//! **Services**: `services/vault_service/`
//! **Models**: `models/vault.rs`, `models/note.rs`

pub use crate::models::{Note, SearchResult, Tag, Vault};
pub use crate::services::vault_service::VaultService;
