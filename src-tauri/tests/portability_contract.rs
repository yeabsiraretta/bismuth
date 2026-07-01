//! Integration tests: Data Portability Contract (010)
//!
//! Validates the full portability contract:
//! - Notes with standardized frontmatter survive without DB
//! - Canvas data roundtrips through .canvas files
//! - Components roundtrip through .md files
//! - Backward compatibility with legacy formats

use bismuth::services::frontmatter_migration;
use bismuth::services::frontmatter_service::{FrontmatterService, LifecycleState};
use bismuth::services::canvas_service::canvas_file;
use bismuth::services::canvas_service::component_file;
use bismuth::models::canvas::{CanvasDocument, CanvasElement, ElementType};
use bismuth::commands::design::component::{ComponentDefinition, ComponentProp};
use serde_json::Value;

// ─── T018: Vault Portability Contract ───────────────────────────────────────

#[test]
fn test_notes_use_standard_frontmatter() {
    let content = "---\ntitle: \"Test Note\"\ncreated: 2026-01-01T00:00:00Z\nmodified: 2026-01-01T00:00:00Z\ntags: [rust, portability]\naliases: []\nbismuth:\n  lifecycle: captured\n  captured_at: 2026-01-01T00:00:00Z\n---\n\n# Test Note\n\nContent here.\n";

    let (frontmatter, body) = FrontmatterService::parse(content).unwrap();

    // Standard fields accessible
    assert_eq!(frontmatter.get("title").unwrap().as_str().unwrap(), "Test Note");
    assert!(frontmatter.contains_key("created"));
    assert!(frontmatter.contains_key("modified"));
    assert!(frontmatter.contains_key("tags"));

    // Bismuth namespace accessible
    let lifecycle = FrontmatterService::get_lifecycle_state(&frontmatter);
    assert!(matches!(lifecycle, LifecycleState::Captured));

    // Body preserved
    assert!(body.contains("# Test Note"));
}

#[test]
fn test_canvas_survives_without_db() {
    let tmp = tempfile::TempDir::new().unwrap();
    let canvas_path = tmp.path().join("test.canvas");

    // Create canvas with elements
    let mut canvas = CanvasDocument::new("Portable Canvas".to_string());
    let layer_id = canvas.layers[0].id.clone();

    for i in 0..10 {
        let el = CanvasElement::new_rectangle(
            i as f64 * 50.0,
            i as f64 * 30.0,
            100.0,
            60.0,
            layer_id.clone(),
        );
        canvas.add_element(el);
    }

    // Write to file
    canvas_file::write_canvas_file(&canvas_path, &canvas).unwrap();
    assert!(canvas_path.exists());

    // Read back (simulates DB-less recovery)
    let recovered = canvas_file::read_canvas_file(&canvas_path).unwrap();
    assert_eq!(recovered.elements.len(), 10);
    assert_eq!(recovered.elements[0].x, 0.0);
    assert_eq!(recovered.elements[9].x, 450.0);
}

#[test]
fn test_components_as_markdown() {
    let tmp = tempfile::TempDir::new().unwrap();
    let comp_path = tmp.path().join("btn-primary.md");

    let component = ComponentDefinition {
        id: "btn-primary".to_string(),
        name: "Primary Button".to_string(),
        description: Some("Standard primary button".to_string()),
        category: Some("buttons".to_string()),
        elements: vec![serde_json::json!({
            "id": "bg",
            "type": "rectangle",
            "width": 200,
            "height": 48,
            "fill": "#0066ff"
        })],
        exposed_props: vec![ComponentProp {
            key: "label".to_string(),
            label: "Button Label".to_string(),
            prop_type: "string".to_string(),
            default_value: Value::String("Click".to_string()),
        }],
        width: 200.0,
        height: 48.0,
        thumbnail: None,
        tags: Some(vec!["ui".to_string()]),
        created_at: 1718000000,
        modified_at: 1718000000,
    };

    component_file::write_component_md(&comp_path, &component).unwrap();
    let recovered = component_file::read_component_md(&comp_path).unwrap();

    assert_eq!(recovered.id, "btn-primary");
    assert_eq!(recovered.name, "Primary Button");
    assert_eq!(recovered.elements.len(), 1);
    assert_eq!(recovered.width, 200.0);
}

// ─── T019: Frontmatter Backward Compatibility ───────────────────────────────

#[test]
fn test_legacy_format_readable() {
    // Old format with flat boolean fields
    let legacy = "---\ntitle: Old Note\ncreated: 2025-01-01T00:00:00Z\norganized: true\narchived: false\n---\nLegacy content";

    let (frontmatter, _) = FrontmatterService::parse(legacy).unwrap();
    let state = FrontmatterService::get_lifecycle_state(&frontmatter);
    assert!(matches!(state, LifecycleState::Organized));
}

