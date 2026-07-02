//! Study Vault Tauri command handlers.
//!
//! Delegates to `study_service` for all filesystem operations.
//! Path validation is enforced in the service layer before any file I/O.

use crate::services::study_service::{self, Course, TopicMastery};
use serde_json::Value;

#[tauri::command]
pub async fn list_courses(vault_root: String) -> Result<Value, String> {
    let courses = study_service::list_courses(&vault_root).map_err(|e| e.to_string())?;
    serde_json::to_value(courses).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_course(vault_root: String, course: Course) -> Result<Value, String> {
    let saved = study_service::save_course(&vault_root, &course).map_err(|e| e.to_string())?;
    serde_json::to_value(saved).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_course(vault_root: String, id: String) -> Result<(), String> {
    study_service::delete_course(&vault_root, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_study_topics(
    vault_root: String,
    folder_path: String,
    course_id: String,
) -> Result<Value, String> {
    let topics = study_service::list_topics(&vault_root, &folder_path, &course_id)
        .map_err(|e| e.to_string())?;
    serde_json::to_value(topics).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_study_topic(
    vault_root: String,
    course_id: String,
    topic: TopicMastery,
) -> Result<(), String> {
    study_service::save_topic(&vault_root, &course_id, &topic).map_err(|e| e.to_string())
}
