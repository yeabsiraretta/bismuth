//! Error types for Bismuth PKM Editor
//!
//! Centralized error handling using thiserror for better error messages
//! and automatic From trait implementations.

use thiserror::Error;

/// Main error type for Bismuth operations
#[derive(Debug, Error)]
pub enum BismuthError {
    /// IO errors (file read/write, directory operations)
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// Parse errors (frontmatter, markdown, JSON)
    #[error("Parse error: {0}")]
    ParseError(String),

    /// Index/search errors
    #[error("Index error: {0}")]
    IndexError(String),

    /// Resource not found errors
    #[error("Not found: {0}")]
    NotFound(String),

    /// Invalid path errors (path traversal, non-existent)
    #[error("Invalid path: {0}")]
    InvalidPath(String),

    /// Database errors
    #[error("Database error: {0}")]
    DatabaseError(#[from] rusqlite::Error),

    /// YAML parsing errors
    #[error("YAML error: {0}")]
    YamlError(String),

    /// JSON serialization errors
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// Watcher/notification errors
    #[error("Watcher error: {0}")]
    WatcherError(String),

    /// Configuration errors
    #[error("Config error: {0}")]
    ConfigError(String),

    /// Vault errors (invalid vault, not initialized)
    #[error("Vault error: {0}")]
    VaultError(String),

    /// Generic errors (catch-all for service-specific errors)
    #[error("{0}")]
    Generic(String),
}

// Implement From for serde_yaml::Error
impl From<serde_yaml::Error> for BismuthError {
    fn from(err: serde_yaml::Error) -> Self {
        BismuthError::YamlError(err.to_string())
    }
}

// Implement From for notify::Error
impl From<notify::Error> for BismuthError {
    fn from(err: notify::Error) -> Self {
        BismuthError::WatcherError(err.to_string())
    }
}

// Implement From for tantivy errors
impl From<tantivy::TantivyError> for BismuthError {
    fn from(err: tantivy::TantivyError) -> Self {
        BismuthError::IndexError(err.to_string())
    }
}

impl From<tantivy::query::QueryParserError> for BismuthError {
    fn from(err: tantivy::query::QueryParserError) -> Self {
        BismuthError::IndexError(err.to_string())
    }
}

/// Result type alias for Bismuth operations
pub type Result<T> = std::result::Result<T, BismuthError>;

// Implement Serialize for BismuthError to work with Tauri IPC
impl serde::Serialize for BismuthError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = BismuthError::NotFound("test.md".to_string());
        assert_eq!(err.to_string(), "Not found: test.md");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let bismuth_err: BismuthError = io_err.into();
        assert!(matches!(bismuth_err, BismuthError::IoError(_)));
    }

    #[test]
    fn test_json_error_conversion() {
        let json_str = "invalid json";
        let json_err = serde_json::from_str::<serde_json::Value>(json_str).unwrap_err();
        let bismuth_err: BismuthError = json_err.into();
        assert!(matches!(bismuth_err, BismuthError::JsonError(_)));
    }
}
