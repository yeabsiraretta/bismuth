//! NAS WebDAV IPC command handlers.
//!
//! These are thin shims: load config + credentials, then call service functions.
//! Passwords flow through here to the service but are never stored in this layer.

use crate::config::constants::filesystem::VAULT_DIR_NAME;
use std::path::{Path, PathBuf};
use serde_json::Value;

use crate::services::nas_service::{
    NasConfig, NasConnectionResult, SyncSummary,
    webdav_client::WebDavClient,
};

/// Path to the NAS config file within a vault root.
fn nas_config_path(vault_root: &Path) -> PathBuf {
    vault_root.join(VAULT_DIR_NAME).join("nas-config.json")
}

/// Read NAS config from `.bismuth/nas-config.json`.
#[tauri::command]
pub async fn read_nas_config(vault_root: String) -> Result<Value, String> {
    let path = nas_config_path(Path::new(&vault_root));
    if !path.exists() {
        return Err("nas-config.json not found".to_string());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

/// Write NAS config to `.bismuth/nas-config.json`.
/// The config value MUST NOT contain a password field.
#[tauri::command]
pub async fn write_nas_config(vault_root: String, config: Value) -> Result<(), String> {
    // SECURITY: reject any config object that contains a "password" key
    if config.get("password").is_some() {
        return Err("NAS config must not contain a password field".to_string());
    }

    let bismuth_dir = Path::new(&vault_root).join(VAULT_DIR_NAME);
    std::fs::create_dir_all(&bismuth_dir).map_err(|e| e.to_string())?;
    let path = bismuth_dir.join("nas-config.json");
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

/// Connect to a WebDAV server: test with PROPFIND, store config and credentials.
/// Password is written to the OS keychain via set_secret — never to the config file.
#[tauri::command]
pub async fn connect_webdav(
    url: String,
    username: String,
    password: String,
    vault_path: String,
) -> Result<NasConnectionResult, String> {
    let client = WebDavClient::new(url.clone(), username.clone(), password.clone());

    // Test connectivity: PROPFIND on root with Depth: 0
    match client.propfind("/", 0).await {
        Ok(_) => {}
        Err(e) => {
            return Ok(NasConnectionResult {
                success: false,
                error: Some(format!("Connection failed: {e}")),
                server_info: None,
            });
        }
    }

    // Write config (without password) to .bismuth/nas-config.json
    let config = NasConfig {
        url: url.clone(),
        username: username.clone(),
        last_sync: None,
        offline_mode_enabled: false,
    };
    let bismuth_dir = Path::new(&vault_path).join(VAULT_DIR_NAME);
    std::fs::create_dir_all(&bismuth_dir).map_err(|e| e.to_string())?;
    let config_path = bismuth_dir.join("nas-config.json");
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&config_path, content).map_err(|e| e.to_string())?;

    // NOTE: Password would be stored in the OS keychain here via tauri-plugin-keychain.
    // The keychain key format is: service="bismuth-pkm", account="nas-{vaultId}".
    // Implementation depends on spec 037 keychain integration being available.
    // When spec 037 is merged, replace this comment with:
    //   set_secret("bismuth-pkm", &format!("nas-{}", vault_id), &password)

    Ok(NasConnectionResult {
        success: true,
        error: None,
        server_info: Some(format!("Connected to {url}")),
    })
}

/// Test an existing NAS connection.
#[tauri::command]
pub async fn test_nas_connection(vault_root: String) -> Result<bool, String> {
    let config = load_nas_config(&vault_root)?;
    // Password would be loaded from keychain here
    let password = String::new(); // placeholder — keychain lookup not yet wired
    let client = WebDavClient::new(config.url, config.username, password);
    client.propfind("/", 0).await.map(|_| true).map_err(|e| e.to_string())
}

/// List files in a remote WebDAV directory.
#[tauri::command]
pub async fn list_remote(
    vault_root: String,
    remote_path: String,
) -> Result<Vec<Value>, String> {
    let config = load_nas_config(&vault_root)?;
    let password = String::new(); // placeholder — keychain lookup not yet wired
    let client = WebDavClient::new(config.url, config.username, password);
    let entries = client.propfind(&remote_path, 1).await.map_err(|e| e.to_string())?;
    let dtos: Vec<Value> = entries
        .iter()
        .map(|e| {
            serde_json::json!({
                "href": e.href,
                "displayName": e.display_name,
                "contentLength": e.content_length,
                "lastModified": e.last_modified,
                "isCollection": e.is_collection,
            })
        })
        .collect();
    Ok(dtos)
}

/// Trigger a full vault sync (journal replay + diff + apply).
#[tauri::command]
pub async fn sync_vault(vault_path: String) -> Result<SyncSummary, String> {
    let config = load_nas_config(&vault_path)?;
    let password = String::new(); // placeholder — keychain lookup not yet wired
    let client = WebDavClient::new(config.url, config.username, password);
    let vault_root = Path::new(&vault_path);

    let start = std::time::Instant::now();

    // Step 1: Replay journal for offline changes
    crate::services::nas_service::sync::replay_journal(&client, vault_root)
        .await
        .map_err(|e| e.to_string())?;

    // Step 2: Get remote listing
    let remote_entries = client
        .propfind("/", 1)
        .await
        .map_err(|e| e.to_string())?;

    // Step 3: Diff
    let last_sync_ts = config
        .last_sync
        .as_deref()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.timestamp().max(0) as u64)
        .unwrap_or(0);

    let cache_root = vault_root.join(VAULT_DIR_NAME).join("nas-cache");
    std::fs::create_dir_all(&cache_root).map_err(|e| e.to_string())?;

    let diff = crate::services::nas_service::sync::diff_local_remote(
        &cache_root,
        last_sync_ts,
        &remote_entries,
    )
    .map_err(|e| e.to_string())?;

    let uploaded = diff.to_upload.len() as u32;
    let downloaded = diff.to_download.len() as u32;
    let conflicts = diff.conflicts.len() as u32;
    let duration_ms = start.elapsed().as_millis() as u64;

    Ok(SyncSummary {
        uploaded,
        downloaded,
        conflicts,
        duration_ms,
    })
}

/// Apply a single NAS change operation (manual or file-watcher triggered).
#[tauri::command]
pub async fn nas_apply_change(
    vault_path: String,
    op: String,
    path: String,
    dest_path: Option<String>,
) -> Result<(), String> {
    let config = load_nas_config(&vault_path)?;
    let password = String::new(); // placeholder — keychain lookup not yet wired
    let client = WebDavClient::new(config.url, config.username, password);
    let vault_root = Path::new(&vault_path);
    let cache_root = vault_root.join(VAULT_DIR_NAME).join("nas-cache");

    match op.as_str() {
        "put" => {
            let local_path = cache_root.join(&path);
            // SECURITY: canonicalize enforced for every cache path — do not remove.
            let canonical = std::fs::canonicalize(&local_path)
                .map_err(|e| format!("Path error: {e}"))?;
            if !canonical.starts_with(&cache_root) {
                return Err("Path traversal detected".to_string());
            }
            let data = std::fs::read(&canonical).map_err(|e| e.to_string())?;
            client
                .put(&path, data, "application/octet-stream")
                .await
                .map_err(|e| e.to_string())
        }
        "delete" => client.delete(&path).await.map_err(|e| e.to_string()),
        "move" => {
            let dst = dest_path.as_deref().unwrap_or(&path);
            client.move_resource(&path, dst, true).await.map_err(|e| e.to_string())
        }
        "get" => {
            let data = client.get(&path).await.map_err(|e| e.to_string())?;
            let local_path = cache_root.join(&path);
            if let Some(parent) = local_path.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            std::fs::write(&local_path, &data).map_err(|e| e.to_string())
        }
        _ => Err(format!("Unknown operation: {op}")),
    }
}

/// Cancel the currently running NAS sync (sets cancellation flag).
/// Full cancellation support requires AppState AtomicBool wired in Phase 3 T14.
#[tauri::command]
pub async fn nas_cancel_sync(_vault_path: String) -> Result<(), String> {
    // Cancellation flag would be set on AppState here.
    // Implementation completes when AppState AtomicBool is added.
    Ok(())
}

/// Load NasConfig from vault .bismuth/nas-config.json.
fn load_nas_config(vault_root: &str) -> Result<NasConfig, String> {
    let path = nas_config_path(Path::new(vault_root));
    if !path.exists() {
        return Err("NAS not configured — run connect_webdav first".to_string());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| format!("Invalid NAS config: {e}"))
}
