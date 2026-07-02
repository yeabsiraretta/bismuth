//! Gym database migration — opens/creates `.bismuth/db/gym.db` and runs schema migration.

use rusqlite::Connection;
use std::path::Path;

pub const MIGRATION_001: &str = "
CREATE TABLE IF NOT EXISTS exercises (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment    TEXT NOT NULL,
    instructions TEXT,
    is_custom    INTEGER NOT NULL DEFAULT 0,
    vault_id     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name, vault_id)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id           TEXT PRIMARY KEY,
    vault_id     TEXT NOT NULL,
    date         TEXT NOT NULL,
    duration_min INTEGER,
    notes        TEXT,
    linked_note  TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sets (
    id           TEXT PRIMARY KEY,
    vault_id     TEXT NOT NULL,
    session_id   TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id  TEXT NOT NULL REFERENCES exercises(id),
    set_order    INTEGER NOT NULL,
    reps         INTEGER,
    weight_kg    REAL,
    duration_sec INTEGER,
    rpe          REAL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nutrition_log (
    id         TEXT PRIMARY KEY,
    vault_id   TEXT NOT NULL,
    date       TEXT NOT NULL,
    meal_name  TEXT NOT NULL,
    calories   REAL,
    protein_g  REAL,
    carbs_g    REAL,
    fat_g      REAL,
    notes      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_templates (
    id        TEXT PRIMARY KEY,
    vault_id  TEXT NOT NULL,
    name      TEXT NOT NULL,
    exercises TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sets_session    ON sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise   ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date   ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_vault  ON workout_sessions(vault_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_date  ON nutrition_log(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_vault ON nutrition_log(vault_id);
";

/// Opens or creates `<vault_root>/.bismuth/db/gym.db`, runs the schema migration,
/// and seeds built-in exercises if the table is empty.
pub fn ensure_gym_db(vault_root: &str) -> Result<Connection, String> {
    let db_dir = Path::new(vault_root).join(".bismuth").join("db");
    std::fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Failed to create gym db dir: {}", e))?;

    let db_path = db_dir.join("gym.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open gym.db: {}", e))?;

    run_migration(&conn)?;
    seed_exercises_if_empty(&conn)?;

    Ok(conn)
}

fn run_migration(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(MIGRATION_001)
        .map_err(|e| format!("Gym migration failed: {}", e))
}

fn seed_exercises_if_empty(conn: &Connection) -> Result<(), String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM exercises", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count exercises: {}", e))?;

    if count > 0 {
        return Ok(());
    }

    seed_exercises(conn)
}

struct SeedExercise {
    id: &'static str,
    name: &'static str,
    muscle_group: &'static str,
    equipment: &'static str,
}

fn seed_exercises(conn: &Connection) -> Result<(), String> {
    let exercises: &[SeedExercise] = &[
        SeedExercise { id: "ex-001", name: "Barbell Bench Press", muscle_group: "chest", equipment: "barbell" },
        SeedExercise { id: "ex-002", name: "Incline Bench Press", muscle_group: "chest", equipment: "barbell" },
        SeedExercise { id: "ex-003", name: "Cable Fly", muscle_group: "chest", equipment: "cable" },
        SeedExercise { id: "ex-004", name: "Push-up", muscle_group: "chest", equipment: "bodyweight" },
        SeedExercise { id: "ex-005", name: "Barbell Squat", muscle_group: "legs", equipment: "barbell" },
        SeedExercise { id: "ex-006", name: "Deadlift", muscle_group: "legs", equipment: "barbell" },
        SeedExercise { id: "ex-007", name: "Romanian Deadlift", muscle_group: "legs", equipment: "barbell" },
        SeedExercise { id: "ex-008", name: "Leg Press", muscle_group: "legs", equipment: "machine" },
        SeedExercise { id: "ex-009", name: "Leg Curl", muscle_group: "legs", equipment: "machine" },
        SeedExercise { id: "ex-010", name: "Calf Raise", muscle_group: "legs", equipment: "machine" },
        SeedExercise { id: "ex-011", name: "Hip Thrust", muscle_group: "legs", equipment: "barbell" },
        SeedExercise { id: "ex-012", name: "Overhead Press", muscle_group: "shoulders", equipment: "barbell" },
        SeedExercise { id: "ex-013", name: "Face Pull", muscle_group: "shoulders", equipment: "cable" },
        SeedExercise { id: "ex-014", name: "Lateral Raise", muscle_group: "shoulders", equipment: "dumbbell" },
        SeedExercise { id: "ex-015", name: "Barbell Row", muscle_group: "back", equipment: "barbell" },
        SeedExercise { id: "ex-016", name: "Lat Pulldown", muscle_group: "back", equipment: "cable" },
        SeedExercise { id: "ex-017", name: "Seated Row", muscle_group: "back", equipment: "cable" },
        SeedExercise { id: "ex-018", name: "Pull-up", muscle_group: "back", equipment: "bodyweight" },
        SeedExercise { id: "ex-019", name: "Dumbbell Curl", muscle_group: "arms", equipment: "dumbbell" },
        SeedExercise { id: "ex-020", name: "Tricep Dip", muscle_group: "arms", equipment: "bodyweight" },
        SeedExercise { id: "ex-021", name: "Plank", muscle_group: "core", equipment: "bodyweight" },
    ];

    for ex in exercises {
        conn.execute(
            "INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, is_custom) VALUES (?1, ?2, ?3, ?4, 0)",
            rusqlite::params![ex.id, ex.name, ex.muscle_group, ex.equipment],
        ).map_err(|e| format!("Failed to seed exercise {}: {}", ex.name, e))?;
    }

    tracing::info!("Seeded {} built-in exercises into gym.db", exercises.len());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn create_test_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migration(&conn).unwrap();
        conn
    }

    #[test]
    fn test_migration_runs_idempotently() {
        let conn = Connection::open_in_memory().unwrap();
        // Run twice — should not error (CREATE TABLE IF NOT EXISTS)
        run_migration(&conn).expect("First migration run failed");
        run_migration(&conn).expect("Second migration run should be idempotent");
    }

    #[test]
    fn test_tables_created() {
        let conn = create_test_conn();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('exercises','workout_sessions','sets','nutrition_log','workout_templates')",
            [], |row| row.get(0)
        ).unwrap();
        assert_eq!(count, 5, "All 5 tables should be created");
    }

    #[test]
    fn test_seed_exercises_inserted() {
        let conn = create_test_conn();
        seed_exercises(&conn).unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM exercises", [], |row| row.get(0)).unwrap();
        assert!(count >= 20, "Should have seeded at least 20 exercises, got {}", count);
    }

    #[test]
    fn test_seed_exercises_idempotent() {
        let conn = create_test_conn();
        seed_exercises(&conn).unwrap();
        let count_first: i64 = conn.query_row("SELECT COUNT(*) FROM exercises", [], |row| row.get(0)).unwrap();
        // Seed again — INSERT OR IGNORE should prevent duplicates
        seed_exercises(&conn).unwrap();
        let count_second: i64 = conn.query_row("SELECT COUNT(*) FROM exercises", [], |row| row.get(0)).unwrap();
        assert_eq!(count_first, count_second, "Seed should be idempotent");
    }

    #[test]
    fn test_indexes_created() {
        let conn = create_test_conn();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
            [], |row| row.get(0)
        ).unwrap();
        assert!(count >= 6, "Should have created index entries, got {}", count);
    }

    #[test]
    fn test_seed_only_when_empty() {
        let conn = Connection::open_in_memory().unwrap();
        run_migration(&conn).unwrap();
        // Pre-insert one row so table is not empty
        conn.execute(
            "INSERT INTO exercises (id, name, muscle_group, equipment) VALUES ('custom-1', 'My Exercise', 'core', 'other')",
            [],
        ).unwrap();
        // seed_exercises_if_empty should skip seeding
        seed_exercises_if_empty(&conn).unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM exercises", [], |row| row.get(0)).unwrap();
        // Should still be 1 (the pre-inserted exercise)
        assert_eq!(count, 1, "Should not seed when table already has rows");
    }
}
