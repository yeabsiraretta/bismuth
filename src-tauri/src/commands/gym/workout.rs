//! Gym Tauri command handlers — delegates to gym_service query functions.
//!
//! No SQL strings appear here; all queries are in `gym_service::queries`.

use crate::services::gym_service::migration::ensure_gym_db;
use crate::services::gym_service::queries;
use crate::services::gym_service::nutrition_queries;
use serde_json::Value;

/// Lists all exercises (built-in + custom for this vault).
#[tauri::command]
pub async fn gym_list_exercises(vault_root: String) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let exercises = queries::list_exercises(&conn, &vault_root)?;
    Ok(Value::Array(exercises))
}

/// Creates a new workout session.
#[tauri::command]
pub async fn gym_create_session(
    vault_root: String,
    vault_id: String,
    date: String,
    duration_min: Option<i32>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::create_session(&conn, &vault_id, &date, duration_min, notes.as_deref())
}

/// Updates an existing workout session.
#[tauri::command]
pub async fn gym_update_session(
    vault_root: String,
    vault_id: String,
    session_id: String,
    duration_min: Option<i32>,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::update_session(&conn, &vault_id, &session_id, duration_min, notes.as_deref())
}

/// Deletes a workout session (cascades to sets).
#[tauri::command]
pub async fn gym_delete_session(
    vault_root: String,
    vault_id: String,
    session_id: String,
) -> Result<(), String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::delete_session(&conn, &vault_id, &session_id)
}

/// Adds a set to a workout session.
#[tauri::command]
pub async fn gym_add_set(
    vault_root: String,
    vault_id: String,
    session_id: String,
    exercise_id: String,
    set_order: i32,
    reps: Option<i32>,
    weight_kg: Option<f64>,
) -> Result<String, String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::add_set(&conn, &vault_id, &session_id, &exercise_id, set_order, reps, weight_kg)
}

/// Deletes a set.
#[tauri::command]
pub async fn gym_delete_set(
    vault_root: String,
    vault_id: String,
    set_id: String,
) -> Result<(), String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::delete_set(&conn, &vault_id, &set_id)
}

/// Lists recent workout sessions for a vault.
#[tauri::command]
pub async fn gym_list_sessions(
    vault_root: String,
    vault_id: String,
    limit: i32,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let sessions = queries::list_sessions(&conn, &vault_id, limit)?;
    Ok(Value::Array(sessions))
}

/// Returns sessions for a specific date.
#[tauri::command]
pub async fn gym_get_sessions_for_date(
    vault_root: String,
    vault_id: String,
    date: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let sessions = queries::get_sessions_for_date(&conn, &vault_id, &date)?;
    Ok(Value::Array(sessions))
}

/// Returns weekly volume aggregated by muscle group.
#[tauri::command]
pub async fn gym_get_weekly_volume(
    vault_root: String,
    vault_id: String,
    week_start: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let volume = queries::get_weekly_volume(&conn, &vault_id, &week_start)?;
    Ok(Value::Array(volume))
}

/// Returns strength progression for one exercise.
#[tauri::command]
pub async fn gym_get_strength_progression(
    vault_root: String,
    vault_id: String,
    exercise_id: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let progression = queries::get_strength_progression(&conn, &vault_id, &exercise_id)?;
    Ok(Value::Array(progression))
}

/// Returns personal records per exercise.
#[tauri::command]
pub async fn gym_get_personal_records(
    vault_root: String,
    vault_id: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let prs = queries::get_personal_records(&conn, &vault_id)?;
    Ok(Value::Array(prs))
}

/// Creates a custom exercise for this vault.
#[tauri::command]
pub async fn gym_create_exercise(
    vault_root: String,
    vault_id: String,
    name: String,
    muscle_group: String,
    equipment: String,
) -> Result<String, String> {
    let conn = ensure_gym_db(&vault_root)?;
    queries::create_exercise(&conn, &vault_id, &name, &muscle_group, &equipment)
}

/// Logs a nutrition entry.
#[tauri::command]
pub async fn gym_add_nutrition(
    vault_root: String,
    vault_id: String,
    date: String,
    meal_name: String,
    calories: Option<f64>,
    protein_g: Option<f64>,
    carbs_g: Option<f64>,
    fat_g: Option<f64>,
) -> Result<String, String> {
    let conn = ensure_gym_db(&vault_root)?;
    nutrition_queries::add_nutrition(&conn, &vault_id, &date, &meal_name, calories, protein_g, carbs_g, fat_g)
}

/// Deletes a nutrition entry.
#[tauri::command]
pub async fn gym_delete_nutrition(
    vault_root: String,
    vault_id: String,
    entry_id: String,
) -> Result<(), String> {
    let conn = ensure_gym_db(&vault_root)?;
    nutrition_queries::delete_nutrition(&conn, &vault_id, &entry_id)
}

/// Returns nutrition entries for a specific date.
#[tauri::command]
pub async fn gym_get_nutrition(
    vault_root: String,
    vault_id: String,
    date: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let entries = nutrition_queries::get_nutrition_for_date(&conn, &vault_id, &date)?;
    Ok(Value::Array(entries))
}

/// Returns weekly macro totals.
#[tauri::command]
pub async fn gym_get_weekly_macros(
    vault_root: String,
    vault_id: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let macros = nutrition_queries::get_weekly_macros(&conn, &vault_id)?;
    Ok(Value::Array(macros))
}

/// Lists workout templates for a vault.
#[tauri::command]
pub async fn gym_list_templates(
    vault_root: String,
    vault_id: String,
) -> Result<Value, String> {
    let conn = ensure_gym_db(&vault_root)?;
    let templates = nutrition_queries::list_templates(&conn, &vault_id)?;
    Ok(Value::Array(templates))
}

/// Saves a workout template.
#[tauri::command]
pub async fn gym_save_template(
    vault_root: String,
    vault_id: String,
    name: String,
    exercises_json: String,
) -> Result<String, String> {
    let conn = ensure_gym_db(&vault_root)?;
    nutrition_queries::save_template(&conn, &vault_id, &name, &exercises_json)
}
