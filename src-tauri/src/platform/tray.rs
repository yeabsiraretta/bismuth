use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

use crate::infrastructure::error::AppResult;

fn focus_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn setup(app: &tauri::App) -> AppResult<()> {
    let show_i = MenuItem::with_id(app, "show", "Show Bismuth", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let new_note_i = MenuItem::with_id(app, "tray_new_note", "New Note", true, None::<&str>)?;
    let new_canvas_i = MenuItem::with_id(app, "tray_new_canvas", "New Canvas", true, None::<&str>)?;
    let open_vault_i =
        MenuItem::with_id(app, "tray_open_vault", "Open Vault…", true, None::<&str>)?;
    let close_vault_i =
        MenuItem::with_id(app, "tray_close_vault", "Close Vault", true, None::<&str>)?;
    let rescan_i = MenuItem::with_id(app, "tray_rescan", "Rescan Vault", true, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let settings_i = MenuItem::with_id(app, "tray_settings", "Settings…", true, None::<&str>)?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Bismuth", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &sep1,
            &new_note_i,
            &new_canvas_i,
            &open_vault_i,
            &close_vault_i,
            &rescan_i,
            &sep2,
            &settings_i,
            &sep3,
            &quit_i,
        ],
    )?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Bismuth")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                focus_main(app);
            },
            "tray_new_note" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:new-note", ());
                }
            },
            "tray_new_canvas" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:new-canvas", ());
                }
            },
            "tray_open_vault" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:open-vault", ());
                }
            },
            "tray_close_vault" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:close-vault", ());
                }
            },
            "tray_rescan" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:rescan-vault", ());
                }
            },
            "tray_settings" => {
                focus_main(app);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("menu:open-settings", ());
                }
            },
            "quit" => {
                app.exit(0);
            },
            other => {
                tracing::warn!("Unhandled tray menu item: {other}");
            },
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                focus_main(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
