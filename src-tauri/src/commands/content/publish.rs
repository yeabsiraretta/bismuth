//! Publishing IPC commands — scan publishable notes, trigger publish, toggle flag.

use crate::commands::design::canvas::CanvasState;
use crate::commands::vault_commands::AppState;
use crate::error::Result;
use crate::services::publishing_service::{
    deploy, static_gen, PublishConfig, PublishableNote, PublishingService,
};
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct PublishResult {
    pub pages_published: u32,
    pub output_dir: String,
}

/// Scans vault for notes with `dg-publish: true` / `publish: true` in frontmatter.
#[tauri::command]
pub async fn scan_publishable_notes(
    state: State<'_, AppState>,
) -> Result<Vec<PublishableNote>> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| crate::error::BismuthError::Generic("No vault open".into()))?;
    let vault_root = &vault.root_path;
    let pub_service = PublishingService::new(
        vault_root,
        default_config(vault_root),
    );
    pub_service.scan_publishable_notes()
}

/// Publishes the site: renders notes + canvases to static HTML, then deploys.
#[tauri::command]
pub async fn publish_site(
    config: PublishConfig,
    state: State<'_, AppState>,
    canvas_state: State<'_, CanvasState>,
) -> Result<PublishResult> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| crate::error::BismuthError::Generic("No vault open".into()))?;
    let vault_root = &vault.root_path;
    let pub_service = PublishingService::new(vault_root, config.clone());
    let notes = pub_service.scan_publishable_notes()?;

    // Load all canvases with their elements for rendering
    let canvas_svc = canvas_state.canvas_service.lock().unwrap();
    let canvas_metas = canvas_svc.list_canvases().unwrap_or_default();
    let canvases: Vec<_> = canvas_metas
        .iter()
        .filter_map(|m| canvas_svc.load_canvas(&m.id).ok())
        .collect();
    let note_canvas_map = canvas_svc.get_all_note_canvas_links().unwrap_or_default();

    let count = static_gen::generate_site(&notes, &config, &canvases, &note_canvas_map)?;
    deploy::deploy(&config)?;

    Ok(PublishResult {
        pages_published: count,
        output_dir: config.output_dir.to_string_lossy().to_string(),
    })
}

/// Toggles the `publish: true` flag in a note's frontmatter.
/// Returns the new publish state.
#[tauri::command]
pub async fn toggle_publish_flag(
    path: String,
    state: State<'_, AppState>,
) -> Result<bool> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| crate::error::BismuthError::Generic("No vault open".into()))?;
    let vault_root = &vault.root_path;

    let full_path = vault_root.join(&path);
    let content = std::fs::read_to_string(&full_path)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Read failed: {}", e)))?;

    let (mut fm, body) = crate::services::FrontmatterService::parse(&content).unwrap_or_default();
    let currently_published = fm
        .get("publish")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let new_value = !currently_published;

    crate::services::FrontmatterService::set_field(
        &mut fm,
        "publish".to_string(),
        serde_json::Value::Bool(new_value),
    );
    let updated = crate::services::FrontmatterService::serialize(&fm, &body)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Serialize failed: {}", e)))?;
    std::fs::write(&full_path, updated)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Write failed: {}", e)))?;

    Ok(new_value)
}

/// Gets the saved publish configuration from `.bismuth/publish/config.json`.
#[tauri::command]
pub async fn get_publish_config(
    state: State<'_, AppState>,
) -> Result<Option<PublishConfig>> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| crate::error::BismuthError::Generic("No vault open".into()))?;
    let config_path = vault.root_path.join(".bismuth/publish/config.json");
    if !config_path.exists() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(&config_path)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Read config: {}", e)))?;
    let config: PublishConfig = serde_json::from_str(&raw)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Parse config: {}", e)))?;
    Ok(Some(config))
}

/// Saves publish configuration to `.bismuth/publish/config.json`.
#[tauri::command]
pub async fn save_publish_config(
    config: PublishConfig,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| crate::error::BismuthError::Generic("No vault open".into()))?;
    let dir = vault.root_path.join(".bismuth/publish");
    std::fs::create_dir_all(&dir)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Create dir: {}", e)))?;
    let config_path = dir.join("config.json");
    let raw = serde_json::to_string_pretty(&config)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Serialize: {}", e)))?;
    std::fs::write(&config_path, raw)
        .map_err(|e| crate::error::BismuthError::Generic(format!("Write config: {}", e)))?;
    Ok(())
}

fn default_config(vault_root: &std::path::Path) -> PublishConfig {
    PublishConfig {
        output_dir: vault_root.join(".bismuth/publish/output"),
        base_url: "/".to_string(),
        theme: "default".to_string(),
        target: crate::services::publishing_service::PublishTarget::Local,
        deploy_token: None,
        site_id: None,
        project_name: None,
    }
}
