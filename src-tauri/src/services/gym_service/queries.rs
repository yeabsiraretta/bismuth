//! Gym SQL query functions — session, set, exercise, and chart queries.
//!
//! Nutrition and template queries are in `nutrition_queries.rs`.
//! No raw SQL strings appear in command handlers.

use rusqlite::{Connection, Result as SqliteResult};
use serde_json::{json, Value};

/// Creates a new workout session. Returns the new session ID.
pub fn create_session(
    conn: &Connection,
    vault_id: &str,
    date: &str,
    duration_min: Option<i32>,
    notes: Option<&str>,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO workout_sessions (id, vault_id, date, duration_min, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![id, vault_id, date, duration_min, notes],
    ).map_err(|e| format!("Failed to create session: {}", e))?;
    Ok(id)
}

/// Updates an existing workout session (duration and notes).
pub fn update_session(
    conn: &Connection,
    vault_id: &str,
    session_id: &str,
    duration_min: Option<i32>,
    notes: Option<&str>,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workout_sessions SET duration_min=?1, notes=?2 WHERE id=?3 AND vault_id=?4",
        rusqlite::params![duration_min, notes, session_id, vault_id],
    ).map_err(|e| format!("Failed to update session: {}", e))?;
    Ok(())
}

/// Deletes a workout session (cascades to sets).
pub fn delete_session(conn: &Connection, vault_id: &str, session_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM workout_sessions WHERE id=?1 AND vault_id=?2",
        rusqlite::params![session_id, vault_id],
    ).map_err(|e| format!("Failed to delete session: {}", e))?;
    Ok(())
}

/// Returns sessions for a given vault, up to `limit`.
pub fn list_sessions(conn: &Connection, vault_id: &str, limit: i32) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, vault_id, date, duration_min, notes, created_at FROM workout_sessions WHERE vault_id=?1 ORDER BY date DESC, created_at DESC LIMIT ?2",
    ).map_err(|e| format!("Failed to prepare list_sessions: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id, limit], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?,
            "vaultId": row.get::<_, String>(1)?,
            "date": row.get::<_, String>(2)?,
            "durationMin": row.get::<_, Option<i32>>(3)?,
            "notes": row.get::<_, Option<String>>(4)?,
            "createdAt": row.get::<_, String>(5)?,
        }))
    }).map_err(|e| format!("Failed to list sessions: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error in list_sessions: {}", e))
}

/// Returns sessions for a specific date and vault.
pub fn get_sessions_for_date(conn: &Connection, vault_id: &str, date: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, vault_id, date, duration_min, notes, created_at FROM workout_sessions WHERE vault_id=?1 AND date=?2 ORDER BY created_at",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id, date], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?,
            "vaultId": row.get::<_, String>(1)?,
            "date": row.get::<_, String>(2)?,
            "durationMin": row.get::<_, Option<i32>>(3)?,
            "notes": row.get::<_, Option<String>>(4)?,
            "createdAt": row.get::<_, String>(5)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Adds a set to a session. Returns the new set ID.
pub fn add_set(
    conn: &Connection,
    vault_id: &str,
    session_id: &str,
    exercise_id: &str,
    set_order: i32,
    reps: Option<i32>,
    weight_kg: Option<f64>,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sets (id, vault_id, session_id, exercise_id, set_order, reps, weight_kg) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![id, vault_id, session_id, exercise_id, set_order, reps, weight_kg],
    ).map_err(|e| format!("Failed to add set: {}", e))?;
    Ok(id)
}

/// Deletes a set by ID.
pub fn delete_set(conn: &Connection, vault_id: &str, set_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM sets WHERE id=?1 AND vault_id=?2",
        rusqlite::params![set_id, vault_id],
    ).map_err(|e| format!("Failed to delete set: {}", e))?;
    Ok(())
}

/// Lists exercises (built-in + custom for this vault).
pub fn list_exercises(conn: &Connection, vault_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, muscle_group, equipment, is_custom FROM exercises WHERE is_custom=0 OR (is_custom=1 AND vault_id=?1) ORDER BY muscle_group, name",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "muscleGroup": row.get::<_, String>(2)?,
            "equipment": row.get::<_, Option<String>>(3)?,
            "isCustom": row.get::<_, i32>(4)? != 0,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Creates a custom exercise for a vault. Returns the new exercise ID.
pub fn create_exercise(
    conn: &Connection,
    vault_id: &str,
    name: &str,
    muscle_group: &str,
    equipment: &str,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO exercises (id, name, muscle_group, equipment, is_custom, vault_id) VALUES (?1, ?2, ?3, ?4, 1, ?5)",
        rusqlite::params![id, name, muscle_group, equipment, vault_id],
    ).map_err(|e| format!("Failed to create exercise: {}", e))?;
    Ok(id)
}

/// Returns weekly volume aggregated by muscle group.
pub fn get_weekly_volume(conn: &Connection, vault_id: &str, week_start: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT e.muscle_group,
                SUM(COALESCE(s.reps, 0) * COALESCE(s.weight_kg, 0)) AS total_volume_kg,
                COUNT(DISTINCT ws.id) AS session_count,
                COUNT(s.id) AS total_sets
         FROM sets s
         JOIN workout_sessions ws ON s.session_id = ws.id
         JOIN exercises e ON s.exercise_id = e.id
         WHERE ws.vault_id = ?1
           AND ws.date >= ?2
         GROUP BY e.muscle_group
         ORDER BY total_volume_kg DESC",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id, week_start], |row| {
        Ok(json!({
            "muscleGroup": row.get::<_, String>(0)?,
            "totalVolumeKg": row.get::<_, f64>(1)?,
            "sessionCount": row.get::<_, i64>(2)?,
            "totalSets": row.get::<_, i64>(3)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Returns strength progression for one exercise over the last 30 days.
pub fn get_strength_progression(
    conn: &Connection,
    vault_id: &str,
    exercise_id: &str,
) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT ws.date,
                MAX(s.weight_kg) AS max_weight_kg,
                MAX(s.reps) AS max_reps,
                SUM(COALESCE(s.reps, 0) * COALESCE(s.weight_kg, 0)) AS session_volume
         FROM sets s
         JOIN workout_sessions ws ON s.session_id = ws.id
         WHERE s.exercise_id = ?1
           AND ws.vault_id = ?2
           AND ws.date >= date('now', '-30 days')
         GROUP BY ws.date
         ORDER BY ws.date ASC",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![exercise_id, vault_id], |row| {
        Ok(json!({
            "date": row.get::<_, String>(0)?,
            "maxWeightKg": row.get::<_, Option<f64>>(1)?,
            "maxReps": row.get::<_, Option<i32>>(2)?,
            "sessionVolume": row.get::<_, f64>(3)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Returns all-time personal records per exercise.
pub fn get_personal_records(conn: &Connection, vault_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT e.id, e.name, e.muscle_group,
                MAX(s.weight_kg) AS best_weight_kg,
                MAX(s.reps) AS best_rep_count,
                ws.date AS pr_date
         FROM sets s
         JOIN exercises e ON s.exercise_id = e.id
         JOIN workout_sessions ws ON s.session_id = ws.id
         WHERE ws.vault_id = ?1
         GROUP BY s.exercise_id",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id], |row| {
        Ok(json!({
            "exerciseId": row.get::<_, String>(0)?,
            "exerciseName": row.get::<_, String>(1)?,
            "muscleGroup": row.get::<_, String>(2)?,
            "bestWeightKg": row.get::<_, Option<f64>>(3)?,
            "bestRepCount": row.get::<_, Option<i32>>(4)?,
            "prDate": row.get::<_, String>(5)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

