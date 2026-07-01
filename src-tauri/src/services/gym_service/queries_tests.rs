#[cfg(test)]
mod tests {
    use crate::services::gym_service::queries::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(crate::services::gym_service::migration::MIGRATION_001).unwrap();
        conn.execute(
            "INSERT INTO exercises (id, name, muscle_group, equipment) VALUES ('ex-chest', 'Bench Press', 'chest', 'barbell')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO exercises (id, name, muscle_group, equipment) VALUES ('ex-legs', 'Squat', 'legs', 'barbell')",
            [],
        ).unwrap();
        conn
    }

    #[test]
    fn test_create_and_list_session() {
        let conn = setup();
        let session_id = create_session(&conn, "vault1", "2026-06-21", Some(60), None).unwrap();
        let sessions = get_sessions_for_date(&conn, "vault1", "2026-06-21").unwrap();
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0]["id"], session_id);
    }

    #[test]
    fn test_vault_id_isolation() {
        let conn = setup();
        create_session(&conn, "vault1", "2026-06-21", None, None).unwrap();
        create_session(&conn, "vault2", "2026-06-21", None, None).unwrap();
        let v1_sessions = get_sessions_for_date(&conn, "vault1", "2026-06-21").unwrap();
        let v2_sessions = get_sessions_for_date(&conn, "vault2", "2026-06-21").unwrap();
        assert_eq!(v1_sessions.len(), 1);
        assert_eq!(v2_sessions.len(), 1);
    }

    #[test]
    fn test_add_set_and_weekly_volume() {
        let conn = setup();
        let session_id = create_session(&conn, "vault1", "2026-06-21", None, None).unwrap();
        add_set(&conn, "vault1", &session_id, "ex-chest", 1, Some(8), Some(80.0)).unwrap();
        add_set(&conn, "vault1", &session_id, "ex-chest", 2, Some(8), Some(80.0)).unwrap();
        let volume = get_weekly_volume(&conn, "vault1", "2026-06-14").unwrap();
        assert!(!volume.is_empty());
        let chest = volume.iter().find(|v| v["muscleGroup"] == "chest");
        assert!(chest.is_some(), "chest should appear in weekly volume");
    }

    #[test]
    fn test_strength_progression_ascending() {
        let conn = setup();
        let s1 = create_session(&conn, "vault1", "2026-06-01", None, None).unwrap();
        let s2 = create_session(&conn, "vault1", "2026-06-15", None, None).unwrap();
        add_set(&conn, "vault1", &s1, "ex-chest", 1, Some(8), Some(70.0)).unwrap();
        add_set(&conn, "vault1", &s2, "ex-chest", 1, Some(8), Some(80.0)).unwrap();
        let prog = get_strength_progression(&conn, "vault1", "ex-chest").unwrap();
        assert!(prog.len() >= 1);
        if prog.len() > 1 {
            let d1 = prog[0]["date"].as_str().unwrap();
            let d2 = prog[1]["date"].as_str().unwrap();
            assert!(d1 <= d2, "Dates should be in ascending order");
        }
    }

    #[test]
    fn test_personal_records() {
        let conn = setup();
        let session_id = create_session(&conn, "vault1", "2026-06-21", None, None).unwrap();
        add_set(&conn, "vault1", &session_id, "ex-chest", 1, Some(5), Some(100.0)).unwrap();
        add_set(&conn, "vault1", &session_id, "ex-chest", 2, Some(8), Some(80.0)).unwrap();
        let prs = get_personal_records(&conn, "vault1").unwrap();
        let chest_pr = prs.iter().find(|p| p["exerciseId"] == "ex-chest");
        assert!(chest_pr.is_some());
        assert_eq!(chest_pr.unwrap()["bestWeightKg"], 100.0);
    }

    #[test]
    fn test_delete_session_cascades() {
        let conn = setup();
        let session_id = create_session(&conn, "vault1", "2026-06-21", None, None).unwrap();
        add_set(&conn, "vault1", &session_id, "ex-chest", 1, Some(8), Some(80.0)).unwrap();
        delete_session(&conn, "vault1", &session_id).unwrap();
        let sessions = get_sessions_for_date(&conn, "vault1", "2026-06-21").unwrap();
        assert_eq!(sessions.len(), 0);
        let set_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sets WHERE session_id=?1", [&session_id], |r| r.get(0)
        ).unwrap();
        assert_eq!(set_count, 0, "Sets should cascade-delete with session");
    }

    #[test]
    fn test_list_exercises() {
        let conn = setup();
        let exercises = list_exercises(&conn, "vault1").unwrap();
        assert!(exercises.len() >= 2);
        assert!(exercises.iter().any(|e| e["name"] == "Bench Press"));
    }
}
