// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bismuth::commands::vault_commands::*;
use bismuth::commands::search_commands::*;
use bismuth::commands::graph_commands::*;
use bismuth::commands::backlinks_commands::*;
use bismuth::commands::tag_commands::*;
use bismuth::commands::property_commands::*;
use bismuth::commands::wikilink_commands::*;
use bismuth::commands::canvas_commands::*;
use bismuth::commands::{AppState, SearchState, GraphState};
use bismuth::commands::wikilink_commands::WikilinkState;
use bismuth::commands::canvas_commands::CanvasState;
use bismuth::{Database, VaultService, WikilinkService, CanvasService};
use std::sync::{Arc, Mutex};

fn main() {
    // Initialize logger
    let log_dir = std::env::current_dir()
        .unwrap()
        .join(".bismuth")
        .join("logs");
    
    bismuth::logger::init_logger(Some(log_dir))
        .expect("Failed to initialize logger");

    tracing::info!("Starting Bismuth PKM Editor");

    // Initialize database
    let db_path = std::env::current_dir()
        .unwrap()
        .join(".bismuth")
        .join("bismuth.db");

    let db = Arc::new(Database::new(&db_path).expect("Failed to initialize database"));
    
    tracing::info!("Database initialized at {:?}", db_path);

    // Initialize vault service
    let vault_service = VaultService::new(db.clone());

    // Create app state
    let app_state = AppState {
        vault_service: Mutex::new(vault_service),
    };

    // Create search state (index service will be added later)
    let search_state = SearchState {
        index_service: Mutex::new(None),
    };

    // Create graph state
    let graph_state = GraphState { db: db.clone() };

    // Create wikilink state
    let wikilink_vault_service = VaultService::new(db.clone());
    let wikilink_state = WikilinkState {
        wikilink_service: Arc::new(WikilinkService::new()),
        vault_service: Arc::new(Mutex::new(wikilink_vault_service)),
    };

    // Create canvas state
    let canvas_service = CanvasService::new(db.clone());
    let canvas_state = CanvasState {
        canvas_service: Arc::new(Mutex::new(canvas_service)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .manage(search_state)
        .manage(graph_state)
        .manage(wikilink_state)
        .manage(canvas_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Vault commands
            open_vault,
            create_vault,
            create_vault_from_template,
            get_current_vault,
            scan_vault,
            read_note,
            write_note,
            delete_note,
            rename_note,
            list_folders,
            list_notes,
            duplicate_note,
            move_note,
            merge_notes,
            create_note,
            update_links_on_rename,
            create_note_from_wikilink,
            // Search commands
            search_vault,
            search_in_file,
            // Graph commands
            get_graph_data,
            get_graph_backlinks,
            // Backlinks commands
            get_backlinks,
            get_outgoing_links,
            create_link_from_mention,
            create_link_from_unlinked_mention,
            // Tag commands
            get_all_tags,
            get_notes_by_tag,
            get_tag_stats,
            search_tags,
            // Property commands
            get_all_properties,
            get_property_values,
            // Wikilink commands
            find_unlinked_references,
            get_notes_by_property,
            search_properties,
            // Canvas commands
            create_canvas,
            save_canvas,
            load_canvas,
            list_canvases,
            delete_canvas,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
