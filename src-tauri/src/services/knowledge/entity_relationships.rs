//! Entity relationship resolution and cycle detection.

use crate::error::Result;
use crate::services::frontmatter_service::FrontmatterService;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use super::entity_service::{EntityReference, EntityRelationships};

/// Resolve entity relationships for a note from its frontmatter.
pub fn resolve_relationships(
    vault_root: &Path,
    note_path: &Path,
) -> Result<EntityRelationships> {
    let full_path = vault_root.join(note_path);
    let content = fs::read_to_string(&full_path)?;

    let (frontmatter, _body) = FrontmatterService::parse(&content)?;

    let entity_type = frontmatter
        .get("type")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let lifecycle = derive_lifecycle(&frontmatter);
    let belongs_to = resolve_references(&frontmatter, "belongs_to", vault_root);
    let related_to = resolve_references(&frontmatter, "related_to", vault_root);

    let circular_warnings = detect_circular_relationships(vault_root, note_path)
        .unwrap_or_default();

    Ok(EntityRelationships {
        entity_type,
        lifecycle,
        belongs_to,
        related_to,
        circular_warnings,
    })
}

/// Derive lifecycle state from frontmatter values.
pub(super) fn derive_lifecycle(frontmatter: &HashMap<String, serde_json::Value>) -> String {
    if let Some(val) = frontmatter.get("archived") {
        if val.as_bool().unwrap_or(false) {
            return "archived".to_string();
        }
    }
    if let Some(val) = frontmatter.get("organized") {
        if val.as_bool().unwrap_or(false) {
            return "organized".to_string();
        }
    }
    "captured".to_string()
}

/// Resolve frontmatter array field to entity references.
fn resolve_references(
    frontmatter: &HashMap<String, serde_json::Value>,
    field: &str,
    vault_root: &Path,
) -> Vec<EntityReference> {
    let mut refs = Vec::new();
    if let Some(val) = frontmatter.get(field) {
        if let Some(arr) = val.as_array() {
            for item in arr {
                if let Some(link_text) = item.as_str() {
                    let clean = link_text
                        .trim_start_matches("[[")
                        .trim_end_matches("]]");
                    let path = format!("{}.md", clean);
                    let title = clean.to_string();
                    let entity_type = read_type_from_note(vault_root, &path);
                    refs.push(EntityReference {
                        path,
                        title,
                        entity_type,
                    });
                }
            }
        }
    }
    refs
}

/// Read the `type` field from a note's frontmatter.
fn read_type_from_note(vault_root: &Path, relative_path: &str) -> Option<String> {
    let full_path = vault_root.join(relative_path);
    let content = fs::read_to_string(&full_path).ok()?;
    let (fm, _) = FrontmatterService::parse(&content).ok()?;
    fm.get("type").and_then(|v| v.as_str()).map(|s| s.to_string())
}

/// Detect circular relationships starting from a note path.
fn detect_circular_relationships(vault_root: &Path, note_path: &Path) -> Result<Vec<Vec<String>>> {
    let mut cycles: Vec<Vec<String>> = Vec::new();
    let mut visited: Vec<String> = Vec::new();
    let start = note_path.to_string_lossy().to_string();
    find_cycles(vault_root, &start, &mut visited, &mut cycles);
    Ok(cycles)
}

/// DFS-based cycle detection through belongs_to relationships.
fn find_cycles(
    vault_root: &Path,
    current: &str,
    visited: &mut Vec<String>,
    cycles: &mut Vec<Vec<String>>,
) {
    if visited.contains(&current.to_string()) {
        let cycle_start = visited.iter().position(|s| s == current).unwrap();
        let mut cycle: Vec<String> = visited[cycle_start..].to_vec();
        cycle.push(current.to_string());
        cycles.push(cycle);
        return;
    }

    visited.push(current.to_string());

    let full_path = vault_root.join(current);
    if let Ok(content) = fs::read_to_string(&full_path) {
        if let Ok((fm, _)) = FrontmatterService::parse(&content) {
            if let Some(val) = fm.get("belongs_to") {
                if let Some(arr) = val.as_array() {
                    for item in arr {
                        if let Some(link) = item.as_str() {
                            let clean = link
                                .trim_start_matches("[[")
                                .trim_end_matches("]]");
                            let target = format!("{}.md", clean);
                            find_cycles(vault_root, &target, visited, cycles);
                        }
                    }
                }
            }
        }
    }

    visited.pop();
}
