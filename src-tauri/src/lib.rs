//! Bismuth PKM Editor Library
//!
//! Core library for the Bismuth Personal Knowledge Management Editor.
//! Provides data models, services, and utilities for managing markdown notes,
//! wikilinks, search indexing, and vault operations.

pub mod commands;
pub mod config;
pub mod db;
pub mod error;
pub mod logger;
pub mod models;
pub mod services;
pub mod utils;

// Re-export commonly used types
pub use commands::*;
pub use config::AppSettings;
pub use db::Database;
pub use error::{BismuthError, Result};
pub use services::{CanvasService, VaultService, WikilinkService};
