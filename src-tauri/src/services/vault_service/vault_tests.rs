//! Tests for VaultService (extracted to keep mod.rs under 400 lines).

use super::*;
use tempfile::tempdir;

#[test]
fn test_create_vault() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    let vault = service.create(vault_path.clone()).unwrap();
    assert_eq!(vault.root_path, vault_path.canonicalize().unwrap());
    assert!(vault_path.join(".bismuth").exists());
    assert!(vault_path.join(".bismuth/canvas").exists());
    assert!(vault_path.join(".bismuth/templates").exists());
    assert!(vault_path.join(".bismuth/recovery").exists());
}

#[test]
fn test_open_vault() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(Arc::clone(&db));
    service.create(vault_path.clone()).unwrap();
    let mut service2 = VaultService::new(db);
    let vault = service2.open(vault_path.clone()).unwrap();
    assert_eq!(vault.root_path, vault_path.canonicalize().unwrap());
}

#[test]
fn test_write_and_get_note() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let note_path = vault_path.join("test.md");
    let content = "# Test Note\n\nThis is a test.";
    service.write_note(&note_path, content).unwrap();
    assert!(note_path.exists());
    let note = service.get_note(&note_path).unwrap();
    assert_eq!(note.title, "test");
    assert_eq!(note.content, content);
}

#[test]
fn test_delete_note() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let note_path = vault_path.join("test.md");
    service.write_note(&note_path, "test").unwrap();
    assert!(note_path.exists());
    service.delete_note(&note_path).unwrap();
    assert!(!note_path.exists());
}

#[test]
fn test_rename_note() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let old_path = vault_path.join("old.md");
    let new_path = vault_path.join("new.md");
    service.write_note(&old_path, "test").unwrap();
    assert!(old_path.exists());
    service.rename_note(&old_path, &new_path).unwrap();
    assert!(!old_path.exists());
    assert!(new_path.exists());
}

#[test]
fn test_path_traversal_protection() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let outside_path = dir.path().join("outside.md");
    let result = service.write_note(&outside_path, "test");
    assert!(result.is_err());
}

#[test]
fn test_duplicate_note_collision() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let note_path = vault_path.join("note.md");
    service.write_note(&note_path, "# Original").unwrap();
    let dup1 = service.duplicate_note(&note_path).unwrap();
    assert!(dup1.path.to_string_lossy().contains("note copy.md"));
    let dup2 = service.duplicate_note(&note_path).unwrap();
    assert!(dup2.path.to_string_lossy().contains("note copy 2.md"));
}

#[test]
fn test_merge_notes_canonicalized_target_preserved() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let target = vault_path.join("target.md");
    let source = vault_path.join("source.md");
    service.write_note(&target, "# Target content").unwrap();
    service.write_note(&source, "# Source content").unwrap();
    let paths = vec![target.clone(), source.clone()];
    service.merge_notes(&paths, &target).unwrap();
    assert!(target.exists());
    assert!(!source.exists());
}

#[test]
fn test_merge_notes_target_no_header() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let target = vault_path.join("target.md");
    let source = vault_path.join("source.md");
    service.write_note(&target, "Target body").unwrap();
    service.write_note(&source, "Source body").unwrap();
    let paths = vec![target.clone(), source.clone()];
    service.merge_notes(&paths, &target).unwrap();
    let content = std::fs::read_to_string(&target).unwrap();
    assert!(!content.starts_with("\n\n---\n\n# From:"));
    assert!(content.starts_with("Target body"));
    assert!(content.contains("# From:"));
    assert!(content.contains("Source body"));
}

#[test]
fn test_list_notes_folder_traversal_blocked() {
    let dir = tempdir().unwrap();
    let vault_path = dir.path().join("test_vault");
    let db_path = dir.path().join("test.db");
    let db = Arc::new(Database::new(&db_path).unwrap());
    let mut service = VaultService::new(db);
    service.create(vault_path.clone()).unwrap();
    let result = service.list_notes_in_folder(&vault_path, "../../../etc");
    assert!(result.is_err());
}
