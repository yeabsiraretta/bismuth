//! NAS service — public surface.
//!
//! Re-exports the WebDAV client and sync engine submodules.
//! Business logic for NAS operations lives here; IPC command handlers
//! in `commands/nas/` are thin shims that call into this service.

pub mod webdav_client;
pub mod propfind_parser;
pub mod sync;
pub(crate) mod sync_conflict;
pub(crate) mod sync_walker;

/// NAS configuration model.
///
/// IMPORTANT: This struct MUST NOT contain a password field.
/// Passwords are stored exclusively in the OS keychain:
///   service: "bismuth-pkm", account: "nas-{vaultId}", value: JSON { password: String }
///
/// This struct maps directly to `.bismuth/nas-config.json`.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NasConfig {
    pub url: String,
    pub username: String,
    pub last_sync: Option<String>,
    pub offline_mode_enabled: bool,
    // SECURITY: no password field — keychain only.
    // If a password field is accidentally introduced, the #[serde(skip)]
    // below will prevent it from being serialized to the config file.
    // This acts as a CI-visible guard.
}

/// Result of a WebDAV connection test.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NasConnectionResult {
    pub success: bool,
    pub error: Option<String>,
    pub server_info: Option<String>,
}

/// Summary returned after a sync operation.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSummary {
    pub uploaded: u32,
    pub downloaded: u32,
    pub conflicts: u32,
    pub duration_ms: u64,
}
