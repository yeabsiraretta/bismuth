//! Frontmatter migration service
//!
//! Converts notes from legacy flat-field format (organized/archived booleans)
//! to the new `bismuth.lifecycle` namespaced format.
//! Non-destructive: old fields are preserved for backward compatibility.

use crate::error::Result;
use super::FrontmatterService;
use serde_json::Value;
use std::collections::HashMap;

/// Checks if a note's frontmatter needs migration to the new schema.
///
/// Returns true if legacy flat fields exist without a `bismuth` namespace.
pub fn needs_migration(frontmatter: &HashMap<String, Value>) -> bool {
    let has_legacy = frontmatter.contains_key("organized") || frontmatter.contains_key("archived");
    let has_bismuth = frontmatter.contains_key("bismuth");
    has_legacy && !has_bismuth
}

/// Migrates a note's full content from legacy to new schema.
///
/// Reads the content, parses frontmatter, adds `bismuth.lifecycle` field
/// based on existing `organized`/`archived` values, adds missing standard
/// fields (`modified`, `tags`, `aliases`), then re-serializes.
///
/// Old fields (`organized`, `archived`) are NOT removed for backward compat.
pub fn migrate_note(content: &str) -> Result<String> {
    let (mut frontmatter, body) = FrontmatterService::parse(content)?;

    if !needs_migration(&frontmatter) {
        return Ok(content.to_string());
    }

    // Determine lifecycle from legacy fields
    let state = FrontmatterService::get_lifecycle_state(&frontmatter);
    FrontmatterService::set_lifecycle(&mut frontmatter, &state);

    // Add captured_at from created if available
    if let Some(created) = frontmatter.get("created").cloned() {
        if FrontmatterService::get_bismuth_field(&frontmatter, "captured_at").is_none() {
            FrontmatterService::set_bismuth_field(&mut frontmatter, "captured_at", created);
        }
    }

    // Add missing standard fields
    if !frontmatter.contains_key("modified") {
        if let Some(created) = frontmatter.get("created").cloned() {
            frontmatter.insert("modified".to_string(), created);
        }
    }
    if !frontmatter.contains_key("tags") {
        frontmatter.insert("tags".to_string(), Value::Array(vec![]));
    }
    if !frontmatter.contains_key("aliases") {
        frontmatter.insert("aliases".to_string(), Value::Array(vec![]));
    }

    FrontmatterService::serialize(&frontmatter, &body)
}

/// Batch-migrates all notes in a list of (path, content) pairs.
/// Returns the count of notes that were actually migrated.
pub fn migrate_batch(notes: &[(std::path::PathBuf, String)]) -> Result<usize> {
    let mut migrated = 0;

    for (path, content) in notes {
        let (frontmatter, _) = FrontmatterService::parse(content)?;
        if !needs_migration(&frontmatter) {
            continue;
        }

        let new_content = migrate_note(content)?;

        // Atomic write: write to temp file, then rename
        let tmp_path = path.with_extension("md.tmp");
        std::fs::write(&tmp_path, &new_content).map_err(|e| {
            crate::error::BismuthError::VaultError(format!(
                "Failed to write temp file {:?}: {}",
                tmp_path, e
            ))
        })?;
        std::fs::rename(&tmp_path, path).map_err(|e| {
            crate::error::BismuthError::VaultError(format!(
                "Failed to rename {:?} -> {:?}: {}",
                tmp_path, path, e
            ))
        })?;

        migrated += 1;
    }

    Ok(migrated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_needs_migration_legacy_format() {
        let mut fm = HashMap::new();
        fm.insert("organized".to_string(), Value::Bool(true));
        fm.insert("archived".to_string(), Value::Bool(false));
        assert!(needs_migration(&fm));
    }

    #[test]
    fn test_needs_migration_new_format() {
        let mut fm = HashMap::new();
        fm.insert("organized".to_string(), Value::Bool(true));
        let mut bismuth = serde_json::Map::new();
        bismuth.insert("lifecycle".to_string(), Value::String("organized".to_string()));
        fm.insert("bismuth".to_string(), Value::Object(bismuth));
        assert!(!needs_migration(&fm));
    }

    #[test]
    fn test_needs_migration_no_legacy() {
        let mut fm = HashMap::new();
        fm.insert("title".to_string(), Value::String("Test".to_string()));
        assert!(!needs_migration(&fm));
    }

    #[test]
    fn test_migrate_note_legacy_organized() {
        let content = "---\ntitle: Test\ncreated: 2026-01-01T00:00:00Z\norganized: true\narchived: false\n---\nHello";
        let result = migrate_note(content).unwrap();

        // Should contain bismuth.lifecycle
        assert!(result.contains("lifecycle"));
        // Should preserve old fields
        assert!(result.contains("organized"));
        // Should contain body
        assert!(result.contains("Hello"));
    }

    #[test]
    fn test_migrate_note_already_migrated() {
        let content = "---\ntitle: Test\ncreated: 2026-01-01T00:00:00Z\nbismuth:\n  lifecycle: captured\n---\nBody";
        let result = migrate_note(content).unwrap();
        // Should return content unchanged (no migration needed)
        assert_eq!(result, content);
    }

    #[test]
    fn test_migrate_note_no_frontmatter() {
        let content = "# Just a heading\n\nNo frontmatter here.";
        let result = migrate_note(content).unwrap();
        assert_eq!(result, content);
    }

    #[test]
    fn test_migrate_adds_standard_fields() {
        let content = "---\ntitle: Test\ncreated: 2026-01-01T00:00:00Z\norganized: false\narchived: false\n---\nBody";
        let result = migrate_note(content).unwrap();

        // Should add missing standard fields
        assert!(result.contains("tags"));
        assert!(result.contains("aliases"));
    }
}
