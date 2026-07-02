//! RSS feed Tauri command stubs.
//!
//! These stubs satisfy the IPC surface required by the RSS frontend store and
//! service layer. Full feed-rs + reqwest parsing will replace the stub bodies
//! once the RSS backend implementation lands (T022 — full implementation).
//!
//! File layout mirrors `.bismuth/rss/feeds.json` for persistence.

use std::fs;
use std::path::PathBuf;

/// Returns the path to the RSS feeds config file for this vault.
fn feeds_path(vault_path: &str) -> PathBuf {
    PathBuf::from(vault_path).join(".bismuth").join("rss").join("feeds.json")
}

/// Read the feeds list from disk.  Returns an empty array when the file does not
/// exist yet (first run) rather than propagating an error.
fn read_feeds_raw(vault_path: &str) -> Result<Vec<String>, String> {
    let path = feeds_path(vault_path);
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str::<Vec<String>>(&raw).map_err(|e| e.to_string())
}

/// Write the feeds list to disk, creating parent directories as needed.
fn write_feeds_raw(vault_path: &str, feeds: &[String]) -> Result<(), String> {
    let path = feeds_path(vault_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let serialized = serde_json::to_string_pretty(feeds).map_err(|e| e.to_string())?;
    fs::write(&path, serialized).map_err(|e| e.to_string())
}

/// Get all subscribed feeds.
#[tauri::command]
pub async fn rss_get_feeds(vault_path: String) -> Result<Vec<String>, String> {
    read_feeds_raw(&vault_path)
}

/// Add a feed URL to the vault's subscription list.
#[tauri::command]
pub async fn rss_add_feed(vault_path: String, url: String) -> Result<(), String> {
    let mut feeds = read_feeds_raw(&vault_path)?;
    if !feeds.contains(&url) {
        feeds.push(url);
        write_feeds_raw(&vault_path, &feeds)?;
    }
    Ok(())
}

/// Remove a feed URL from the vault's subscription list.
#[tauri::command]
pub async fn rss_remove_feed(vault_path: String, url: String) -> Result<(), String> {
    let mut feeds = read_feeds_raw(&vault_path)?;
    feeds.retain(|f| f != &url);
    write_feeds_raw(&vault_path, &feeds)?;
    Ok(())
}

/// Return cached articles for the given feed.
/// Stub: returns an empty list until full feed-rs implementation.
#[tauri::command]
pub async fn rss_get_articles(
    _feed_id: Option<String>,
    _unread_only: bool,
    _limit: i64,
    _offset: i64,
) -> Result<Vec<String>, String> {
    Ok(vec![])
}

/// Refresh all feeds — stub returns current feed list.
#[tauri::command]
pub async fn rss_refresh_all(vault_path: String) -> Result<Vec<String>, String> {
    read_feeds_raw(&vault_path)
}

/// Refresh a single feed — stub returns empty.
#[tauri::command]
pub async fn rss_refresh_feed(_feed_id: String) -> Result<(), String> {
    Ok(())
}

/// Mark an article as read/unread — stub.
#[tauri::command]
pub async fn rss_mark_read(_article_id: String, _read: bool) -> Result<(), String> {
    Ok(())
}

/// Star/unstar an article — stub.
#[tauri::command]
pub async fn rss_toggle_star(_article_id: String, _starred: bool) -> Result<(), String> {
    Ok(())
}

/// Parse an OPML document and return all feed URLs found within it.
#[tauri::command]
pub async fn rss_import_opml(vault_path: String, opml_content: String) -> Result<Vec<String>, String> {
    let mut urls: Vec<String> = Vec::new();
    for part in opml_content.split("xmlUrl") {
        let rest = part.trim_start_matches(|c: char| c.is_whitespace() || c == '=');
        let rest = rest.trim_start_matches(|c: char| c.is_whitespace());
        let quote = rest.chars().next();
        if let Some(q @ '"') | Some(q @ '\'') = quote {
            let inner = &rest[1..];
            if let Some(end) = inner.find(q) {
                let url = inner[..end].trim().to_string();
                if !url.is_empty() && !urls.contains(&url) {
                    urls.push(url);
                }
            }
        }
    }
    let mut existing = read_feeds_raw(&vault_path)?;
    for url in &urls {
        if !existing.contains(url) {
            existing.push(url.clone());
        }
    }
    write_feeds_raw(&vault_path, &existing)?;
    Ok(urls)
}

/// Export subscriptions as OPML 2.0 document.
#[tauri::command]
pub async fn rss_export_opml(vault_path: String) -> Result<String, String> {
    let feeds = read_feeds_raw(&vault_path)?;
    let mut lines = vec![
        r#"<?xml version="1.0" encoding="UTF-8"?>"#.to_string(),
        r#"<opml version="2.0">"#.to_string(),
        r#"  <head><title>Bismuth RSS Subscriptions</title></head>"#.to_string(),
        r#"  <body>"#.to_string(),
    ];
    for url in &feeds {
        let escaped = url
            .replace('&', "&amp;")
            .replace('"', "&quot;")
            .replace('<', "&lt;")
            .replace('>', "&gt;");
        lines.push(format!(r#"    <outline type="rss" xmlUrl="{escaped}" />"#));
    }
    lines.push("  </body>".to_string());
    lines.push("</opml>".to_string());
    Ok(lines.join("\n"))
}
