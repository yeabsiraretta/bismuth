//! Bismuth PKM Editor — Application Entry Point

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bismuth::Database;
use std::sync::Arc;

fn main() {
    let log_dir = std::env::current_dir()
        .unwrap()
        .join(".bismuth")
        .join("logs");

    bismuth::logger::init_logger(Some(log_dir)).expect("Failed to initialize logger");

    tracing::info!("Smeltin' Bismuth");

    let db_path = std::env::current_dir()
        .unwrap()
        .join(".bismuth")
        .join("bismuth.db");

    let db = Arc::new(Database::new(&db_path).expect("Failed to initialize database"));

    tracing::info!("Database initialized at {:?}", db_path);

    bismuth::app::run(db);
}
