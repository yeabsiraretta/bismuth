//! Application bootstrap module.
//!
//! Encapsulates Tauri builder setup: state management, plugins, and command handlers.

pub mod handlers;
pub mod state;

use crate::Database;
use std::sync::Arc;

/// Builds and runs the Tauri application with all state and handlers registered.
pub fn run(db: Arc<Database>) {
    let managed = state::init(db);

    tauri::Builder::default()
        .manage(managed.app)
        .manage(managed.search)
        .manage(managed.graph)
        .manage(managed.wikilink)
        .manage(managed.canvas)
        .manage(managed.entity)
        .manage(managed.theme)
        .manage(managed.plugin)
        .manage(managed.embedding)
        .manage(managed.component)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(handlers::all())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
