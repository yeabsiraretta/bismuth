use tauri::{
    menu::{MenuBuilder, MenuItem, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, Wry,
};

use crate::infrastructure::error::AppResult;

fn emit_to_main(app: &AppHandle, event: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit(event, ());
    }
}

pub fn setup(app: &tauri::App) -> AppResult<()> {
    let menu = build_menu(app)?;
    app.set_menu(menu)?;
    app.on_menu_event(handle_menu_event);
    Ok(())
}

fn build_menu(app: &tauri::App) -> AppResult<tauri::menu::Menu<Wry>> {
    let about_menu = SubmenuBuilder::new(app, "Bismuth")
        .about(None)
        .separator()
        .item(&MenuItem::with_id(
            app,
            "settings",
            "Settings…",
            true,
            Some("CmdOrCtrl+,"),
        )?)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItem::with_id(
            app,
            "new_note",
            "New Note",
            true,
            Some("CmdOrCtrl+N"),
        )?)
        .item(&MenuItem::with_id(
            app,
            "open_vault",
            "Open Vault…",
            true,
            Some("CmdOrCtrl+O"),
        )?)
        .separator()
        .item(&MenuItem::with_id(
            app,
            "rescan_vault",
            "Rescan Vault",
            true,
            Some("CmdOrCtrl+Shift+R"),
        )?)
        .item(&MenuItem::with_id(
            app,
            "close_vault",
            "Close Vault",
            true,
            None::<&str>,
        )?)
        .separator()
        .close_window()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .item(&MenuItem::with_id(
            app,
            "find",
            "Find",
            true,
            Some("CmdOrCtrl+F"),
        )?)
        .item(&MenuItem::with_id(
            app,
            "replace",
            "Find and Replace",
            true,
            Some("CmdOrCtrl+Shift+F"),
        )?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&MenuItem::with_id(
            app,
            "toggle_sidebar",
            "Toggle Sidebar",
            true,
            Some("CmdOrCtrl+B"),
        )?)
        .item(&MenuItem::with_id(
            app,
            "new_canvas",
            "New Canvas",
            true,
            None::<&str>,
        )?)
        .separator()
        .item(&MenuItem::with_id(
            app,
            "zoom_in",
            "Zoom In",
            true,
            Some("CmdOrCtrl+="),
        )?)
        .item(&MenuItem::with_id(
            app,
            "zoom_out",
            "Zoom Out",
            true,
            Some("CmdOrCtrl+-"),
        )?)
        .item(&MenuItem::with_id(
            app,
            "zoom_reset",
            "Reset Zoom",
            true,
            Some("CmdOrCtrl+0"),
        )?)
        .separator()
        .item(&MenuItem::with_id(
            app,
            "command_palette",
            "Command Palette",
            true,
            Some("CmdOrCtrl+P"),
        )?)
        .separator()
        .fullscreen()
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .item(&PredefinedMenuItem::maximize(app, None)?)
        .separator()
        .close_window()
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .text("docs", "Documentation")
        .text("changelog", "Changelog")
        .separator()
        .text("report_issue", "Report Issue")
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[
            &about_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ])
        .build()?;

    Ok(menu)
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().0.as_str();
    tracing::debug!(menu_item = id, "Menu event");

    match id {
        "new_note" => emit_to_main(app, "menu:new-note"),
        "open_vault" => emit_to_main(app, "menu:open-vault"),
        "rescan_vault" => emit_to_main(app, "menu:rescan-vault"),
        "close_vault" => emit_to_main(app, "menu:close-vault"),
        "settings" => emit_to_main(app, "menu:open-settings"),
        "find" => emit_to_main(app, "menu:find"),
        "replace" => emit_to_main(app, "menu:replace"),
        "toggle_sidebar" => emit_to_main(app, "menu:toggle-sidebar"),
        "new_canvas" => emit_to_main(app, "menu:new-canvas"),
        "zoom_in" => emit_to_main(app, "menu:zoom-in"),
        "zoom_out" => emit_to_main(app, "menu:zoom-out"),
        "zoom_reset" => emit_to_main(app, "menu:zoom-reset"),
        "command_palette" => emit_to_main(app, "menu:command-palette"),
        "docs" => {
            let _ = tauri_plugin_opener::open_url("https://bismuth.app/docs", None::<&str>);
        }
        "changelog" => {
            let _ = tauri_plugin_opener::open_url(
                "https://github.com/yeabsiramoges/bismuth/blob/main/CHANGELOG.md",
                None::<&str>,
            );
        }
        "report_issue" => {
            let _ = tauri_plugin_opener::open_url(
                "https://github.com/yeabsiramoges/bismuth/issues/new",
                None::<&str>,
            );
        }
        _ => {
            tracing::debug!(menu_item = id, "Unhandled menu event");
        }
    }
}
