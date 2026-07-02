//! Default value implementations for settings types.
//!
//! Extracted from `settings.rs` to keep that file under the 300-line limit.

use super::settings::{AdvancedSettings, EditorSettings, LayoutSettings, PerformanceSettings};

impl Default for EditorSettings {
    fn default() -> Self {
        Self {
            auto_save_delay_ms: 500,
            enable_auto_save: true,
            tab_size: 2,
            use_spaces: true,
            line_wrap_column: 0,
            show_line_numbers: true,
            enable_spell_check: true,
        }
    }
}

impl Default for LayoutSettings {
    fn default() -> Self {
        Self {
            left_sidebar_width: 300,
            right_sidebar_width: 300,
            left_sidebar_visible: true,
            right_sidebar_visible: true,
            theme: "default".to_string(),
            font_family: "Inter".to_string(),
            font_size: 14,
        }
    }
}

impl Default for PerformanceSettings {
    fn default() -> Self {
        Self {
            max_search_results: 100,
            search_timeout_ms: 200,
            enable_size_warnings: true,
            file_size_warning_bytes: 10_000_000,
            max_history_entries: 100,
        }
    }
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            enable_crash_recovery: true,
            enable_edit_history: true,
            enable_depth_warnings: true,
            max_directory_depth: 10,
            db_pool_size: 5,
            enable_wal_mode: true,
            log_level: "info".to_string(),
            log_max_size_bytes: 10_485_760,
            log_retention_count: 5,
        }
    }
}
