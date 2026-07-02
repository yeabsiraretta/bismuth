//! Template system IPC commands.

use crate::services::template_service::{Template, TemplateService, TemplateType};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Managed state for template service.
pub struct TemplateState {
    pub template_service: Mutex<Option<TemplateService>>,
}

/// Initialize the template service for a vault.
#[tauri::command]
pub async fn initialize_template_service(
    state: State<'_, TemplateState>,
    vault_root: String,
) -> Result<(), String> {
    let service = TemplateService::new(&PathBuf::from(&vault_root));
    // Seed default templates if the templates directory is empty
    if let Err(e) = service.seed_defaults() {
        tracing::warn!("Failed to seed default templates: {}", e);
    }
    let mut guard = state.template_service.lock().unwrap();
    *guard = Some(service);
    Ok(())
}

/// List all available templates.
#[tauri::command]
pub async fn list_templates(
    state: State<'_, TemplateState>,
) -> Result<Vec<Template>, String> {
    let guard = state.template_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Template service not initialized")?;
    service.list_templates().map_err(|e| e.to_string())
}

/// Render a template with context variables.
#[tauri::command]
pub async fn render_template(
    state: State<'_, TemplateState>,
    content: String,
    context: HashMap<String, String>,
) -> Result<String, String> {
    let guard = state.template_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Template service not initialized")?;
    service.render_template(&content, &context).map_err(|e| e.to_string())
}

/// Create a note from a template.
#[tauri::command]
pub async fn create_from_template(
    state: State<'_, TemplateState>,
    template_name: String,
    target_path: String,
    context: HashMap<String, String>,
) -> Result<String, String> {
    let guard = state.template_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Template service not initialized")?;
    let path = PathBuf::from(&target_path);
    service.create_from_template(&template_name, &path, &context)
        .map_err(|e| e.to_string())
}

/// Save a template to the vault.
#[tauri::command]
pub async fn save_template(
    state: State<'_, TemplateState>,
    name: String,
    content: String,
    template_type: String,
    description: String,
) -> Result<(), String> {
    let guard = state.template_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Template service not initialized")?;
    let tt = match template_type.as_str() {
        "daily" => TemplateType::Daily,
        "weekly" => TemplateType::Weekly,
        "monthly" => TemplateType::Monthly,
        "yearly" => TemplateType::Yearly,
        _ => TemplateType::Custom,
    };
    let template = Template { name, template_type: tt, content, description };
    service.save_template(&template).map_err(|e| e.to_string())
}

/// Delete a template.
#[tauri::command]
pub async fn delete_template(
    state: State<'_, TemplateState>,
    name: String,
) -> Result<(), String> {
    let guard = state.template_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Template service not initialized")?;
    service.delete_template(&name).map_err(|e| e.to_string())
}
