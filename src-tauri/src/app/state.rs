//! Application state initialisation.

use crate::commands::design::canvas::CanvasState;
use crate::commands::design::component::ComponentState;
use crate::commands::embedding_commands::EmbeddingState;
use crate::commands::git_commands::GitState;
use crate::commands::knowledge::entity::EntityState;
use crate::commands::knowledge::graph::GraphState;
use crate::commands::knowledge::wikilink::WikilinkState;
use crate::commands::plugin_commands::PluginState;
use crate::commands::search_commands::SearchState;
use crate::commands::template_commands::TemplateState;
use crate::commands::theme_commands::ThemeState;
use crate::commands::vault_commands::AppState;
use crate::logger::InteractionLog;
use crate::{CanvasService, Database, VaultService, WikilinkService};
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;

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
    pub git: GitState,
    pub template: TemplateState,
    /// Shared interaction log — read by HTTP server, written by IPC layer.
    pub interaction_log: Arc<TokioMutex<InteractionLog>>,
}

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
    let git = GitState {
        git_service: Mutex::new(None),
    };
    let template = TemplateState {
        template_service: Mutex::new(None),
    };
    let interaction_log = Arc::new(TokioMutex::new(InteractionLog::default()));

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
        git,
        template,
        interaction_log,
    }
}
