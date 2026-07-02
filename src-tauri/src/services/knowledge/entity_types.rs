//! Default Portent type definitions
//!
//! Provides the 8 built-in entity types with metadata schemas.

use crate::services::entity_service::{LifecycleState, MetadataField, TypeDefinition};

/// Returns the 8 default Portent type definitions
pub fn default_types() -> Vec<TypeDefinition> {
    vec![
        TypeDefinition {
            name: "Project".into(),
            icon: "folder".into(),
            color: "#6366f1".into(),
            description: "Active project with a defined goal and timeline".into(),
            default_lifecycle: LifecycleState::Captured,
            metadata_schema: vec![
                MetadataField { key: "status".into(), label: "Status".into(), field_type: "select".into(), required: false, options: vec!["active".into(), "on-hold".into(), "completed".into()] },
                MetadataField { key: "due_date".into(), label: "Due Date".into(), field_type: "date".into(), required: false, options: vec![] },
            ],
        },
        TypeDefinition {
            name: "Area".into(),
            icon: "layers".into(),
            color: "#8b5cf6".into(),
            description: "Area of responsibility maintained over time".into(),
            default_lifecycle: LifecycleState::Organized,
            metadata_schema: vec![],
        },
        TypeDefinition {
            name: "Resource".into(),
            icon: "book".into(),
            color: "#06b6d4".into(),
            description: "Topic or theme of ongoing interest".into(),
            default_lifecycle: LifecycleState::Organized,
            metadata_schema: vec![],
        },
        TypeDefinition {
            name: "Archive".into(),
            icon: "archive".into(),
            color: "#6b7280".into(),
            description: "Inactive items from other categories".into(),
            default_lifecycle: LifecycleState::Archived,
            metadata_schema: vec![],
        },
        TypeDefinition {
            name: "Concept".into(),
            icon: "lightbulb".into(),
            color: "#f59e0b".into(),
            description: "Atomic idea or concept note".into(),
            default_lifecycle: LifecycleState::Captured,
            metadata_schema: vec![],
        },
        TypeDefinition {
            name: "Person".into(),
            icon: "user".into(),
            color: "#10b981".into(),
            description: "Person or contact".into(),
            default_lifecycle: LifecycleState::Organized,
            metadata_schema: vec![
                MetadataField { key: "email".into(), label: "Email".into(), field_type: "text".into(), required: false, options: vec![] },
            ],
        },
        TypeDefinition {
            name: "Event".into(),
            icon: "calendar".into(),
            color: "#ef4444".into(),
            description: "Time-bound event or occurrence".into(),
            default_lifecycle: LifecycleState::Captured,
            metadata_schema: vec![
                MetadataField { key: "event_date".into(), label: "Date".into(), field_type: "date".into(), required: true, options: vec![] },
                MetadataField { key: "location".into(), label: "Location".into(), field_type: "text".into(), required: false, options: vec![] },
            ],
        },
        TypeDefinition {
            name: "Task".into(),
            icon: "check-square".into(),
            color: "#f97316".into(),
            description: "Actionable task or to-do item".into(),
            default_lifecycle: LifecycleState::Captured,
            metadata_schema: vec![
                MetadataField { key: "priority".into(), label: "Priority".into(), field_type: "select".into(), required: false, options: vec!["high".into(), "medium".into(), "low".into()] },
                MetadataField { key: "due_date".into(), label: "Due Date".into(), field_type: "date".into(), required: false, options: vec![] },
                MetadataField { key: "done".into(), label: "Done".into(), field_type: "boolean".into(), required: false, options: vec![] },
            ],
        },
    ]
}
