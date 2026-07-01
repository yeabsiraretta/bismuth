//! Logging and interaction tracking for the Bismuth backend.
//!
//! Two concerns:
//! - `init_logger`: initialises the global `tracing` subscriber (file rotation + console).
//! - `InteractionLog`: an in-memory ring buffer of IPC/user interaction events exposed
//!   via the `/interactions` HTTP endpoint.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::path::PathBuf;
use tracing::Level;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    EnvFilter, Layer, Registry,
};

// ─── Tracing initialisation ────────────────────────────────────────────────────

/// Initialise the global tracing subscriber with file rotation and console output.
pub fn init_logger(log_dir: Option<PathBuf>) -> Result<(), Box<dyn std::error::Error>> {
    let log_path = log_dir.unwrap_or_else(|| {
        let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        path.push(".bismuth");
        path.push("logs");
        path
    });

    std::fs::create_dir_all(&log_path)?;

    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_path, "bismuth.log");

    let file_layer = fmt::layer()
        .with_writer(file_appender)
        .with_ansi(false)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_span_events(FmtSpan::CLOSE)
        .with_filter(EnvFilter::from_default_env().add_directive(Level::DEBUG.into()));

    let console_layer = fmt::layer()
        .with_ansi(true)
        .with_target(false)
        .with_thread_ids(false)
        .with_file(false)
        .with_line_number(false)
        .with_span_events(FmtSpan::NONE)
        .with_filter(
            EnvFilter::from_default_env()
                .add_directive(Level::INFO.into())
                .add_directive("bismuth=debug".parse()?),
        );

    let subscriber = Registry::default().with(file_layer).with(console_layer);
    tracing::subscriber::set_global_default(subscriber)?;
    tracing::info!("Logger initialised. Log directory: {:?}", log_path);
    Ok(())
}

// ─── Interaction log ────────────────────────────────────────────────────────────

/// Severity level for interaction events.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum InteractionLevel {
    Debug,
    Info,
    Warn,
    Error,
}

impl InteractionLevel {
    fn as_str(self) -> &'static str {
        match self {
            Self::Debug => "DEBUG",
            Self::Info => "INFO",
            Self::Warn => "WARN",
            Self::Error => "ERROR",
        }
    }
}

/// A single recorded interaction event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionEntry {
    pub timestamp: DateTime<Utc>,
    pub level: InteractionLevel,
    /// Category: "ipc", "vault", "search", "system", etc.
    pub category: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// In-memory ring buffer of recent interaction events (max 500 entries).
pub struct InteractionLog {
    entries: VecDeque<InteractionEntry>,
    capacity: usize,
}

impl Default for InteractionLog {
    fn default() -> Self {
        Self {
            entries: VecDeque::new(),
            capacity: 500,
        }
    }
}

impl InteractionLog {
    pub fn new(capacity: usize) -> Self {
        Self {
            entries: VecDeque::new(),
            capacity,
        }
    }

    /// Record an IPC command call with optional duration and error.
    ///
    /// Security: entries MUST contain only command names, timing, and error strings.
    /// Vault file content, vault paths, and note text MUST NOT be stored here.
    pub fn record_ipc(&mut self, command: &str, duration_ms: Option<u64>, error: Option<String>) {
        let level = if error.is_some() {
            InteractionLevel::Error
        } else {
            InteractionLevel::Info
        };
        let message = match &error {
            Some(e) => format!("IPC {} failed: {}", command, e),
            None => format!("IPC {}", command),
        };
        self.push(InteractionEntry {
            timestamp: Utc::now(),
            level,
            category: "ipc".to_string(),
            message,
            command: Some(command.to_string()),
            duration_ms,
            error,
        });
    }

    /// Record a general event with explicit level and category.
    pub fn record(&mut self, level: InteractionLevel, category: &str, message: &str) {
        self.push(InteractionEntry {
            timestamp: Utc::now(),
            level,
            category: category.to_string(),
            message: message.to_string(),
            command: None,
            duration_ms: None,
            error: None,
        });
    }

    /// Returns the most recent `limit` entries, optionally filtered by level name.
    pub fn recent(&self, limit: usize, level: Option<&str>) -> Vec<&InteractionEntry> {
        let level_upper = level.map(|s| s.to_uppercase());
        self.entries
            .iter()
            .rev()
            .filter(|e| {
                level_upper
                    .as_deref()
                    .map_or(true, |l| e.level.as_str() == l)
            })
            .take(limit)
            .collect()
    }

    fn push(&mut self, entry: InteractionEntry) {
        if self.entries.len() >= self.capacity {
            self.entries.pop_front();
        }
        self.entries.push_back(entry);
    }
}

// ─── Structured logging macro ───────────────────────────────────────────────────

#[macro_export]
macro_rules! log_with_context {
    (debug, $msg:expr, $($key:tt = $value:expr),*) => {
        tracing::debug!($msg, $($key = ?$value),*);
    };
    (info, $msg:expr, $($key:tt = $value:expr),*) => {
        tracing::info!($msg, $($key = ?$value),*);
    };
    (warn, $msg:expr, $($key:tt = $value:expr),*) => {
        tracing::warn!($msg, $($key = ?$value),*);
    };
    (error, $msg:expr, $($key:tt = $value:expr),*) => {
        tracing::error!($msg, $($key = ?$value),*);
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_logger_initialization() {
        let temp_dir = tempdir().unwrap();
        let result = init_logger(Some(temp_dir.path().join("logs")));
        assert!(result.is_ok());
    }

    #[test]
    fn test_interaction_log_ring_buffer() {
        let mut log = InteractionLog::new(3);
        log.record(InteractionLevel::Info, "test", "a");
        log.record(InteractionLevel::Info, "test", "b");
        log.record(InteractionLevel::Info, "test", "c");
        log.record(InteractionLevel::Info, "test", "d");
        assert_eq!(log.entries.len(), 3);
        assert_eq!(log.entries.front().unwrap().message, "b");
    }

    #[test]
    fn test_interaction_log_level_filter() {
        let mut log = InteractionLog::default();
        log.record(InteractionLevel::Info, "ipc", "ok");
        log.record(InteractionLevel::Error, "ipc", "fail");
        let errors = log.recent(10, Some("ERROR"));
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].message, "fail");
    }

    #[test]
    fn test_record_ipc_success() {
        let mut log = InteractionLog::default();
        log.record_ipc("search_vault", Some(12), None);
        let entries = log.recent(1, None);
        assert_eq!(entries[0].command.as_deref(), Some("search_vault"));
        assert_eq!(entries[0].duration_ms, Some(12));
    }
}
