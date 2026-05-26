/// Application-wide constants
/// 
/// This module contains all configurable constants used throughout the application.
/// Constants are organized by domain and include documentation for their purpose.

use std::time::Duration;

/// File system constraints
pub mod filesystem {
    /// Maximum file size before warning (10MB)
    /// Can be adjusted based on system capabilities
    pub const MAX_FILE_SIZE_BYTES: usize = 10_000_000;

    /// Maximum recommended directory depth
    /// Prevents deeply nested structures that impact performance
    pub const MAX_DIRECTORY_DEPTH: usize = 10;

    /// Default vault directory name
    pub const VAULT_DIR_NAME: &str = ".bismuth";

    /// Subdirectories created in vault
    pub const VAULT_SUBDIRS: &[&str] = &["notes", "templates", "themes", "plugins"];
}

/// Recovery system configuration
pub mod recovery {
    /// Directory for recovery files (relative to vault root)
    pub const RECOVERY_DIR: &str = ".bismuth/recovery";

    /// Recovery file extension
    pub const RECOVERY_FILE_EXT: &str = ".tmp";
}

/// History tracking configuration
pub mod history {
    /// Directory for history files (relative to vault root)
    pub const HISTORY_DIR: &str = ".bismuth/history";

    /// History file extension (JSON Lines format)
    pub const HISTORY_FILE_EXT: &str = ".jsonl";

    /// Maximum history entries to keep per file (0 = unlimited)
    /// Set to limit storage usage
    pub const MAX_HISTORY_ENTRIES: usize = 100;
}

/// UI layout constraints
pub mod layout {
    /// Minimum sidebar width in pixels
    pub const SIDEBAR_MIN_WIDTH: u32 = 200;

    /// Maximum sidebar width in pixels
    pub const SIDEBAR_MAX_WIDTH: u32 = 600;

    /// Default left sidebar width
    pub const SIDEBAR_LEFT_DEFAULT: u32 = 300;

    /// Default right sidebar width
    pub const SIDEBAR_RIGHT_DEFAULT: u32 = 300;
}

/// Editor configuration
pub mod editor {
    /// Auto-save delay in milliseconds
    pub const AUTO_SAVE_DELAY_MS: u64 = 500;

    /// Maximum input latency target (for performance monitoring)
    pub const MAX_INPUT_LATENCY_MS: u64 = 16;

    /// Default tab size
    pub const DEFAULT_TAB_SIZE: u32 = 2;

    /// Line wrap column (0 = no wrap)
    pub const LINE_WRAP_COLUMN: u32 = 0;
}

/// Search configuration
pub mod search {
    /// Maximum search results to return
    pub const MAX_SEARCH_RESULTS: usize = 100;

    /// Search result timeout in milliseconds
    pub const SEARCH_TIMEOUT_MS: u64 = 200;
}

/// Performance targets
pub mod performance {
    /// Target page load time in milliseconds
    pub const TARGET_PAGE_LOAD_MS: u64 = 1000;

    /// Target search response time in milliseconds
    pub const TARGET_SEARCH_MS: u64 = 200;

    /// Graph rendering timeout for large graphs (nodes)
    pub const GRAPH_RENDER_TIMEOUT_NODES: usize = 10_000;

    /// Graph rendering target time in milliseconds
    pub const GRAPH_RENDER_TARGET_MS: u64 = 3000;
}

/// Database configuration
pub mod database {
    /// SQLite connection pool size
    pub const CONNECTION_POOL_SIZE: u32 = 5;

    /// Database busy timeout in milliseconds
    pub const BUSY_TIMEOUT_MS: u64 = 5000;

    /// Enable WAL mode for better concurrency
    pub const ENABLE_WAL_MODE: bool = true;
}

/// Security configuration
pub mod security {
    /// Allowed file extensions for notes
    pub const ALLOWED_NOTE_EXTENSIONS: &[&str] = &["md", "markdown", "txt"];

    /// Maximum path length to prevent path traversal
    pub const MAX_PATH_LENGTH: usize = 4096;

    /// Validate paths are within vault root
    pub const ENFORCE_VAULT_BOUNDARY: bool = true;
}

/// Logging configuration
pub mod logging {
    /// Default log level
    pub const DEFAULT_LOG_LEVEL: &str = "info";

    /// Log file rotation size in bytes (10MB)
    pub const LOG_ROTATION_SIZE: u64 = 10_485_760;

    /// Number of log files to keep
    pub const LOG_RETENTION_COUNT: u32 = 5;
}

/// Network configuration (for future features)
pub mod network {
    /// Request timeout in seconds
    pub const REQUEST_TIMEOUT_SECS: u64 = 30;

    /// Maximum concurrent requests
    pub const MAX_CONCURRENT_REQUESTS: usize = 10;

    /// Retry attempts for failed requests
    pub const MAX_RETRY_ATTEMPTS: u32 = 3;
}

/// Feature flags
pub mod features {
    /// Enable crash recovery
    pub const ENABLE_CRASH_RECOVERY: bool = true;

    /// Enable edit history
    pub const ENABLE_EDIT_HISTORY: bool = true;

    /// Enable file size warnings
    pub const ENABLE_SIZE_WARNINGS: bool = true;

    /// Enable depth warnings
    pub const ENABLE_DEPTH_WARNINGS: bool = true;

    /// Enable auto-save
    pub const ENABLE_AUTO_SAVE: bool = true;
}

/// Validation helpers
pub mod validation {
    use super::*;

    /// Check if file size exceeds limit
    pub fn is_file_too_large(size: usize) -> bool {
        size > filesystem::MAX_FILE_SIZE_BYTES
    }

    /// Check if directory depth exceeds limit
    pub fn is_path_too_deep(depth: usize) -> bool {
        depth > filesystem::MAX_DIRECTORY_DEPTH
    }

    /// Check if file extension is allowed
    pub fn is_extension_allowed(ext: &str) -> bool {
        security::ALLOWED_NOTE_EXTENSIONS.contains(&ext)
    }

    /// Get auto-save delay as Duration
    pub fn auto_save_duration() -> Duration {
        Duration::from_millis(editor::AUTO_SAVE_DELAY_MS)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_size_validation() {
        assert!(!validation::is_file_too_large(1_000_000));
        assert!(validation::is_file_too_large(11_000_000));
    }

    #[test]
    fn test_depth_validation() {
        assert!(!validation::is_path_too_deep(5));
        assert!(validation::is_path_too_deep(15));
    }

    #[test]
    fn test_extension_validation() {
        assert!(validation::is_extension_allowed("md"));
        assert!(validation::is_extension_allowed("markdown"));
        assert!(!validation::is_extension_allowed("exe"));
    }
}
