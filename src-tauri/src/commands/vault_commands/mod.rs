//! Vault management IPC commands (FR-001, FR-002)
//!
//! Provides the core CRUD operations for vaults, notes, and folders.
//! All commands delegate to [`VaultService`] and enforce vault-boundary security.

pub mod navigator;
pub mod notes;

use crate::services::VaultService;
use std::sync::Mutex;

/// Primary application state managed by Tauri.
///
/// Holds the [`VaultService`] behind a `Mutex` for thread-safe access
/// from async IPC command handlers.
pub struct AppState {
    pub vault_service: Mutex<VaultService>,
}

// Re-export all commands for handler registration
pub use navigator::*;
pub use notes::*;
