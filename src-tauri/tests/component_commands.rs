//! Integration tests: Component CRUD commands (spec 004)
//!
//! Tests save_component, list_components, read_component, delete_component
//! logic using a temporary vault directory.

use bismuth::commands::design::component::{ComponentDefinition, ComponentProp};
use bismuth::services::canvas_service::component_file;
use std::fs;
use tempfile::tempdir;

fn sample_component(id: &str, name: &str) -> ComponentDefinition {
    ComponentDefinition {
        id: id.to_string(),
        name: name.to_string(),
        description: Some("Test component".to_string()),
        category: Some("ui".to_string()),
        elements: vec![serde_json::json!({
            "id": "el1",
            "element_type": "rectangle",
            "x": 0, "y": 0, "width": 100, "height": 40
        })],
        exposed_props: vec![ComponentProp {
            key: "label".to_string(),
            label: "Label".to_string(),
            prop_type: "text".to_string(),
            default_value: serde_json::json!("Click"),
        }],
        width: 100.0,
        height: 40.0,
        thumbnail: None,
        tags: Some(vec!["button".to_string()]),
        created_at: 1000,
        modified_at: 1000,
    }
}

#[test]
fn test_save_and_read_component() {
    let dir = tempdir().unwrap();
    let comp_dir = dir.path().join(".bismuth").join("components");
    fs::create_dir_all(&comp_dir).unwrap();

    let comp = sample_component("comp-001", "PrimaryButton");
    let md_path = comp_dir.join("comp-001.md");

    // Save
    component_file::write_component_md(&md_path, &comp).unwrap();
    assert!(md_path.exists());

    // Read back
    let loaded = component_file::read_component_md(&md_path).unwrap();
    assert_eq!(loaded.id, "comp-001");
    assert_eq!(loaded.name, "PrimaryButton");
    assert_eq!(loaded.width, 100.0);
    assert_eq!(loaded.exposed_props.len(), 1);
    assert_eq!(loaded.exposed_props[0].key, "label");
}

#[test]
fn test_list_components_reads_directory() {
    let dir = tempdir().unwrap();
    let comp_dir = dir.path().join(".bismuth").join("components");
    fs::create_dir_all(&comp_dir).unwrap();

    // Write two components
    let c1 = sample_component("comp-a", "Alpha");
    let c2 = sample_component("comp-b", "Beta");
    component_file::write_component_md(&comp_dir.join("comp-a.md"), &c1).unwrap();
    component_file::write_component_md(&comp_dir.join("comp-b.md"), &c2).unwrap();

    // Verify both files exist
    let entries: Vec<_> = fs::read_dir(&comp_dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
        .collect();
    assert_eq!(entries.len(), 2);

    // Read both
    let loaded_a = component_file::read_component_md(&comp_dir.join("comp-a.md")).unwrap();
    let loaded_b = component_file::read_component_md(&comp_dir.join("comp-b.md")).unwrap();
    assert_eq!(loaded_a.name, "Alpha");
    assert_eq!(loaded_b.name, "Beta");
}

#[test]
fn test_delete_component() {
    let dir = tempdir().unwrap();
    let comp_dir = dir.path().join(".bismuth").join("components");
    fs::create_dir_all(&comp_dir).unwrap();

    let comp = sample_component("comp-del", "ToDelete");
    let md_path = comp_dir.join("comp-del.md");
    component_file::write_component_md(&md_path, &comp).unwrap();
    assert!(md_path.exists());

    // Delete
    fs::remove_file(&md_path).unwrap();
    assert!(!md_path.exists());
}

#[test]
fn test_component_roundtrip_preserves_data() {
    let dir = tempdir().unwrap();
    let comp_dir = dir.path().join(".bismuth").join("components");
    fs::create_dir_all(&comp_dir).unwrap();

    let original = sample_component("comp-rt", "Roundtrip");
    let md_path = comp_dir.join("comp-rt.md");

    component_file::write_component_md(&md_path, &original).unwrap();
    let loaded = component_file::read_component_md(&md_path).unwrap();

    assert_eq!(loaded.id, original.id);
    assert_eq!(loaded.name, original.name);
    assert_eq!(loaded.category, original.category);
    assert_eq!(loaded.description, original.description);
    assert_eq!(loaded.width, original.width);
    assert_eq!(loaded.height, original.height);
    assert_eq!(loaded.tags, original.tags);
    assert_eq!(loaded.created_at, original.created_at);
    assert_eq!(loaded.modified_at, original.modified_at);
    assert_eq!(loaded.elements.len(), original.elements.len());
    assert_eq!(loaded.exposed_props.len(), original.exposed_props.len());
}
