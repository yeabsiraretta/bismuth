//! App version and update-check stub commands.
//! No network calls are made — this command reads only the compiled-in app version.
//! A real update endpoint may be wired in future; at that point, responses MUST
//! be verified against a signed release manifest before display.

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppVersionInfo {
    pub current_version: String,
    pub checked_at: i64,
}

/// Sets the app locale. Stub — logs the locale code for the future i18n call chain.
/// Validates that the locale is non-empty and at most 16 chars.
#[tauri::command]
pub async fn set_app_locale(locale: String) -> Result<(), String> {
    if locale.is_empty() || locale.len() > 16 {
        return Err("Invalid locale code".into());
    }
    tracing::info!("set_app_locale: locale={}", locale);
    Ok(())
}

/// Returns the current app version from the Tauri package info.
/// Does not make any network calls.
#[tauri::command]
pub async fn check_app_version(app: AppHandle) -> Result<AppVersionInfo, String> {
    let version = app.package_info().version.to_string();
    let checked_at = chrono::Utc::now().timestamp();
    tracing::info!("check_app_version: current={}", version);
    Ok(AppVersionInfo { current_version: version, checked_at })
}