#[test]
fn test_migration_adds_namespace_preserves_old() {
    let legacy = "---\ntitle: Old Note\ncreated: 2025-01-01T00:00:00Z\norganized: true\narchived: false\n---\nContent";

    let migrated = frontmatter_migration::migrate_note(legacy).unwrap();

    // New format present
    assert!(migrated.contains("lifecycle"));

    // Old fields preserved (backward compat with other tools)
    assert!(migrated.contains("organized"));

    // Standard fields added
    assert!(migrated.contains("tags"));
    assert!(migrated.contains("aliases"));
}

#[test]
fn test_new_format_preferred_over_legacy() {
    // Note has BOTH old and new format (post-migration state)
    let content = "---\ntitle: Mixed\norganized: true\narchived: false\nbismuth:\n  lifecycle: archived\n---\nBody";

    let (frontmatter, _) = FrontmatterService::parse(content).unwrap();
    let state = FrontmatterService::get_lifecycle_state(&frontmatter);

    // New format should win
    assert!(matches!(state, LifecycleState::Archived));
}

#[test]
fn test_already_migrated_notes_unchanged() {
    let new_format = "---\ntitle: New Note\ncreated: 2026-01-01T00:00:00Z\nbismuth:\n  lifecycle: captured\n---\nContent";

    let result = frontmatter_migration::migrate_note(new_format).unwrap();
    // Should be unchanged (no migration needed)
    assert_eq!(result, new_format);
}

// ─── T020: Canvas Roundtrip Fidelity ────────────────────────────────────────

#[test]
fn test_complex_canvas_roundtrip() {
    let tmp = tempfile::TempDir::new().unwrap();
    let canvas_path = tmp.path().join("complex.canvas");

    let mut canvas = CanvasDocument::new("Complex Canvas".to_string());
    let layer_id = canvas.layers[0].id.clone();

    // Add 50 elements of various types
    for i in 0..20 {
        let el = CanvasElement::new_rectangle(
            i as f64 * 25.0,
            i as f64 * 15.0,
            100.0 + i as f64,
            50.0 + i as f64,
            layer_id.clone(),
        );
        canvas.add_element(el);
    }

    for i in 0..15 {
        let mut el = CanvasElement::new_rectangle(
            500.0 + i as f64 * 10.0,
            i as f64 * 20.0,
            80.0,
            80.0,
            layer_id.clone(),
        );
        el.element_type = ElementType::Circle;
        canvas.add_element(el);
    }

    for i in 0..15 {
        let mut el = CanvasElement::new_rectangle(
            0.0,
            500.0 + i as f64 * 30.0,
            200.0,
            100.0,
            layer_id.clone(),
        );
        el.element_type = ElementType::Text;
        el.properties.insert("text".to_string(), Value::String(format!("Text block {}", i)));
        canvas.add_element(el);
    }

    assert_eq!(canvas.elements.len(), 50);

    // Write to file
    canvas_file::write_canvas_file(&canvas_path, &canvas).unwrap();

    // Read back
    let recovered = canvas_file::read_canvas_file(&canvas_path).unwrap();

    // Verify zero data loss
    assert_eq!(recovered.elements.len(), 50);

    // Verify position/size fidelity
    assert_eq!(recovered.elements[0].x, 0.0);
    assert_eq!(recovered.elements[0].y, 0.0);
    assert_eq!(recovered.elements[19].width, 119.0);
    assert_eq!(recovered.elements[19].height, 69.0);

    // Verify type preservation via bismuth extension
    // Text elements should have text property preserved
    let text_el = &recovered.elements[35];
    assert!(text_el.properties.contains_key("text"));
}

#[test]
fn test_canvas_file_is_standard_json() {
    let tmp = tempfile::TempDir::new().unwrap();
    let canvas_path = tmp.path().join("standard.canvas");

    let mut canvas = CanvasDocument::new("Standard".to_string());
    let layer_id = canvas.layers[0].id.clone();
    canvas.add_element(CanvasElement::new_rectangle(0.0, 0.0, 100.0, 50.0, layer_id));

    canvas_file::write_canvas_file(&canvas_path, &canvas).unwrap();

    // File should be valid JSON parseable by any tool
    let raw = std::fs::read_to_string(&canvas_path).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&raw).unwrap();

    // JSON Canvas spec requires "nodes" and "edges" top-level keys
    assert!(parsed.get("nodes").is_some());
    assert!(parsed.get("edges").is_some());

    // Nodes should have standard fields
    let nodes = parsed["nodes"].as_array().unwrap();
    assert_eq!(nodes.len(), 1);
    assert!(nodes[0].get("id").is_some());
    assert!(nodes[0].get("type").is_some());
    assert!(nodes[0].get("x").is_some());
    assert!(nodes[0].get("y").is_some());
    assert!(nodes[0].get("width").is_some());
    assert!(nodes[0].get("height").is_some());
}
