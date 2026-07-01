//! NAS IPC command handlers — thin shims over `services/nas_service`.
//!
//! Command handlers load config and credentials, then delegate to service functions.
//! No business logic lives here.

pub mod webdav;

pub use webdav::*;
