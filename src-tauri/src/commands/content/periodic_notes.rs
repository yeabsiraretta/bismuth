use serde::{Serialize, Deserialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct PeriodicNoteResult {
    pub path: String,
    pub created: bool,
}

const VALID_PERIOD_TYPES: &[&str] = &["daily", "weekly", "monthly", "quarterly", "yearly"];

fn validate_period_type(period_type: &str) -> Result<(), String> {
    if !VALID_PERIOD_TYPES.contains(&period_type) {
        return Err(format!("Invalid period type: {}", period_type));
    }
    Ok(())
}

fn build_note_name(period_type: &str, date_str: &str) -> Result<String, String> {
    if date_str.len() < 10 {
        return Err("date_str must be at least 10 characters (YYYY-MM-DD)".to_string());
    }
    let name = match period_type {
        "daily" => format!("{}.md", date_str),
        "weekly" => {
            if date_str.len() < 7 {
                return Err("date_str too short for weekly".to_string());
            }
            format!("W{}.md", &date_str[..7])
        }
        "monthly" => format!("{}.md", &date_str[..7]),
        "quarterly" => {
            let month: u32 = date_str[5..7].parse().unwrap_or(1);
            let q = (month + 2) / 3;
            format!("{}-Q{}.md", &date_str[..4], q)
        }
        "yearly" => format!("{}.md", &date_str[..4]),
        _ => return Err(format!("Unknown period type: {}", period_type)),
    };
    Ok(name)
}

#[tauri::command]
pub async fn open_or_create_periodic_note(
    vault_root: String,
    period_type: String,
    date_str: String,
) -> Result<PeriodicNoteResult, String> {
    validate_period_type(&period_type)?;
    let note_name = build_note_name(&period_type, &date_str)?;
    let folder = Path::new(&vault_root)
        .join("Periodic Notes")
        .join(&period_type);
    std::fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    let path = folder.join(&note_name);
    let created = !path.exists();
    if created {
        let title = note_name.trim_end_matches(".md");
        std::fs::write(&path, format!("# {}\n\n", title))
            .map_err(|e| e.to_string())?;
        tracing::info!("Created periodic note: {} ({})", note_name, period_type);
    }
    let rel_path = format!("Periodic Notes/{}/{}", period_type, note_name);
    Ok(PeriodicNoteResult { path: rel_path, created })
}

#[tauri::command]
pub async fn get_periodic_notes_for_range(
    vault_root: String,
    period_type: String,
    start_date: String,
    end_date: String,
) -> Result<Vec<String>, String> {
    validate_period_type(&period_type)?;
    let folder = Path::new(&vault_root)
        .join("Periodic Notes")
        .join(&period_type);
    if !folder.exists() {
        return Ok(vec![]);
    }
    let mut notes = Vec::new();
    for entry in std::fs::read_dir(&folder).map_err(|e| e.to_string())?.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("md") {
            let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if name >= start_date.as_str() && name <= end_date.as_str() {
                let rel = format!("Periodic Notes/{}/{}.md", period_type, name);
                notes.push(rel);
            }
        }
    }
    notes.sort();
    Ok(notes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_daily_note_name() {
        let name = build_note_name("daily", "2026-06-21").unwrap();
        assert_eq!(name, "2026-06-21.md");
    }

    #[test]
    fn build_quarterly_note_q2() {
        let name = build_note_name("quarterly", "2026-04-01").unwrap();
        assert_eq!(name, "2026-Q2.md");
    }

    #[test]
    fn build_quarterly_note_q1() {
        let name = build_note_name("quarterly", "2026-01-15").unwrap();
        assert_eq!(name, "2026-Q1.md");
    }

    #[test]
    fn build_yearly_note() {
        let name = build_note_name("yearly", "2026-06-21").unwrap();
        assert_eq!(name, "2026.md");
    }

    #[test]
    fn rejects_invalid_period_type() {
        assert!(validate_period_type("hourly").is_err());
        assert!(validate_period_type("").is_err());
    }
}
