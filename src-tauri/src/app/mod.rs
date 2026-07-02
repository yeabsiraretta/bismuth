//! Application bootstrap: Tauri builder, state, plugins, and the local HTTP server.

pub mod handlers;
pub mod state;

use crate::services::search::search_server::{SearchServer, SearchServerConfig};
use crate::Database;
use std::sync::Arc;
use tauri::Listener;
use tauri::Manager;
use tokio::sync::Mutex as TokioMutex;

/// Builds and runs the Tauri application, spawning the local HTTP server beforehand.
pub fn run(db: Arc<Database>) {
    let _startup_span = tracing::info_span!("bismuth_startup").entered();
    tracing::info!("Application startup: initializing state");

    let managed = state::init(db);
    let interaction_log = managed.interaction_log.clone();

    let index_for_server = Arc::new(TokioMutex::new(None));
    let server_index = index_for_server.clone();
    let server_log = interaction_log.clone();

    let runtime = tokio::runtime::Handle::try_current()
        .ok()
        .unwrap_or_else(|| tokio::runtime::Runtime::new().unwrap().handle().clone());

    // Generate a per-session bearer token for agent REST endpoints.
    // The token is a UUID v4 — strong enough for localhost-only use.
    let session_token = uuid::Uuid::new_v4().to_string();
    // Vault root is empty at process start; agents should only connect after a vault is opened.
    // The server accepts an empty vault_root and returns 503/404 on vault-dependent routes.
    let vault_root_for_server = String::new();
    tracing::info!("Agent REST token generated (not logged for security)");

    runtime.spawn(async move {
        match SearchServer::start(
            server_index,
            server_log,
            SearchServerConfig::default(),
            vault_root_for_server,
            session_token,
        )
        .await
        {
            Ok(server) => {
                tracing::info!("Bismuth local server started on port {}", server.port);
                // Intentional: forget keeps the server alive for the full process lifetime.
                // Server failure is non-fatal — the app runs correctly without it.
                // Follow-up (R3): move server handle into ManagedState for clean Drop on Tauri shutdown.
                std::mem::forget(server);
            }
            Err(e) => tracing::warn!("Could not start local server: {}", e),
        }
    });

    tracing::info!("Application startup: launching Tauri window");

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
        .manage(managed.git)
        .manage(managed.template)
        .manage(interaction_log)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        // tauri-plugin-keychain: deferred — keychain operations use OS stubs until
        // a stable Tauri v2 keychain plugin is available. See specs/037-settings-overhaul T048.
        .invoke_handler(handlers::all())
        .setup(|app| {
            tracing::info!(
                "Application startup: Tauri setup complete — waiting for JS ready signal"
            );
            // Show window only after JS signals it's ready (prevents white flash on startup)
            let window = app
                .get_webview_window("main")
                .expect("main window must exist");
            let win = window.clone();
            app.listen("app-ready", move |_| {
                tracing::info!("Application startup: JS ready — showing window");
                let _ = win.show();
                let _ = win.set_focus();
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
