use std::sync::Arc;

use axum::routing::post;
use tauri::{Listener, Manager};
use tauri_plugin_log::{Target, TargetKind};

use crate::hubs;
use crate::infrastructure::api_server;
use crate::infrastructure::deep_link;
use crate::infrastructure::events;
use crate::infrastructure::mcp_server;
use crate::infrastructure::state::AppState;
use crate::platform::menu;
use crate::platform::tray;

pub fn build() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Create shared state — cloneable because vault RwLock is Arc-wrapped.
            let state = AppState::default();
            app.manage(state.clone());

            menu::setup(app)?;
            tray::setup(app)?;
            tracing::info!("Bismuth {} started", env!("CARGO_PKG_VERSION"));

            // Start the local HTTP API + MCP server in the background.
            let api_state = Arc::new(state);
            let mcp_route = axum::Router::new()
                .route("/mcp", post(mcp_server::mcp_handler))
                .with_state(api_state.clone());
            let api_router = api_server::build_router(api_state).merge(mcp_route);

            tauri::async_runtime::spawn(async move {
                let addr = format!("127.0.0.1:{}", api_server::API_PORT);
                tracing::info!(addr = %addr, "Starting local HTTP API + MCP server");
                let listener = match tokio::net::TcpListener::bind(&addr).await {
                    Ok(l) => l,
                    Err(e) => {
                        tracing::warn!(error = %e, "Failed to bind API server — API disabled");
                        return;
                    }
                };
                if let Err(e) = axum::serve(listener, api_router).await {
                    tracing::error!(error = %e, "API server exited with error");
                }
            });

            // Register deep-link handler.
            let handle = app.handle().clone();
            app.listen("deep-link://new-url", move |event| {
                if let Ok(urls) = serde_json::from_str::<Vec<String>>(event.payload()) {
                    deep_link::handle_deep_link(&handle, urls);
                } else {
                    tracing::warn!(payload = event.payload(), "Failed to parse deep-link URLs");
                }
            });

            let handle2 = app.handle().clone();
            events::emit_event(&handle2, events::channels::APP_READY, "initialized")
                .unwrap_or_else(|e| tracing::warn!("Failed to emit app:ready: {e}"));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hubs::core::commands::greet,
            hubs::core::commands::get_app_info,
            hubs::core::commands::open_vault,
            hubs::core::commands::create_vault,
            hubs::core::commands::scan_vault,
            hubs::core::commands::read_note,
            hubs::core::commands::write_note,
            hubs::core::commands::create_note,
            hubs::core::commands::delete_note,
            hubs::core::commands::rename_note,
            hubs::core::commands::search_vault,
            hubs::core::commands::list_versions,
            hubs::core::commands::create_version,
            hubs::core::commands::read_version,
            hubs::core::commands::delete_version,
            hubs::core::commands::git_status,
            hubs::core::commands::git_stage_all,
            hubs::core::commands::git_commit,
            hubs::core::commands::git_push,
            hubs::core::commands::git_pull,
            hubs::core::commands::import_notes,
            hubs::core::commands::create_backup,
            hubs::core::commands::list_backups,
            hubs::core::commands::delete_backup,
            hubs::core::commands::publish_notes,
            hubs::core::commands::compute_vault_stats,
            hubs::core::commands::batch_read_notes,
            hubs::core::commands::build_graph_data,
            hubs::core::commands::extract_vault_tags,
            hubs::core::commands::fetch_url,
            hubs::core::commands::find_similar_notes,
            hubs::core::commands::find_similar_to_text,
        ])
}
