//! Spreadsheet CSV/JSON command module (Spec 042)
//!
//! Delegates to `spreadsheet_service` for all file I/O.
//! No business logic lives here — only thin IPC wrappers.

pub mod files;

pub use files::*;
