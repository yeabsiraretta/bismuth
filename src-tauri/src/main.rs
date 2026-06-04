//! Bismuth PKM Editor — Application Entry Point
//!
//! Initializes the Tauri runtime, database, and all managed state objects,
//! then registers IPC command handlers and launches the application window.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bismuth::commands::backlinks_commands::*;
use bismuth::commands::canvas_commands::CanvasState;
use bismuth::commands::canvas_commands::*;
use bismuth::commands::embedding_commands::EmbeddingState;
use bismuth::commands::embedding_commands::*;
use bismuth::commands::entity_commands::EntityState;
use bismuth::commands::entity_commands::*;
use bismuth::commands::graph_commands::*;
use bismuth::commands::lifecycle_commands::*;
use bismuth::commands::plugin_commands::PluginState;
use bismuth::commands::plugin_commands::*;
use bismuth::commands::property_commands::*;
use bismuth::commands::search_commands::*;
use bismuth::commands::tag_commands::*;
use bismuth::commands::theme_commands::ThemeState;
use bismuth::commands::theme_commands::*;
use bismuth::commands::vault_commands::*;
use bismuth::commands::wikilink_commands::WikilinkState;
use bismuth::commands::wikilink_commands::*;
use bismuth::commands::{AppState, GraphState, SearchState};
use bismuth::{CanvasService, Database, VaultService, WikilinkService};
use std::sync::{Arc, Mutex};

fn main() {
    // Initialize logger
    let log_dir = std::env::current_dir()
        .unwrap()
        .join(".bismuth")
        .join("logs");

    bismuth::logger::init_logger(Some(log_dir)).expect("Failed to initialize logger");

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

    // Create entity state (initialized lazily when vault is opened)
    let entity_state = EntityState {
        entity_service: Mutex::new(None),
    };

    // Create theme state (initialized lazily when vault is opened)
    let theme_state = ThemeState {
        theme_service: Mutex::new(None),
    };

    // Create plugin state (initialized lazily when vault is opened)
    let plugin_state = PluginState {
        plugin_service: Mutex::new(None),
    };

    // Create embedding state (initialized lazily when vault is opened)
    let embedding_state = EmbeddingState {
        embedding_service: Mutex::new(None),
    };

    tauri::Builder::default()
        .manage(app_state)
        .manage(search_state)
        .manage(graph_state)
        .manage(wikilink_state)
        .manage(canvas_state)
        .manage(entity_state)
        .manage(theme_state)
        .manage(plugin_state)
        .manage(embedding_state)
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
            open_in_file_manager,
            update_frontmatter_field,
            get_custom_entity_types,
            // Search commands
            search_vault,
            advanced_search,
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
            rename_tag,
            merge_tags,
            get_random_note_with_tag,
            // Property commands
            get_all_properties,
            get_property_values,
            // Wikilink commands
            find_unlinked_references,
            get_concept_suggestions,
            get_notes_by_property,
            search_properties,
            // Canvas commands
            create_canvas,
            save_canvas,
            load_canvas,
            list_canvases,
            delete_canvas,
            // Entity commands
            get_entity_types,
            get_type_definition,
            get_entity_relationships,
            // Lifecycle commands
            get_captured_notes,
            get_lifecycle_stats,
            quick_capture,
            archive_note,
            organize_note,
            // Theme commands
            get_available_themes,
            load_theme,
            get_theme_style_settings,
            initialize_theme_service,
            // Plugin commands
            initialize_plugins,
            get_plugins,
            set_plugin_enabled,
            // Embedding commands
            initialize_embeddings,
            embed_note,
            index_all_embeddings,
            get_similar_notes,
            lookup_by_text,
            get_embedding_config,
            set_embedding_config,
            get_embedding_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
