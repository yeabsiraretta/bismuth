//! Filesystem helper utilities for JSON file I/O.

use crate::error::{BismuthError, Result};
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fs;
use std::path::Path;

/// Reads a JSON file and deserializes it into the specified type.
///
/// # Errors
///
/// Returns `BismuthError::IoError` if the file cannot be read, or
/// `BismuthError::JsonError` if deserialization fails.
pub fn read_json_file<T: DeserializeOwned>(path: &Path) -> Result<T> {
    let content = fs::read_to_string(path)?;
    let value: T = serde_json::from_str(&content)?;
    Ok(value)
}

/// Reads a JSON file, returning `T::default()` if the file does not exist.
///
/// Other errors (permission denied, invalid JSON) are propagated.
pub fn read_json_file_or_default<T: DeserializeOwned + Default>(path: &Path) -> Result<T> {
    match fs::read_to_string(path) {
        Ok(content) => {
            let value: T = serde_json::from_str(&content)?;
            Ok(value)
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(T::default()),
        Err(e) => Err(BismuthError::IoError(e)),
    }
}

/// Serializes a value to pretty JSON and writes it to a file atomically.
///
/// Writes to a `.tmp` sibling file first, then renames to the target path.
/// This prevents partial writes from corrupting the file.
///
/// # Errors
///
/// Returns `BismuthError::JsonError` on serialization failure, or
/// `BismuthError::IoError` on filesystem errors.
pub fn write_json_file<T: Serialize>(path: &Path, data: &T) -> Result<()> {
    let json = serde_json::to_string_pretty(data)?;

    // Atomic write: write to tmp then rename
    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, json.as_bytes())?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use tempfile::TempDir;

    #[derive(Debug, Serialize, Deserialize, PartialEq, Default)]
    struct TestData {
        name: String,
        count: u32,
    }

    #[test]
    fn roundtrip_json_file() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("test.json");
        let data = TestData { name: "hello".into(), count: 42 };
        write_json_file(&path, &data).unwrap();
        let loaded: TestData = read_json_file(&path).unwrap();
        assert_eq!(loaded, data);
    }

    #[test]
    fn read_missing_returns_default() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("nonexistent.json");
        let loaded: TestData = read_json_file_or_default(&path).unwrap();
        assert_eq!(loaded, TestData::default());
    }

    #[test]
    fn read_invalid_json_errors() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("bad.json");
        fs::write(&path, "not json at all").unwrap();
        let result: Result<HashMap<String, String>> = read_json_file(&path);
        assert!(result.is_err());
    }
}
