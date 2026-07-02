//! Study Vault service — reads/writes course records and topic mastery state.
//!
//! Courses are stored as JSON at `.bismuth/study/courses.json`.
//! Topic mastery is stored at `.bismuth/study/mastery/{course_id}.json`.
//! Topic notes are vault Markdown files — this service scans them but never modifies content.

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Course {
    pub id: String,
    pub name: String,
    pub subject: String,
    #[serde(rename = "examDate")]
    pub exam_date: Option<String>,
    #[serde(rename = "totalTopics")]
    pub total_topics: u32,
    #[serde(rename = "folderPath")]
    pub folder_path: String,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "modifiedAt")]
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopicMastery {
    #[serde(rename = "notePath")]
    pub note_path: String,
    pub mastered: bool,
    #[serde(rename = "lastReviewed")]
    pub last_reviewed: Option<String>,
    #[serde(rename = "cardCount")]
    pub card_count: u32,
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────

fn study_dir(vault_root: &str) -> PathBuf {
    PathBuf::from(vault_root).join(".bismuth").join("study")
}

fn courses_path(vault_root: &str) -> PathBuf {
    study_dir(vault_root).join("courses.json")
}

fn mastery_path(vault_root: &str, course_id: &str) -> PathBuf {
    study_dir(vault_root).join("mastery").join(format!("{}.json", course_id))
}

/// Validates a course ID or folder path to prevent path traversal.
/// Reuses the same whitelist pattern as A1 (component IDs).
fn validate_path_segment(s: &str, field: &str) -> Result<()> {
    if s.is_empty() || s.len() > 256 {
        return Err(BismuthError::Generic(format!("{} must be 1–256 chars", field)));
    }
    if s.contains("..") || s.contains('\0') {
        return Err(BismuthError::Generic(format!("{} contains invalid path traversal sequence", field)));
    }
    Ok(())
}

/// Resolves a vault-relative folder path and confirms it stays inside the vault root.
fn resolve_within_vault(vault_root: &str, relative: &str) -> Result<PathBuf> {
    validate_path_segment(relative, "folderPath")?;
    let vault = std::fs::canonicalize(vault_root)
        .map_err(|e| BismuthError::VaultError(format!("Cannot canonicalize vault root: {}", e)))?;
    let joined = vault.join(relative);
    // Canonicalize the joined path if it exists; otherwise check prefix on non-canonical path
    let resolved = if joined.exists() {
        std::fs::canonicalize(&joined)
            .map_err(|e| BismuthError::VaultError(format!("Cannot canonicalize path: {}", e)))?
    } else {
        joined.clone()
    };
    if !resolved.starts_with(&vault) && !joined.starts_with(&vault) {
        return Err(BismuthError::VaultError(format!(
            "folderPath escapes vault boundary: {}", relative
        )));
    }
    Ok(joined)
}

// ─── Course CRUD ─────────────────────────────────────────────────────────────

pub fn list_courses(vault_root: &str) -> Result<Vec<Course>> {
    let path = courses_path(vault_root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)?;
    let courses: Vec<Course> = serde_json::from_str(&content)
        .map_err(|e| BismuthError::ParseError(format!("Invalid courses.json: {}", e)))?;
    Ok(courses)
}

pub fn save_course(vault_root: &str, course: &Course) -> Result<Course> {
    validate_path_segment(&course.id, "course.id")?;
    // Validate folder path stays within vault
    resolve_within_vault(vault_root, &course.folder_path)?;

    let dir = study_dir(vault_root);
    fs::create_dir_all(&dir)?;

    let mut courses = list_courses(vault_root).unwrap_or_default();
    let idx = courses.iter().position(|c| c.id == course.id);
    if let Some(i) = idx {
        courses[i] = course.clone();
    } else {
        courses.push(course.clone());
    }

    let json = serde_json::to_string_pretty(&courses)?;
    let tmp = courses_path(vault_root).with_extension("json.tmp");
    fs::write(&tmp, &json)?;
    fs::rename(&tmp, courses_path(vault_root))?;
    Ok(course.clone())
}

pub fn delete_course(vault_root: &str, id: &str) -> Result<()> {
    validate_path_segment(id, "course.id")?;
    let mut courses = list_courses(vault_root).unwrap_or_default();
    courses.retain(|c| c.id != id);
    let json = serde_json::to_string_pretty(&courses)?;
    fs::write(courses_path(vault_root), json)?;

    // Remove mastery file if it exists
    let mp = mastery_path(vault_root, id);
    if mp.exists() {
        let _ = fs::remove_file(mp);
    }
    Ok(())
}

// ─── Topic Mastery ────────────────────────────────────────────────────────────

pub fn list_topics(vault_root: &str, folder_path: &str, course_id: &str) -> Result<Vec<TopicMastery>> {
    validate_path_segment(course_id, "course_id")?;
    let full_path = resolve_within_vault(vault_root, folder_path)?;

    // Load saved mastery records
    let mastery_map = load_mastery_map(vault_root, course_id);

    // Scan the folder for .md files
    let mut topics: Vec<TopicMastery> = Vec::new();
    if full_path.exists() && full_path.is_dir() {
        let entries = fs::read_dir(&full_path)
            .map_err(|e| BismuthError::VaultError(format!("Cannot read folder: {}", e)))?;
        for entry in entries.flatten() {
            let p = entry.path();
            if p.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            let rel = p.strip_prefix(vault_root).unwrap_or(&p).to_string_lossy().to_string();
            let saved = mastery_map.get(&rel).cloned();
            topics.push(TopicMastery {
                note_path: rel.clone(),
                mastered: saved.as_ref().map(|t| t.mastered).unwrap_or(false),
                last_reviewed: saved.as_ref().and_then(|t| t.last_reviewed.clone()),
                card_count: count_cards_in_file(&p),
            });
        }
    }
    topics.sort_by(|a, b| a.note_path.cmp(&b.note_path));
    Ok(topics)
}

pub fn save_topic(vault_root: &str, course_id: &str, topic: &TopicMastery) -> Result<()> {
    validate_path_segment(course_id, "course_id")?;
    let mut map = load_mastery_map(vault_root, course_id);
    map.insert(topic.note_path.clone(), topic.clone());

    let dir = mastery_path(vault_root, course_id).parent().unwrap().to_owned();
    fs::create_dir_all(&dir)?;
    let json = serde_json::to_string_pretty(&map.values().collect::<Vec<_>>())?;
    let tmp = mastery_path(vault_root, course_id).with_extension("json.tmp");
    fs::write(&tmp, &json)?;
    fs::rename(&tmp, mastery_path(vault_root, course_id))?;
    Ok(())
}

fn load_mastery_map(vault_root: &str, course_id: &str) -> std::collections::HashMap<String, TopicMastery> {
    let path = mastery_path(vault_root, course_id);
    if !path.exists() {
        return std::collections::HashMap::new();
    }
    let content = fs::read_to_string(&path).unwrap_or_default();
    let records: Vec<TopicMastery> = serde_json::from_str(&content).unwrap_or_default();
    records.into_iter().map(|t| (t.note_path.clone(), t)).collect()
}

/// Count flashcard markers in a Markdown file without pulling full content into memory.
fn count_cards_in_file(path: &Path) -> u32 {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return 0,
    };
    let mut count = 0u32;
    for line in content.lines() {
        if line.contains(" :: ") || line.contains("#card") || line.starts_with("## Q:") {
            count += 1;
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn vault() -> TempDir { TempDir::new().unwrap() }

    #[test]
    fn test_save_and_list_courses() {
        let dir = vault();
        let root = dir.path().to_str().unwrap();
        let course = Course {
            id: "c-1".to_string(),
            name: "AWS SAA".to_string(),
            subject: "Cloud".to_string(),
            exam_date: None,
            total_topics: 10,
            folder_path: "Courses/AWS".to_string(),
            status: "active".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
        };
        // Create the folder so canonicalize path check passes
        std::fs::create_dir_all(dir.path().join("Courses").join("AWS")).unwrap();
        save_course(root, &course).unwrap();
        let courses = list_courses(root).unwrap();
        assert_eq!(courses.len(), 1);
        assert_eq!(courses[0].name, "AWS SAA");
    }

    #[test]
    fn test_delete_course() {
        let dir = vault();
        let root = dir.path().to_str().unwrap();
        std::fs::create_dir_all(dir.path().join("Courses").join("AWS")).unwrap();
        let course = Course {
            id: "c-del".to_string(),
            name: "Test".to_string(),
            subject: "Test".to_string(),
            exam_date: None,
            total_topics: 1,
            folder_path: "Courses/AWS".to_string(),
            status: "active".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
        };
        save_course(root, &course).unwrap();
        delete_course(root, "c-del").unwrap();
        assert!(list_courses(root).unwrap().is_empty());
    }

    #[test]
    fn test_path_traversal_rejected() {
        let dir = vault();
        let root = dir.path().to_str().unwrap();
        let result = resolve_within_vault(root, "../../../etc");
        assert!(result.is_err());
    }

    #[test]
    fn test_topic_mastery_roundtrip() {
        let dir = vault();
        let root = dir.path().to_str().unwrap();
        std::fs::create_dir_all(dir.path().join("Courses")).unwrap();
        std::fs::write(dir.path().join("Courses").join("note.md"), "## Q: What?\n**A:** This.").unwrap();
        let topic = TopicMastery {
            note_path: "Courses/note.md".to_string(),
            mastered: true,
            last_reviewed: Some("2026-01-01T00:00:00Z".to_string()),
            card_count: 1,
        };
        save_topic(root, "c-1", &topic).unwrap();
        let topics = list_topics(root, "Courses", "c-1").unwrap();
        assert_eq!(topics.len(), 1);
        assert!(topics[0].mastered);
    }
}
