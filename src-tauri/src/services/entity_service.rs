//! Entity service for Portent type system
//!
//! Manages entity types, relationships, and lifecycle states (FR-008, FR-009).

use crate::error::Result;
use crate::services::frontmatter_service::FrontmatterService;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Supported Portent entity types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PortentType {
    Project,
    Area,
    Resource,
    Archive,
    Concept,
    Person,
    Event,
    Task,
    Custom(String),
}

impl PortentType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "Project" => Self::Project,
            "Area" => Self::Area,
            "Resource" => Self::Resource,
            "Archive" => Self::Archive,
            "Concept" => Self::Concept,
            "Person" => Self::Person,
            "Event" => Self::Event,
            "Task" => Self::Task,
            other => Self::Custom(other.to_string()),
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Project => "Project",
            Self::Area => "Area",
            Self::Resource => "Resource",
            Self::Archive => "Archive",
            Self::Concept => "Concept",
            Self::Person => "Person",
            Self::Event => "Event",
            Self::Task => "Task",
            Self::Custom(s) => s.as_str(),
        }
    }
}

/// Lifecycle state for notes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LifecycleState {
    Captured,
    Organized,
    Archived,
}

/// Schema field for type-specific metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataField {
    pub key: String,
    pub label: String,
    pub field_type: String, // "text", "date", "select", "boolean", "number"
    pub required: bool,
    #[serde(default)]
    pub options: Vec<String>, // For "select" type
}

/// Type definition with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeDefinition {
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: String,
    pub default_lifecycle: LifecycleState,
    #[serde(default)]
    pub metadata_schema: Vec<MetadataField>,
}

/// Resolved entity reference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityReference {
    pub path: String,
    pub title: String,
    #[serde(rename = "type")]
    pub entity_type: Option<String>,
}

/// Full resolved entity relationships for a note
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityRelationships {
    #[serde(rename = "type")]
    pub entity_type: Option<String>,
    pub lifecycle: String,
    pub belongs_to: Vec<EntityReference>,
    pub related_to: Vec<EntityReference>,
    /// Circular relationship chains detected (e.g. ["A.md", "B.md", "A.md"])
    #[serde(default)]
    pub circular_warnings: Vec<Vec<String>>,
}

/// Entity service managing types and relationships
pub struct EntityService {
    vault_root: PathBuf,
    type_registry: Vec<TypeDefinition>,
}

impl EntityService {
    /// Create a new EntityService with default types
    pub fn new(vault_root: PathBuf) -> Self {
        let type_registry = Self::default_types();
        Self {
            vault_root,
            type_registry,
        }
    }

    /// Load custom type definitions from `.bismuth/entity-types.json`
    pub fn load_custom_types(&mut self) -> Result<()> {
        let config_path = self.vault_root.join(".bismuth").join("entity-types.json");
        if config_path.exists() {
            let content = fs::read_to_string(&config_path)?;
            let custom_types: Vec<TypeDefinition> = serde_json::from_str(&content)?;
            // Append custom types after defaults
            self.type_registry.extend(custom_types);
        }
        Ok(())
    }

    /// Get type definition by name
    pub fn get_type_definition(&self, type_name: &str) -> Option<&TypeDefinition> {
        self.type_registry.iter().find(|t| t.name == type_name)
    }

    /// Get all registered type definitions
    pub fn get_all_types(&self) -> &[TypeDefinition] {
        &self.type_registry
    }

