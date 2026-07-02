//! Note lifecycle state management via frontmatter.

use super::FrontmatterService;
use crate::error::Result;
use serde_json::Value;
use std::collections::HashMap;

/// Lifecycle states for notes in the capture pipeline
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum LifecycleState {
    /// Note has no organization — lives in inbox
    Captured,
    /// Note has been classified and organized
    Organized,
    /// Note is archived and hidden from default views
    Archived,
}

impl FrontmatterService {
    /// Determines the lifecycle state of a note from its frontmatter.
    ///
    /// Checks `bismuth.lifecycle` first (new format), falls back to
    /// legacy `organized`/`archived` booleans (old format).
    pub fn get_lifecycle_state(frontmatter: &HashMap<String, Value>) -> LifecycleState {
        // New format: bismuth.lifecycle enum
        if let Some(state_str) = Self::get_bismuth_field(frontmatter, "lifecycle")
            .and_then(|v| v.as_str())
        {
            return match state_str {
                "archived" => LifecycleState::Archived,
                "organized" => LifecycleState::Organized,
                _ => LifecycleState::Captured,
            };
        }

        // Legacy format: flat boolean fields
        let archived = frontmatter
            .get("archived")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let organized = frontmatter
            .get("organized")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if archived {
            LifecycleState::Archived
        } else if organized {
            LifecycleState::Organized
        } else {
            LifecycleState::Captured
        }
    }

    /// Returns true if the note is in the "captured" (inbox) state
    pub fn is_captured(frontmatter: &HashMap<String, Value>) -> bool {
        matches!(Self::get_lifecycle_state(frontmatter), LifecycleState::Captured)
    }

    /// Returns true if the note is archived
    pub fn is_archived(frontmatter: &HashMap<String, Value>) -> bool {
        matches!(Self::get_lifecycle_state(frontmatter), LifecycleState::Archived)
    }

    /// Sets the lifecycle state using the new `bismuth.lifecycle` enum format.
    pub fn set_lifecycle(frontmatter: &mut HashMap<String, Value>, state: &LifecycleState) {
        let state_str = match state {
            LifecycleState::Captured => "captured",
            LifecycleState::Organized => "organized",
            LifecycleState::Archived => "archived",
        };
        Self::set_bismuth_field(frontmatter, "lifecycle", Value::String(state_str.to_string()));
    }

    /// Sets the `organized` field on frontmatter (legacy format, kept for backward compat)
    pub fn set_organized(frontmatter: &mut HashMap<String, Value>, organized: bool) {
        frontmatter.insert("organized".to_string(), Value::Bool(organized));
    }

    /// Sets the `archived` field on frontmatter (legacy format, kept for backward compat)
    pub fn set_archived(frontmatter: &mut HashMap<String, Value>, archived: bool) {
        frontmatter.insert("archived".to_string(), Value::Bool(archived));
    }

    /// Archives a note by setting `bismuth.lifecycle: archived`.
    ///
    /// Returns the updated full content string.
    pub fn archive_note_content(content: &str) -> Result<String> {
        let (mut frontmatter, body) = Self::parse(content)?;
        Self::set_lifecycle(&mut frontmatter, &LifecycleState::Archived);
        Self::serialize(&frontmatter, &body)
    }

    /// Marks a note as organized by setting `bismuth.lifecycle: organized`.
    ///
    /// Returns the updated full content string.
    pub fn organize_note_content(content: &str) -> Result<String> {
        let (mut frontmatter, body) = Self::parse(content)?;
        Self::set_lifecycle(&mut frontmatter, &LifecycleState::Organized);
        Self::serialize(&frontmatter, &body)
    }
}
