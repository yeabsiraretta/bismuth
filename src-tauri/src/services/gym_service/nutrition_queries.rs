//! Nutrition and template query functions for the gym service.
//!
//! Separated from queries.rs to respect the 300-line file limit.

use rusqlite::{Connection, Result as SqliteResult};
use serde_json::{json, Value};

/// Adds a nutrition log entry. Returns the new entry ID.
pub fn add_nutrition(
    conn: &Connection,
    vault_id: &str,
    date: &str,
    meal_name: &str,
    calories: Option<f64>,
    protein_g: Option<f64>,
    carbs_g: Option<f64>,
    fat_g: Option<f64>,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO nutrition_log (id, vault_id, date, meal_name, calories, protein_g, carbs_g, fat_g) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![id, vault_id, date, meal_name, calories, protein_g, carbs_g, fat_g],
    ).map_err(|e| format!("Failed to log nutrition: {}", e))?;
    Ok(id)
}

/// Deletes a nutrition entry by ID.
pub fn delete_nutrition(conn: &Connection, vault_id: &str, entry_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM nutrition_log WHERE id = ?1 AND vault_id = ?2",
        rusqlite::params![entry_id, vault_id],
    ).map_err(|e| format!("Failed to delete nutrition entry: {}", e))?;
    Ok(())
}

/// Returns nutrition entries for a specific date and vault.
pub fn get_nutrition_for_date(conn: &Connection, vault_id: &str, date: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, vault_id, date, meal_name, calories, protein_g, carbs_g, fat_g, created_at FROM nutrition_log WHERE vault_id=?1 AND date=?2 ORDER BY created_at",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id, date], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?,
            "vaultId": row.get::<_, String>(1)?,
            "date": row.get::<_, String>(2)?,
            "mealName": row.get::<_, String>(3)?,
            "calories": row.get::<_, Option<f64>>(4)?,
            "proteinG": row.get::<_, Option<f64>>(5)?,
            "carbsG": row.get::<_, Option<f64>>(6)?,
            "fatG": row.get::<_, Option<f64>>(7)?,
            "createdAt": row.get::<_, String>(8)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Returns weekly macro totals.
pub fn get_weekly_macros(conn: &Connection, vault_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT strftime('%Y-%W', date) AS week,
                SUM(COALESCE(calories, 0)) AS total_calories,
                SUM(COALESCE(protein_g, 0)) AS total_protein_g,
                SUM(COALESCE(carbs_g, 0)) AS total_carbs_g,
                SUM(COALESCE(fat_g, 0)) AS total_fat_g,
                COUNT(DISTINCT date) AS days_logged
         FROM nutrition_log
         WHERE vault_id = ?1
         GROUP BY week
         ORDER BY week DESC",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id], |row| {
        Ok(json!({
            "week": row.get::<_, String>(0)?,
            "totalCalories": row.get::<_, f64>(1)?,
            "totalProteinG": row.get::<_, f64>(2)?,
            "totalCarbsG": row.get::<_, f64>(3)?,
            "totalFatG": row.get::<_, f64>(4)?,
            "daysLogged": row.get::<_, i64>(5)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Lists workout templates for a vault.
pub fn list_templates(conn: &Connection, vault_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, exercises FROM workout_templates WHERE vault_id=?1 ORDER BY name",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![vault_id], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "exercises": row.get::<_, String>(2)?,
        }))
    }).map_err(|e| format!("Query error: {}", e))?;

    rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
}

/// Saves a workout template. Returns the new template ID.
pub fn save_template(
    conn: &Connection,
    vault_id: &str,
    name: &str,
    exercises_json: &str,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO workout_templates (id, vault_id, name, exercises) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![id, vault_id, name, exercises_json],
    ).map_err(|e| format!("Failed to save template: {}", e))?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(crate::services::gym_service::migration::MIGRATION_001).unwrap();
        conn
    }

    #[test]
    fn test_add_nutrition_and_get_for_date() {
        let conn = setup();
        add_nutrition(&conn, "v1", "2026-06-21", "Lunch", Some(600.0), Some(40.0), Some(60.0), Some(20.0)).unwrap();
        add_nutrition(&conn, "v1", "2026-06-21", "Dinner", Some(700.0), Some(50.0), Some(70.0), Some(25.0)).unwrap();
        let entries = get_nutrition_for_date(&conn, "v1", "2026-06-21").unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0]["mealName"], "Lunch");
    }

    #[test]
    fn test_weekly_macros_sums() {
        let conn = setup();
        add_nutrition(&conn, "v1", "2026-06-21", "Lunch", Some(600.0), Some(40.0), Some(60.0), Some(20.0)).unwrap();
        add_nutrition(&conn, "v1", "2026-06-21", "Dinner", Some(700.0), Some(50.0), Some(70.0), Some(25.0)).unwrap();
        let macros = get_weekly_macros(&conn, "v1").unwrap();
        assert!(!macros.is_empty());
        let total_cal: f64 = macros[0]["totalCalories"].as_f64().unwrap_or(0.0);
        assert!((total_cal - 1300.0).abs() < 0.1, "Weekly calories should be 1300, got {}", total_cal);
    }

    #[test]
    fn test_save_and_list_templates() {
        let conn = setup();
        let exercises = r#"[{"exercise_id":"ex-1","sets":3,"reps":8}]"#;
        let template_id = save_template(&conn, "v1", "Push Day", exercises).unwrap();
        let templates = list_templates(&conn, "v1").unwrap();
        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0]["name"], "Push Day");
    }
}