    /// Resolve entity relationships for a note from its frontmatter
    pub fn get_entity_relationships(&self, note_path: &Path) -> Result<EntityRelationships> {
        let full_path = self.vault_root.join(note_path);
        let content = fs::read_to_string(&full_path)?;

        let (frontmatter, _body) = FrontmatterService::parse(&content)?;

        // Extract type
        let entity_type = frontmatter
            .get("type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Derive lifecycle
        let lifecycle = Self::derive_lifecycle(&frontmatter);

        // Resolve belongs_to references
        let belongs_to = Self::resolve_references(
            &frontmatter,
            "belongs_to",
            &self.vault_root,
        );

        // Resolve related_to references
        let related_to = Self::resolve_references(
            &frontmatter,
            "related_to",
            &self.vault_root,
        );

        // Detect circular relationships
        let circular_warnings = self
            .detect_circular_relationships(note_path)
            .unwrap_or_default();

        Ok(EntityRelationships {
            entity_type,
            lifecycle,
            belongs_to,
            related_to,
            circular_warnings,
        })
    }

    /// Derive lifecycle state from frontmatter values
    fn derive_lifecycle(frontmatter: &std::collections::HashMap<String, serde_json::Value>) -> String {
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

    /// Resolve frontmatter array field to entity references
    fn resolve_references(
        frontmatter: &std::collections::HashMap<String, serde_json::Value>,
        field: &str,
        vault_root: &Path,
    ) -> Vec<EntityReference> {
        let mut refs = Vec::new();
        if let Some(val) = frontmatter.get(field) {
            if let Some(arr) = val.as_array() {
                for item in arr {
                    if let Some(link_text) = item.as_str() {
                        // Strip wikilink syntax if present
                        let clean = link_text
                            .trim_start_matches("[[")
                            .trim_end_matches("]]");
                        let path = format!("{}.md", clean);
                        let title = clean.to_string();
                        let entity_type = Self::read_type_from_note(vault_root, &path);
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

    /// Read the `type` field from a note's frontmatter
    fn read_type_from_note(vault_root: &Path, relative_path: &str) -> Option<String> {
        let full_path = vault_root.join(relative_path);
        let content = fs::read_to_string(&full_path).ok()?;
        let (fm, _) = FrontmatterService::parse(&content).ok()?;
        fm.get("type").and_then(|v| v.as_str()).map(|s| s.to_string())
    }

    /// Detect circular relationships starting from a note path.
    /// Returns a list of circular chains found (e.g., A→B→A).
    pub fn detect_circular_relationships(&self, note_path: &Path) -> Result<Vec<Vec<String>>> {
        let mut cycles: Vec<Vec<String>> = Vec::new();
        let mut visited: Vec<String> = Vec::new();
        let start = note_path.to_string_lossy().to_string();
        Self::find_cycles(&self.vault_root, &start, &mut visited, &mut cycles);
        Ok(cycles)
    }

    /// DFS-based cycle detection through belongs_to relationships
    fn find_cycles(
        vault_root: &Path,
        current: &str,
        visited: &mut Vec<String>,
        cycles: &mut Vec<Vec<String>>,
    ) {
        if visited.contains(&current.to_string()) {
            // Found a cycle
            let cycle_start = visited.iter().position(|s| s == current).unwrap();
            let mut cycle: Vec<String> = visited[cycle_start..].to_vec();
            cycle.push(current.to_string());
            cycles.push(cycle);
            return;
        }

        visited.push(current.to_string());

        // Read the note's belongs_to references
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
                                Self::find_cycles(vault_root, &target, visited, cycles);
                            }
                        }
                    }
                }
            }
        }

        visited.pop();
    }

    /// Default Portent type definitions (delegated to entity_types module)
    fn default_types() -> Vec<TypeDefinition> {
        crate::services::entity_types::default_types()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_test_vault() -> (TempDir, EntityService) {
        let dir = TempDir::new().unwrap();
        let service = EntityService::new(dir.path().to_path_buf());
        (dir, service)
    }

    #[test]
    fn test_get_type_definition() {
        let (_dir, service) = setup_test_vault();
        let def = service.get_type_definition("Project").unwrap();
        assert_eq!(def.name, "Project");
        assert_eq!(def.icon, "folder");
        assert_eq!(def.color, "#6366f1");
    }

    #[test]
    fn test_get_type_definition_not_found() {
        let (_dir, service) = setup_test_vault();
        assert!(service.get_type_definition("NonExistent").is_none());
    }

    #[test]
    fn test_portent_type_from_str() {
        assert_eq!(PortentType::from_str("Project"), PortentType::Project);
        assert_eq!(PortentType::from_str("Custom"), PortentType::Custom("Custom".to_string()));
    }

    #[test]
    fn test_derive_lifecycle() {
        use serde_json::json;
        let mut fm = std::collections::HashMap::new();
        assert_eq!(EntityService::derive_lifecycle(&fm), "captured");

        fm.insert("organized".into(), json!(true));
        assert_eq!(EntityService::derive_lifecycle(&fm), "organized");

        fm.insert("archived".into(), json!(true));
        assert_eq!(EntityService::derive_lifecycle(&fm), "archived");
    }

    #[test]
    fn test_get_entity_relationships() {
        let (dir, service) = setup_test_vault();
        let note_content = "---\ntype: Project\norganized: true\nbelongs_to:\n  - \"[[ParentArea]]\"\nrelated_to:\n  - \"[[OtherNote]]\"\n---\n# Test Note\n\nBody content here.";
        let note_path = dir.path().join("test.md");
        fs::write(&note_path, note_content).unwrap();

        let result = service.get_entity_relationships(Path::new("test.md")).unwrap();
        assert_eq!(result.entity_type, Some("Project".to_string()));
        assert_eq!(result.lifecycle, "organized");
        assert_eq!(result.belongs_to.len(), 1);
        assert_eq!(result.belongs_to[0].title, "ParentArea");
        assert_eq!(result.related_to.len(), 1);
        assert_eq!(result.related_to[0].title, "OtherNote");
    }

    #[test]
    fn test_all_default_types() {
        let (_dir, service) = setup_test_vault();
        let types = service.get_all_types();
        assert_eq!(types.len(), 8);
    }
}
