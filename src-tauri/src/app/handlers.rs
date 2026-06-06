//! Command handler registration for the Tauri application.
//!
//! Groups all IPC command handlers by domain and provides them as a single
//! `generate_handler!` invocation.

use crate::commands::backlinks_commands::*;
use crate::commands::canvas_commands::*;
use crate::commands::component_commands::*;
use crate::commands::embedding_commands::*;
use crate::commands::entity_commands::*;
use crate::commands::graph_commands::*;
use crate::commands::lifecycle_commands::*;
use crate::commands::plugin_commands::*;
use crate::commands::property_commands::*;
use crate::commands::search_commands::*;
use crate::commands::tag_commands::*;
use crate::commands::theme_commands::*;
use crate::commands::vault_commands::*;
use crate::commands::wikilink_commands::*;

/// Returns the complete invoke handler with all command groups registered.
pub fn all() -> impl Fn(tauri::ipc::Invoke) -> bool {
    tauri::generate_handler![
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
        // Navigator state persistence
        read_navigator_state,
        write_navigator_state,
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
        // Canvas template commands
        save_canvas_template,
        load_canvas_template,
        list_canvas_templates,
        delete_canvas_template,
        // Canvas note-linking commands
        link_canvas_to_note,
        get_canvases_for_note,
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
        set_lifecycle_state,
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
        // Component commands
        list_components,
        read_component,
        save_component,
        delete_component,
    ]
}
