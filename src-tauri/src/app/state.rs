//! Application state initialization.
//!
//! Creates all managed state objects that Tauri needs for IPC command handlers.

use crate::commands::canvas_commands::CanvasState;
use crate::commands::component_commands::ComponentState;
use crate::commands::embedding_commands::EmbeddingState;
use crate::commands::entity_commands::EntityState;
use crate::commands::plugin_commands::PluginState;
use crate::commands::theme_commands::ThemeState;
use crate::commands::wikilink_commands::WikilinkState;
use crate::commands::{AppState, GraphState, SearchState};
use crate::{CanvasService, Database, VaultService, WikilinkService};
use std::sync::{Arc, Mutex};

/// All managed state objects for the Tauri application.
pub struct ManagedState {
    pub app: AppState,
    pub search: SearchState,
    pub graph: GraphState,
    pub wikilink: WikilinkState,
    pub canvas: CanvasState,
    pub entity: EntityState,
    pub theme: ThemeState,
    pub plugin: PluginState,
    pub embedding: EmbeddingState,
    pub component: ComponentState,
}

/// Initializes all application state from the database connection.
pub fn init(db: Arc<Database>) -> ManagedState {
    let vault_service = VaultService::new(db.clone());

    let app = AppState {
        vault_service: Mutex::new(vault_service),
    };

    let search = SearchState {
        index_service: Mutex::new(None),
    };

    let graph = GraphState { db: db.clone() };

    let wikilink_vault_service = VaultService::new(db.clone());
    let wikilink = WikilinkState {
        wikilink_service: Arc::new(WikilinkService::new()),
        vault_service: Arc::new(Mutex::new(wikilink_vault_service)),
    };

    let canvas_service = CanvasService::new(db.clone());
    let canvas = CanvasState {
        canvas_service: Arc::new(Mutex::new(canvas_service)),
    };

    let entity = EntityState {
        entity_service: Mutex::new(None),
    };

    let theme = ThemeState {
        theme_service: Mutex::new(None),
    };

    let plugin = PluginState {
        plugin_service: Mutex::new(None),
    };

    let embedding = EmbeddingState {
        embedding_service: Mutex::new(None),
    };

    let component = ComponentState {
        vault_root: Mutex::new(None),
    };

    ManagedState {
        app,
        search,
        graph,
        wikilink,
        canvas,
        entity,
        theme,
        plugin,
        embedding,
        component,
    }
}
