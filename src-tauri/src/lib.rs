pub mod app;
pub mod hubs;
pub mod infrastructure;
pub mod platform;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    app::build()
        .run(tauri::generate_context!())
        .expect("error while running bismuth");
}
