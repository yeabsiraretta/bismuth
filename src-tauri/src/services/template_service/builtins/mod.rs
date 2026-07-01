//! Builtin template modules: date, file, frontmatter, app, system, config.
//!
//! Security: file.* validates all paths against vault root.
//! No dynamic code loading. No eval. No network (web module uses allowlist).

pub mod date;
pub mod file;
pub mod frontmatter;
pub mod system;

use std::collections::HashMap;
use std::path::Path;

/// Dispatch a builtin module.function call.
/// Returns None if the module/function combination is not recognized.
pub fn call_builtin(
    module: &str,
    func: &str,
    _args: &[&str],
    context: &HashMap<String, String>,
    vault_root: &Path,
) -> Option<String> {
    match module {
        "date" => date::call(func),
        "file" => file::call(func, context, vault_root),
        "system" | "sys" => system::call(func),
        "frontmatter" | "fm" => frontmatter::call(func, context),
        "app" => call_app(func, vault_root),
        "config" => call_config(func, context),
        _ => None,
    }
}

/// App module: vault.name, vault.path, version, platform.
fn call_app(func: &str, vault_root: &Path) -> Option<String> {
    match func {
        "version" => Some(env!("CARGO_PKG_VERSION").to_string()),
        "platform" => Some(std::env::consts::OS.to_string()),
        "vault_name" | "name" => {
            vault_root.file_name()
                .map(|n| n.to_string_lossy().to_string())
        }
        "vault_path" | "path" => Some(vault_root.to_string_lossy().to_string()),
        _ => None,
    }
}

/// Config module: get context values by key.
fn call_config(func: &str, context: &HashMap<String, String>) -> Option<String> {
    match func {
        "get" => None, // Needs arg — simplified
        _ => context.get(&format!("config.{}", func)).cloned(),
    }
}
