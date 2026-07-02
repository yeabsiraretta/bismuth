//! Tauri IPC handler registration — all command groups in one place.

use crate::commands::backup::*;
use crate::commands::content::lifecycle::*;
use crate::commands::content::layout_presets::*;
use crate::commands::content::link_embed::*;
use crate::commands::content::recipe_grabber::*;
use crate::commands::content::periodic_notes::*;
use crate::commands::content::properties::*;
use crate::commands::content::publish::*;
use crate::commands::content::tasks::*;
use crate::commands::design::canvas::*;
use crate::commands::design::component::*;
use crate::commands::design::design_doc::*;
use crate::commands::embedding_commands::*;
use crate::commands::git_commands::*;
use crate::commands::gym::workout::*;
use crate::commands::knowledge::backlinks::*;
use crate::commands::knowledge::entity::*;
use crate::commands::knowledge::graph::*;
use crate::commands::knowledge::graph_layout::*;
use crate::commands::knowledge::tag::*;
use crate::commands::knowledge::wikilink::*;
use crate::commands::linting_commands::*;
use crate::commands::llm::config::*;
use crate::commands::llm::changes::*;
use crate::commands::music::*;
use crate::commands::nas::webdav::*;
use crate::commands::ocr::*;
use crate::commands::plugin_commands::*;
use crate::commands::rss::feeds::*;
use crate::commands::search_commands::*;
use crate::commands::spreadsheet::files::*;
use crate::commands::system::updates::*;
use crate::commands::system::keychain::*;
use crate::commands::system::themes::*;
use crate::commands::template_commands::*;
use crate::commands::theme_commands::*;
use crate::commands::vault_commands::*;
use crate::commands::versioning::version::*;
use crate::commands::study::*;

pub fn all() -> impl Fn(tauri::ipc::Invoke) -> bool {
    tauri::generate_handler![
        // Vault commands
        open_vault,
        create_vault,
        create_vault_from_template,
        get_current_vault,
        scan_vault,
        scan_vault_meta,
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
        batch_update_frontmatter_field,
        create_folder,
        move_folder,
        export_vault_markdown,
        parse_frontmatter,
        get_note_tags,
        read_file_text,
        get_custom_entity_types,
        // Navigator state persistence
        read_navigator_state,
        write_navigator_state,
        // Search commands
        search_vault,
        advanced_search,
        search_in_file,
        search_notes,
        // Graph commands
        get_graph_data,
        get_graph_backlinks,
        compute_graph_layout,
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
        load_custom_tokens,
        save_custom_tokens,
        scan_style_settings,
        // Template commands
        initialize_template_service,
        list_templates,
        render_template,
        create_from_template,
        save_template,
        delete_template,
        // Git commands
        initialize_git_service,
        git_current_branch,
        git_list_branches,
        git_status,
        git_add,
        git_commit,
        git_log,
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
        // Design document commands
        design_doc_read,
        design_doc_write,
        design_doc_list,
        design_doc_delete,
        // Task commands
        get_all_tasks,
        get_tasks_filtered,
        get_task_projects,
        update_task_status,
        execute_task_query,
        // Changelog commands
        changelog_append,
        changelog_recent,
        // Linting commands
        lint_note_text,
        // Versioning commands
        compute_version_diff_metrics,
        bump_version,
        save_note_version,
        list_note_versions,
        get_note_diff,
        // Spreadsheet commands
        read_csv,
        write_csv,
        read_json_table,
        write_json,
        // Gym commands
        gym_list_exercises,
        gym_create_session,
        gym_update_session,
        gym_delete_session,
        gym_add_set,
        gym_delete_set,
        gym_list_sessions,
        gym_get_sessions_for_date,
        gym_get_weekly_volume,
        gym_get_strength_progression,
        gym_get_personal_records,
        gym_create_exercise,
        gym_add_nutrition,
        gym_delete_nutrition,
        gym_get_nutrition,
        gym_get_weekly_macros,
        gym_list_templates,
        gym_save_template,
        // LLM commands
        read_vault_llm_config,
        write_vault_llm_config,
        list_proposed_changes,
        list_agent_changes,
        apply_change,
        reject_change,
        // Music commands
        create_music_document,
        load_music_document,
        save_music_document,
        list_music_documents,
        delete_music_document,
        split_stems,
        // OCR commands
        import_image,
        cleanup_ocr_temp,
        append_ocr_correction,
        get_ocr_corrections,
        // System commands (version, keychain, themes)
        check_app_version,
        set_app_locale,
        set_secret,
        get_secret,
        delete_secret,
        list_local_themes,
        import_theme_folder,
        // NAS / WebDAV commands
        read_nas_config,
        write_nas_config,
        connect_webdav,
        test_nas_connection,
        list_remote,
        sync_vault,
        nas_apply_change,
        nas_cancel_sync,
        // Layout preset commands
        save_layout_preset,
        load_layout_presets,
        delete_layout_preset,
        // Publishing commands
        scan_publishable_notes,
        publish_site,
        toggle_publish_flag,
        get_publish_config,
        save_publish_config,
        // Link embed commands
        fetch_url_metadata,
        // Recipe grabber
        fetch_recipe_from_url,
        // Periodic note commands
        open_or_create_periodic_note,
        get_periodic_notes_for_range,
        // RSS commands
        rss_get_feeds,
        rss_add_feed,
        rss_remove_feed,
        rss_get_articles,
        rss_refresh_all,
        rss_refresh_feed,
        rss_mark_read,
        rss_toggle_star,
        rss_import_opml,
        rss_export_opml,
        // Study Vault commands
        list_courses,
        save_course,
        delete_course,
        list_study_topics,
        save_study_topic,
        // Backup commands
        backup_create,
        backup_list,
        backup_delete,
        backup_get_config,
        backup_save_config,
    ]
}
