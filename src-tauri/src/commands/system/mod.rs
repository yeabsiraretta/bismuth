//! System-level IPC commands: version/update checking, app configuration, themes.

pub mod keychain;
pub mod updates;
pub mod themes;

pub use updates::{check_app_version, set_app_locale};
pub use keychain::{set_secret, get_secret, delete_secret};
pub use themes::{list_local_themes, import_theme_folder};
