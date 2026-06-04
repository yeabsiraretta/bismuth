//! Robust logging module for Bismuth backend
//! Uses the `tracing` crate for structured logging with file rotation

use std::path::PathBuf;
use tracing::Level;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    EnvFilter, Layer, Registry,
};

/// Initialize the logging system
pub fn init_logger(log_dir: Option<PathBuf>) -> Result<(), Box<dyn std::error::Error>> {
    // Determine log directory
    let log_path = log_dir.unwrap_or_else(|| {
        let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        path.push(".bismuth");
        path.push("logs");
        path
    });

    // Create log directory if it doesn't exist
    std::fs::create_dir_all(&log_path)?;

    // File appender with daily rotation
    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_path, "bismuth.log");

    // File layer - logs everything to file
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

    // Console layer - logs to stdout with colors
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

    // Combine layers
    let subscriber = Registry::default()
        .with(file_layer)
        .with(console_layer);

    // Set as global default
    tracing::subscriber::set_global_default(subscriber)?;

    tracing::info!("Logger initialized. Logs directory: {:?}", log_path);

    Ok(())
}

/// Macro for structured logging with context
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
        let log_dir = temp_dir.path().join("logs");

        let result = init_logger(Some(log_dir.clone()));
        assert!(result.is_ok());
        assert!(log_dir.exists());
    }
}
