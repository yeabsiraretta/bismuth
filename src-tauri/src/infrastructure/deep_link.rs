//! `bismuth://` deep-link URI scheme handler.
//!
//! Supported URIs:
//!   - `bismuth://open/{path}`   → open a note in the editor
//!   - `bismuth://search/{query}` → search the vault
//!   - `bismuth://new/{title}`   → create a new note
//!   - `bismuth://vault`         → focus the app window

use tauri::{AppHandle, Emitter};

/// Parse an incoming deep-link URL and emit the appropriate frontend event.
pub fn handle_deep_link(app: &AppHandle, urls: Vec<String>) {
    for raw in urls {
        tracing::info!(uri = %raw, "Deep link received");

        // Expected format: bismuth://action/path
        let stripped = match raw.strip_prefix("bismuth://") {
            Some(s) => s,
            None => {
                tracing::warn!(uri = %raw, "Ignoring non-bismuth URI");
                continue;
            }
        };

        let (host, path) = match stripped.split_once('/') {
            Some((h, p)) => (h, p),
            None => (stripped, ""),
        };

        match host {
            "open" => {
                if !path.is_empty() {
                    tracing::debug!(note_path = path, "Deep link: open note");
                    let _ = app.emit("deep-link:open-note", path.to_string());
                }
            }
            "search" => {
                let query = if path.is_empty() {
                    String::new()
                } else {
                    percent_decode(path)
                };
                tracing::debug!(query = %query, "Deep link: search");
                let _ = app.emit("deep-link:search", query);
            }
            "new" => {
                let title = if path.is_empty() {
                    "Untitled".to_string()
                } else {
                    percent_decode(path)
                };
                tracing::debug!(title = %title, "Deep link: new note");
                let _ = app.emit("deep-link:new-note", title);
            }
            "vault" => {
                tracing::debug!("Deep link: focus vault");
                let _ = app.emit("deep-link:focus", ());
            }
            _ => {
                tracing::warn!(host, path, "Unknown deep link action");
            }
        }
    }
}

fn percent_decode(s: &str) -> String {
    urlencoding_decode(s)
}

/// Simple percent-decoding without pulling in another crate.
fn urlencoding_decode(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let mut chars = input.bytes();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let hi = chars.next().unwrap_or(b'0');
            let lo = chars.next().unwrap_or(b'0');
            let val = hex_val(hi) << 4 | hex_val(lo);
            result.push(val as char);
        } else if b == b'+' {
            result.push(' ');
        } else {
            result.push(b as char);
        }
    }
    result
}

fn hex_val(b: u8) -> u8 {
    match b {
        b'0'..=b'9' => b - b'0',
        b'a'..=b'f' => b - b'a' + 10,
        b'A'..=b'F' => b - b'A' + 10,
        _ => 0,
    }
}
